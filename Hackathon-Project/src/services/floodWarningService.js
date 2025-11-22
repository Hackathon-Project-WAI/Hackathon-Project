import floodData from "../data/floodProneAreas.json";
import weatherService from "./weatherService";

// FloodWarningService - Phân tích và cảnh báo ngập lụt
class FloodWarningService {
  constructor() {
    this.floodProneAreas = floodData.floodPrones;
    this.riskLevels = floodData.riskLevels;
    this.warningLevels = floodData.warningLevels;
  }

  /**
   * Phân tích nguy cơ ngập lụt cho tất cả điểm đen
   * @param {Array} rainForecast - Dữ liệu dự báo mưa
   * @returns {Promise<Array>} Danh sách cảnh báo ngập lụt
   */
  async analyzeFloodRisk(rainForecast = null) {
    try {
      // Nếu không có dữ liệu mưa, lấy từ API
      if (!rainForecast) {
        rainForecast = await weatherService.getRainForecast();
      }

      const warnings = [];

      // Phân tích từng điểm nguy cơ
      for (const area of this.floodProneAreas) {
        const warning = await this.analyzeAreaRisk(area, rainForecast);
        if (warning) {
          warnings.push(warning);
        }
      }

      // Sắp xếp theo mức độ nguy hiểm
      warnings.sort((a, b) => {
        const severityOrder = { red: 3, orange: 2, yellow: 1, green: 0 };
        return severityOrder[b.warningLevel] - severityOrder[a.warningLevel];
      });

      return warnings;
    } catch (error) {
      console.error("Lỗi khi phân tích nguy cơ ngập lụt:", error);
      return [];
    }
  }

