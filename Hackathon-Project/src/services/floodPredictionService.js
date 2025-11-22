// FloodPredictionService - Dự báo ngập lụt dựa trên dữ liệu thời tiết
class FloodPredictionService {
  constructor() {
    // Dữ liệu các khu vực dễ ngập ở Đà Nẵng với thông số địa hình
    this.floodProneAreas = [
      {
        id: 1,
        name: "Đường 2/9 (đoạn Ngã 3 Hòa Khánh)",
        district: "Liên Chiểu",
        coords: { lat: 16.0738, lon: 108.1488 },
        elevation: 2, // độ cao so với mực nước biển (m)
        drainageCapacity: 50, // khả năng thoát nước (mm/h)
        riskLevel: "high",
        threshold: {
          warning: 30, // mm/3h - cảnh báo
          danger: 60, // mm/3h - nguy hiểm
          critical: 100, // mm/3h - nghiêm trọng
        },
      },
      {
        id: 2,
        name: "Đường Nguyễn Tri Phương",
        district: "Hải Châu",
        coords: { lat: 16.0678, lon: 108.2208 },
        elevation: 1.5,
        drainageCapacity: 40,
        riskLevel: "high",
        threshold: {
          warning: 25,
          danger: 50,
          critical: 80,
        },
      },
      {
        id: 3,
        name: "Đường Ông Ích Khiêm",
        district: "Hải Châu",
        coords: { lat: 16.0544, lon: 108.2216 },
        elevation: 2,
        drainageCapacity: 45,
        riskLevel: "medium",
        threshold: {
          warning: 35,
          danger: 65,
          critical: 100,
        },
      },
      {
        id: 4,
        name: "Đường Điện Biên Phủ (đoạn gần chợ Cồn)",
        district: "Hải Châu",
        coords: { lat: 16.0678, lon: 108.214 },
        elevation: 1,
        drainageCapacity: 35,
        riskLevel: "high",
        threshold: {
          warning: 20,
          danger: 45,
          critical: 70,
        },
      },
      {
        id: 5,
        name: "Đường Lê Duẩn (đoạn Hòa Xuân)",
        district: "Cẩm Lệ",
        coords: { lat: 16.0297, lon: 108.1588 },
        elevation: 3,
        drainageCapacity: 55,
        riskLevel: "medium",
        threshold: {
          warning: 40,
          danger: 70,
          critical: 110,
        },
      },
      {
        id: 6,
        name: "Đường Ngô Quyền",
        district: "Sơn Trà",
        coords: { lat: 16.0644, lon: 108.2373 },
        elevation: 2.5,
        drainageCapacity: 50,
        riskLevel: "low",
        threshold: {
          warning: 45,
          danger: 80,
          critical: 120,
        },
      },
      {
        id: 7,
        name: "Khu vực chân cầu Rồng",
        district: "Hải Châu",
        coords: { lat: 16.0606, lon: 108.2272 },
        elevation: 1.5,
        drainageCapacity: 40,
        riskLevel: "high",
        threshold: {
          warning: 25,
          danger: 50,
          critical: 80,
        },
      },
      {
        id: 8,
        name: "Đường Hoàng Diệu",
        district: "Hải Châu",
        coords: { lat: 16.0747, lon: 108.2239 },
        elevation: 2,
        drainageCapacity: 45,
        riskLevel: "medium",
        threshold: {
          warning: 35,
          danger: 65,
          critical: 95,
        },
      },
    ];
  }

