/**
 * Service phân tích mức độ cảnh báo theo LƯỢNG MƯA 24H
 * Theo tiêu chuẩn khí tượng Việt Nam
 */

class RainfallAnalysisService {
  /**
   * Phân loại mức độ mưa theo lượng mưa 24h
   * @param {number} rainfall24h - Lượng mưa trong 24h (mm)
   * @returns {Object} Thông tin phân loại
   */
  classifyRainfallLevel(rainfall24h) {
    if (rainfall24h < 16) {
      return {
        level: 0,
        name: "Mưa vừa",
        range: "< 16 mm",
        alertLevel: "safe",
        color: "#4CAF50",
        icon: "🌦️",
        description: "Có thể gây ngập nhẹ cục bộ.",
        recommendation: "Theo dõi dự báo thời tiết, chuẩn bị đồ dùng phòng mưa.",
      };
    }

    if (rainfall24h >= 16 && rainfall24h <= 50) {
      return {
        level: 0,
        name: "Mưa vừa",
        range: "16 - 50 mm",
        alertLevel: "safe",
        color: "#4CAF50",
        icon: "🌦️",
        description: "Có thể gây ngập nhẹ cục bộ.",
        recommendation: "Theo dõi dự báo thời tiết, chuẩn bị đồ dùng phòng mưa.",
      };
    }

    if (rainfall24h >= 51 && rainfall24h <= 100) {
      return {
        level: 1,
        name: "Mưa to",
        range: "51 - 100 mm",
        alertLevel: "warning",
        color: "#FFC107",
        icon: "⚠️",
        description: "Nguy hiểm. Gây ngập ứng diện rộng, nguy cơ sạt lở.",
        recommendation:
          "Hạn chế di chuyển, tránh xa khu vực ngập sâu và sạt lở. Theo dõi cảnh báo từ chính quyền.",
      };
    }

    if (rainfall24h >= 101 && rainfall24h <= 200) {
      return {
        level: 2,
        name: "Mưa rất to",
        range: "> 100 mm",
        alertLevel: "danger",
        color: "#FF5722",
        icon: "🚨",
        description: "Rất nguy hiểm. Rủi ro thiên tai cấp 1-2, lũ lụt, chia cắt giao thông.",
        recommendation:
          "KHÔNG di chuyển nếu không cần thiết. Di tản khỏi khu vực ngập sâu và sạt lở. Tuân thủ chỉ đạo của chính quyền.",
      };
    }

    // rainfall24h > 200
    return {
      level: 3,
      name: "Mưa đặc biệt to",
      range: "> 200 mm",
      alertLevel: "critical",
      color: "#D32F2F",
      icon: "🔴",
      description: "Thảm họa. Ngập sâu, lũ quét, sạt lở nghiêm trọng.",
      recommendation:
        "DI TẢN NGAY! Tìm nơi cao, an toàn. Liên hệ cơ quan cứu hộ nếu cần thiết (113, 114, 115).",
    };
  }

  /**
   * Tính tổng lượng mưa trong 24h từ dự báo hourly
   * @param {Array} hourlyForecast - Dữ liệu dự báo theo giờ
   * @returns {number} Tổng lượng mưa (mm)
   */
  calculateRainfall24h(hourlyForecast) {
    let totalRain = 0;
    let accumulatedHours = 0;
    const targetHours = 24;

    for (const entry of hourlyForecast) {
      const intervalHours = entry.intervalHours || 1;
      
      // Lấy lượng mưa từ entry
      const rain =
        typeof entry.rain?.normalized1h === "number"
          ? entry.rain.normalized1h
          : typeof entry.rain?.["1h"] === "number"
          ? entry.rain["1h"]
          : typeof entry.rain?.["3h"] === "number"
          ? entry.rain["3h"] / Math.max(intervalHours, 1)
          : 0;

      const remainingHours = Math.max(targetHours - accumulatedHours, 0);
      if (remainingHours <= 0) break;

      const hoursToConsume = Math.min(intervalHours, remainingHours);
      totalRain += rain * hoursToConsume;
      accumulatedHours += hoursToConsume;

      if (accumulatedHours >= targetHours) {
        break;
      }
    }

    return Math.round(totalRain * 10) / 10; // Làm tròn 1 chữ số thập phân
  }