  /**
   * Phân tích nguy cơ cho một khu vực cụ thể
   * @param {Object} area - Thông tin khu vực
   * @param {Array} rainForecast - Dữ liệu dự báo mưa
   * @returns {Object|null} Thông tin cảnh báo
   */
  async analyzeAreaRisk(area, rainForecast) {
    try {
      // Lấy dữ liệu mưa cho khu vực này (hoặc dùng dữ liệu chung)
      const areaRainData = this.getAreaRainData(area, rainForecast);

      // Tính tổng lượng mưa dự báo trong 24h
      const totalRain24h = this.calculateTotalRain(areaRainData, 24);
      const totalRain6h = this.calculateTotalRain(areaRainData, 6);
      const totalRain3h = this.calculateTotalRain(areaRainData, 3);

      // Xác định mức cảnh báo
      const warningLevel = this.determineWarningLevel(
        area,
        totalRain24h,
        totalRain6h,
        totalRain3h
      );

      // Nếu không có cảnh báo, trả về null
      if (warningLevel === "green") {
        return null;
      }

      // Tính xác suất ngập dựa trên dữ liệu lịch sử
      const floodProbability = this.calculateFloodProbability(
        area,
        totalRain24h
      );

      // Dự đoán độ sâu ngập
      const estimatedDepth = this.estimateFloodDepth(area, totalRain24h);

      // Thời gian dự kiến bắt đầu ngập
      const estimatedStartTime = this.estimateFloodStartTime(
        areaRainData,
        area
      );

      return {
        areaId: area.id,
        areaName: area.name,
        district: area.district,
        coords: area.coords,
        warningLevel: warningLevel,
        warningInfo: this.warningLevels[warningLevel],
        riskLevel: area.riskLevel,
        rainData: {
          total24h: Math.round(totalRain24h * 10) / 10,
          total6h: Math.round(totalRain6h * 10) / 10,
          total3h: Math.round(totalRain3h * 10) / 10,
          threshold: area.rainThreshold,
        },
        prediction: {
          floodProbability: Math.round(floodProbability),
          estimatedDepth: Math.round(estimatedDepth * 100) / 100,
          estimatedStartTime: estimatedStartTime,
          duration: this.estimateFloodDuration(totalRain24h, area),
        },
        recommendations: this.generateRecommendations(warningLevel, area),
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Lỗi khi phân tích khu vực ${area.name}:`, error);
      return null;
    }
  }

  /**
   * Lấy dữ liệu mưa cho khu vực cụ thể
   */
  getAreaRainData(area, rainForecast) {
    // Nếu có dữ liệu chi tiết theo tọa độ, sử dụng
    // Hiện tại dùng dữ liệu chung cho toàn Đà Nẵng
    return rainForecast.map((item) => ({
      ...item,
      coords: area.coords,
    }));
  }

  /**
   * Tính tổng lượng mưa trong khoảng thời gian
   */
  calculateTotalRain(rainData, hours) {
    const now = new Date();
    const endTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

    return rainData
      .filter((item) => item.time >= now && item.time <= endTime)
      .reduce((total, item) => total + item.rain, 0);
  }

  /**
   * Xác định mức cảnh báo dựa trên ngưỡng
   */
  determineWarningLevel(area, rain24h, rain6h, rain3h) {
    const threshold = area.rainThreshold;

    // Kiểm tra các ngưỡng từ cao xuống thấp
    if (
      rain24h >= threshold.red ||
      rain6h >= threshold.red * 0.5 ||
      rain3h >= threshold.red * 0.25
    ) {
      return "red";
    }
    if (
      rain24h >= threshold.orange ||
      rain6h >= threshold.orange * 0.5 ||
      rain3h >= threshold.orange * 0.25
    ) {
      return "orange";
    }
    if (
      rain24h >= threshold.yellow ||
      rain6h >= threshold.yellow * 0.5 ||
      rain3h >= threshold.yellow * 0.25
    ) {
      return "yellow";
    }

    return "green";
  }

  /**
   * Tính xác suất ngập dựa trên dữ liệu lịch sử
   */
  calculateFloodProbability(area, totalRain) {
    const baseProb = area.historicalData.floodEvents * 2; // Base probability từ lịch sử
    const rainFactor = Math.min(totalRain / area.rainThreshold.yellow, 2); // Nhân tố mưa
    const riskFactor =
      area.riskLevel === "high" ? 1.5 : area.riskLevel === "medium" ? 1.2 : 1.0;

    return Math.min(baseProb * rainFactor * riskFactor, 95);
  }

  /**
   * Dự đoán độ sâu ngập
   */
  estimateFloodDepth(area, totalRain) {
    const maxHistoricalDepth = area.historicalData.maxDepth;
    const rainRatio = totalRain / area.rainThreshold.red;

    return Math.min(maxHistoricalDepth * rainRatio, maxHistoricalDepth * 1.2);
  }

  /**
   * Dự đoán thời gian bắt đầu ngập
   */
  estimateFloodStartTime(rainData, area) {
    const threshold = area.rainThreshold.yellow * 0.5; // 50% ngưỡng vàng
    let cumulativeRain = 0;

    for (const item of rainData) {
      cumulativeRain += item.rain;
      if (cumulativeRain >= threshold) {
        return item.time;
      }
    }

    return null;
  }

  /**
   * Dự đoán thời gian ngập
   */
  estimateFloodDuration(totalRain, area) {
    // Dựa trên lượng mưa và đặc điểm khu vực
    const baseDuration = 2; // 2 giờ cơ bản
    const rainFactor = totalRain / area.rainThreshold.yellow;
    const drainageFactor = area.characteristics.includes("thoát nước kém")
      ? 1.5
      : 1.0;

    return Math.round(baseDuration * rainFactor * drainageFactor);
  }

  /**
   * Tạo khuyến nghị dựa trên mức cảnh báo
   */
  generateRecommendations(warningLevel, area) {
    const baseRecommendations = {
      yellow: [
        "Theo dõi thông tin thời tiết",
        "Chuẩn bị kế hoạch di chuyển",
        "Kiểm tra hệ thống thoát nước",
      ],
      orange: [
        "Hạn chế di chuyển qua khu vực",
        "Chuẩn bị đồ dùng khẩn cấp",
        "Theo dõi cảnh báo liên tục",
        "Di chuyển xe lên nơi cao",
      ],
      red: [
        "KHÔNG di chuyển qua khu vực",
        "Sơ tán khỏi khu vực nguy hiểm",
        "Liên hệ lực lượng cứu hộ nếu cần",
        "Theo dõi thông tin chính thức",
      ],
    };

    const recommendations = [...baseRecommendations[warningLevel]];

    // Thêm khuyến nghị đặc biệt theo đặc điểm khu vực
    if (area.characteristics.includes("ven biển")) {
      recommendations.push("Cảnh giác với nước biển dâng");
    }
    if (area.characteristics.includes("giao thông cao")) {
      recommendations.push("Tìm tuyến đường thay thế");
    }
    if (area.characteristics.includes("du lịch")) {
      recommendations.push("Thông báo cho khách du lịch");
    }

    return recommendations;
  }

  /**
   * Lấy thống kê tổng quan
   */
  async getFloodStatistics() {
    try {
      const warnings = await this.analyzeFloodRisk();

      const stats = {
        totalAreas: this.floodProneAreas.length,
        warningCounts: {
          red: warnings.filter((w) => w.warningLevel === "red").length,
          orange: warnings.filter((w) => w.warningLevel === "orange").length,
          yellow: warnings.filter((w) => w.warningLevel === "yellow").length,
        },
        highRiskAreas: warnings.filter((w) => w.riskLevel === "high").length,
        averageRain:
          warnings.reduce((sum, w) => sum + w.rainData.total24h, 0) /
          Math.max(warnings.length, 1),
        mostDangerousAreas: warnings.slice(0, 3),
      };

      return stats;
    } catch (error) {
      console.error("Lỗi khi tính thống kê:", error);
      return null;
    }
  }

  /**
   * Lấy danh sách tất cả điểm nguy cơ (không phân tích)
   */
  getAllFloodProneAreas() {
    return this.floodProneAreas;
  }

  /**
   * Lấy thông tin một khu vực cụ thể
   */
  getAreaById(areaId) {
    return this.floodProneAreas.find((area) => area.id === areaId);
  }
}

export default new FloodWarningService();