  /**
   * Dự báo ngập lụt dựa trên dữ liệu thời tiết hourly
   * @param {Array} hourlyForecast - Dữ liệu dự báo theo giờ từ OpenWeatherMap
   * @returns {Array} Danh sách khu vực có nguy cơ ngập
   */
  predictFlooding(hourlyForecast) {
    const predictions = [];

    this.floodProneAreas.forEach((area) => {
      // Tính tổng lượng mưa trong 3 giờ tới
      const rainfall3h = this.calculateRainfall(hourlyForecast, 3);
      const rainfall6h = this.calculateRainfall(hourlyForecast, 6);
      const rainfall12h = this.calculateRainfall(hourlyForecast, 12);

      // Áp dụng AI/ML model đơn giản (có thể thay bằng TensorFlow.js)
      const prediction = this.simpleMLPredict(
        area,
        rainfall3h,
        rainfall6h,
        rainfall12h,
        hourlyForecast
      );

      if (prediction.floodRisk > 0) {
        predictions.push({
          area: area,
          prediction: prediction,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Sắp xếp theo mức độ nguy hiểm
    return predictions.sort(
      (a, b) => b.prediction.riskScore - a.prediction.riskScore
    );
  }

  /**
   * Tính tổng lượng mưa trong N giờ tới
   * @param {Array} hourlyForecast - Dữ liệu hourly
   * @param {number} hours - Số giờ cần tính
   * @returns {number} Tổng lượng mưa (mm)
   */
  calculateRainfall(hourlyForecast, hours) {
    if (!hourlyForecast || hourlyForecast.length === 0) return 0;

    let totalRain = 0;
    const limit = Math.min(hours, hourlyForecast.length);

    for (let i = 0; i < limit; i++) {
      const rain = hourlyForecast[i].rain?.["1h"] || 0;
      totalRain += rain;
    }

    return totalRain;
  }

  /**
   * Simple ML Model - Dự đoán ngập lụt
   * (Có thể thay bằng TensorFlow.js model phức tạp hơn)
   */
  simpleMLPredict(area, rainfall3h, rainfall6h, rainfall12h, hourlyForecast) {
    // Các yếu tố ảnh hưởng
    const factors = {
      rainfall3h: rainfall3h,
      rainfall6h: rainfall6h,
      rainfall12h: rainfall12h,
      elevation: area.elevation,
      drainageCapacity: area.drainageCapacity,
      baseRiskLevel: this.getRiskLevelScore(area.riskLevel),
      intensity: this.calculateRainIntensity(hourlyForecast),
      windSpeed: this.getAverageWindSpeed(hourlyForecast),
      humidity: this.getAverageHumidity(hourlyForecast),
    };

    // Tính điểm rủi ro (0-100)
    let riskScore = 0;

    // Trọng số cho lượng mưa 3h (quan trọng nhất)
    riskScore += (rainfall3h / area.threshold.critical) * 40;

    // Trọng số cho lượng mưa 6h
    riskScore += (rainfall6h / (area.threshold.critical * 2)) * 25;

    // Trọng số cho độ cao (thấp hơn = nguy hiểm hơn)
    riskScore += (5 - area.elevation) * 5;

    // Trọng số cho khả năng thoát nước (thấp hơn = nguy hiểm hơn)
    riskScore += ((100 - area.drainageCapacity) / 100) * 15;

    // Trọng số cho cường độ mưa
    riskScore += factors.intensity * 10;

    // Trọng số cho mức độ rủi ro cơ bản
    riskScore += factors.baseRiskLevel * 5;

    // Giới hạn 0-100
    riskScore = Math.min(100, Math.max(0, riskScore));

    // Xác định mức độ nguy hiểm
    let floodRisk = 0; // 0: an toàn, 1: cảnh báo, 2: nguy hiểm, 3: nghiêm trọng
    let message = "An toàn";
    let color = "green";

    if (rainfall3h >= area.threshold.critical) {
      floodRisk = 3;
      message = "NGHIÊM TRỌNG - Ngập sâu có thể xảy ra";
      color = "red";
    } else if (rainfall3h >= area.threshold.danger) {
      floodRisk = 2;
      message = "NGUY HIỂM - Có thể ngập cục bộ";
      color = "orange";
    } else if (rainfall3h >= area.threshold.warning) {
      floodRisk = 1;
      message = "CẢNH BÁO - Theo dõi sát tình hình";
      color = "yellow";
    }

    return {
      floodRisk: floodRisk,
      riskScore: Math.round(riskScore),
      message: message,
      color: color,
      details: {
        rainfall3h: Math.round(rainfall3h * 10) / 10,
        rainfall6h: Math.round(rainfall6h * 10) / 10,
        rainfall12h: Math.round(rainfall12h * 10) / 10,
        intensity: factors.intensity,
        predictedDepth: this.estimateFloodDepth(rainfall3h, area),
        estimatedDuration: this.estimateFloodDuration(rainfall3h, area),
      },
      recommendation: this.getRecommendation(floodRisk),
    };
  }

  /**
   * Tính cường độ mưa trung bình
   */
  calculateRainIntensity(hourlyForecast) {
    if (!hourlyForecast || hourlyForecast.length === 0) return 0;

    const next3Hours = hourlyForecast.slice(0, 3);
    const avgRain =
      next3Hours.reduce((sum, hour) => sum + (hour.rain?.["1h"] || 0), 0) /
      next3Hours.length;

    // Phân loại: 0-5: nhẹ, 5-10: trung bình, >10: nặng
    if (avgRain > 10) return 3;
    if (avgRain > 5) return 2;
    if (avgRain > 0) return 1;
    return 0;
  }

  /**
   * Lấy tốc độ gió trung bình
   */
  getAverageWindSpeed(hourlyForecast) {
    if (!hourlyForecast || hourlyForecast.length === 0) return 0;
    const next3Hours = hourlyForecast.slice(0, 3);
    return (
      next3Hours.reduce((sum, hour) => sum + (hour.wind_speed || 0), 0) /
      next3Hours.length
    );
  }

  /**
   * Lấy độ ẩm trung bình
   */
  getAverageHumidity(hourlyForecast) {
    if (!hourlyForecast || hourlyForecast.length === 0) return 0;
    const next3Hours = hourlyForecast.slice(0, 3);
    return (
      next3Hours.reduce((sum, hour) => sum + (hour.humidity || 0), 0) /
      next3Hours.length
    );
  }

  /**
   * Chuyển đổi risk level thành điểm số
   */
  getRiskLevelScore(level) {
    const scores = { low: 1, medium: 2, high: 3 };
    return scores[level] || 1;
  }

  /**
   * Ước tính độ sâu ngập (cm)
   */
  estimateFloodDepth(rainfall, area) {
    const excess = Math.max(0, rainfall - area.drainageCapacity);
    const depth = (excess / 10) * (5 - area.elevation);
    return Math.round(Math.max(0, depth));
  }

  /**
   * Ước tính thời gian ngập (phút)
   */
  estimateFloodDuration(rainfall, area) {
    const excess = Math.max(0, rainfall - area.drainageCapacity);
    const duration = (excess / area.drainageCapacity) * 60;
    return Math.round(Math.max(0, duration));
  }

  /**
   * Đưa ra khuyến nghị
   */
  getRecommendation(floodRisk) {
    const recommendations = {
      0: "Tình hình bình thường. Không cần biện pháp đặc biệt.",
      1: "⚠️ Theo dõi dự báo thời tiết. Chuẩn bị sẵn sàng ứng phó nếu mưa tăng.",
      2: "🚨 Hạn chế di chuyển qua khu vực này. Chuẩn bị bao cát, máy bơm nước.",
      3: "🔴 NGUY HIỂM! Tránh xa khu vực. Di dời tài sản lên cao. Sẵn sàng sơ tán.",
    };
    return recommendations[floodRisk] || recommendations[0];
  }

  /**
   * Lấy danh sách tất cả khu vực dễ ngập
   */
  getAllFloodProneAreas() {
    return this.floodProneAreas;
  }

  /**
   * Tìm khu vực dễ ngập gần tọa độ
   */
  findNearbyFloodProneAreas(lat, lon, radiusKm = 2) {
    return this.floodProneAreas.filter((area) => {
      const distance = this.calculateDistance(
        lat,
        lon,
        area.coords.lat,
        area.coords.lon
      );
      return distance <= radiusKm;
    });
  }

  /**
   * Tính khoảng cách giữa 2 tọa độ (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Bán kính Trái Đất (km)
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }
}

const floodPredictionService = new FloodPredictionService();
export default floodPredictionService;