  /**
   * Phân tích dự báo thời tiết và đưa ra cảnh báo
   * @param {Array} hourlyForecast - Dữ liệu dự báo theo giờ
   * @param {Object} location - Thông tin vị trí (lat, lon, name)
   * @returns {Object} Kết quả phân tích
   */
  analyzeWeatherForecast(hourlyForecast, location = {}) {
    if (!hourlyForecast || hourlyForecast.length === 0) {
      return {
        success: false,
        error: "Không có dữ liệu dự báo",
      };
    }

    // Tính lượng mưa 24h
    const rainfall24h = this.calculateRainfall24h(hourlyForecast);

    // Phân loại mức độ
    const classification = this.classifyRainfallLevel(rainfall24h);

    // Tính các thông số bổ sung
    const rainfall3h = this.calculateRainfallByHours(hourlyForecast, 3);
    const rainfall6h = this.calculateRainfallByHours(hourlyForecast, 6);
    const rainfall12h = this.calculateRainfallByHours(hourlyForecast, 12);

    // Tính cường độ mưa trung bình (mm/h)
    const avgIntensity = rainfall24h / 24;

    return {
      success: true,
      location: {
        name: location.name || "Khu vực",
        lat: location.lat || null,
        lon: location.lon || null,
      },
      rainfall: {
        total24h: rainfall24h,
        total12h: rainfall12h,
        total6h: rainfall6h,
        total3h: rainfall3h,
        avgIntensity: Math.round(avgIntensity * 100) / 100,
      },
      classification: classification,
      alert: {
        shouldAlert: classification.level >= 1, // Cảnh báo từ "Mưa to" trở lên
        level: classification.level,
        name: classification.name,
        message: classification.description,
        recommendation: classification.recommendation,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Tính lượng mưa theo số giờ chỉ định
   * @param {Array} hourlyForecast - Dữ liệu dự báo
   * @param {number} targetHours - Số giờ cần tính
   * @returns {number} Lượng mưa (mm)
   */
  calculateRainfallByHours(hourlyForecast, targetHours) {
    let totalRain = 0;
    let accumulatedHours = 0;

    for (const entry of hourlyForecast) {
      const intervalHours = entry.intervalHours || 1;
      const rain =
        typeof entry.rain?.normalized1h === "number"
          ? entry.rain.normalized1h
          : typeof entry.rain?.["1h"] === "number"
          ? entry.rain["1h"]
          : typeof entry.rain?.["3h"] === "number"
          ? entry.rain["3h"] / Math.max(intervalHours, 1)
          : 0;

      const remainingHours = Math.max(targetHours - accumulatedHours, 0);
      if (remainingHours <= 0) break;

      const hoursToConsume = Math.min(intervalHours, remainingHours);
      totalRain += rain * hoursToConsume;
      accumulatedHours += hoursToConsume;

      if (accumulatedHours >= targetHours) {
        break;
      }
    }

    return Math.round(totalRain * 10) / 10;
  }

  /**
   * Tạo prompt cho AI dựa trên phân tích mưa
   * @param {Object} analysis - Kết quả phân tích từ analyzeWeatherForecast
   * @param {Object} user - Thông tin người dùng
   * @returns {string} Prompt cho AI
   */
  createAIPrompt(analysis, user = {}) {
    const { rainfall, classification, location, alert } = analysis;
    const userName = user.name || "Bạn";

    return `
Bạn là một hệ thống AI chuyên tạo cảnh báo thời tiết bằng tiếng Việt.

THÔNG TIN NGƯỜI DÙNG:
- Tên: ${userName}
- Email: ${user.email || "Chưa có"}
- Khu vực: ${location.name}

DỮ LIỆU DỰ BÁO MƯA:
- Tổng lượng mưa 24h tới: ${rainfall.total24h} mm
- Tổng lượng mưa 12h tới: ${rainfall.total12h} mm
- Tổng lượng mưa 6h tới: ${rainfall.total6h} mm
- Tổng lượng mưa 3h tới: ${rainfall.total3h} mm
- Cường độ mưa trung bình: ${rainfall.avgIntensity} mm/h

PHÂN LOẠI MƯA:
- Cấp độ: ${classification.name}
- Khoảng: ${classification.range}
- Mức cảnh báo: ${classification.alertLevel}
- Mô tả: ${classification.description}

KHUYẾN NGHỊ: ${classification.recommendation}

YÊU CẦU TẠO EMAIL:
1. **Tiêu đề (subject):**
   - Icon: ${classification.icon}
   - Có tên người dùng: "${userName}"
   - Đề cập đến mức độ: "${classification.name}"
   - Thể hiện tính khẩn cấp

2. **Nội dung (htmlBody):**
   - Chào hỏi cá nhân: "${userName}"
   - Nêu rõ lượng mưa dự báo: ${rainfall.total24h}mm trong 24h
   - Phân loại: ${classification.name} (${classification.range})
   - Mô tả tác động: ${classification.description}
   - Khuyến nghị cụ thể: ${classification.recommendation}
   - Dùng HTML: <p>, <b>, <ul>, <li>, <br>, <span style="color:...">
   - Màu sắc:
     * An toàn: color:#4CAF50
     * Cảnh báo: color:#FFC107
     * Nguy hiểm: color:#FF5722
     * Nghiêm trọng: color:#D32F2F
   - Dưới 200 từ
   - Ngôn ngữ rõ ràng, dễ hiểu

3. **Tone:**
   - Cá nhân hóa, thân thiện
   - Tiếng Việt chuẩn
   - Khẩn trương nếu mức độ cao (level >= 2)

FORMAT: Trả về JSON thuần:
{
  "subject": "tiêu đề có icon và tên user",
  "htmlBody": "nội dung HTML"
}
`;
  }
}

module.exports = new RainfallAnalysisService();
