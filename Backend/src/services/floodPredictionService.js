class FloodPredictionService {
  constructor() {
    this.floodProneAreas = [
      {
        id: 1,
        name: "Đường 2/9 (đoạn Ngã 3 Hòa Khánh)",
        district: "Liên Chiểu",
        coords: { lat: 16.0738, lon: 108.1488 },
        elevation: 2,
        drainageCapacity: 50,
        riskLevel: "high",
        threshold: { warning: 30, danger: 60, critical: 100 },
      },
      {
        id: 2,
        name: "Đường Nguyễn Tri Phương",
        district: "Hải Châu",
        coords: { lat: 16.0678, lon: 108.2208 },
        elevation: 1.5,
        drainageCapacity: 40,
        riskLevel: "high",
        threshold: { warning: 25, danger: 50, critical: 80 },
      },
      {
        id: 3,
        name: "Đường Ông Ích Khiêm",
        district: "Hải Châu",
        coords: { lat: 16.0544, lon: 108.2216 },
        elevation: 2,
        drainageCapacity: 45,
        riskLevel: "medium",
        threshold: { warning: 35, danger: 65, critical: 100 },
      },
      {
        id: 4,
        name: "Đường Điện Biên Phủ (đoạn gần chợ Cồn)",
        district: "Hải Châu",
        coords: { lat: 16.0678, lon: 108.214 },
        elevation: 1,
        drainageCapacity: 35,
        riskLevel: "high",
        threshold: { warning: 20, danger: 45, critical: 70 },
      },
      {
        id: 5,
        name: "Đường Lê Duẩn (đoạn Hòa Xuân)",
        district: "Cẩm Lệ",
        coords: { lat: 16.0297, lon: 108.1588 },
        elevation: 3,
        drainageCapacity: 55,
        riskLevel: "medium",
        threshold: { warning: 40, danger: 70, critical: 110 },
      },
      {
        id: 6,
        name: "Đường Ngô Quyền",
        district: "Sơn Trà",
        coords: { lat: 16.0644, lon: 108.2373 },
        elevation: 2.5,
        drainageCapacity: 50,
        riskLevel: "low",
        threshold: { warning: 45, danger: 80, critical: 120 },
      },
      {
        id: 7,
        name: "Khu vực chân cầu Rồng",
        district: "Hải Châu",
        coords: { lat: 16.0606, lon: 108.2272 },
        elevation: 1.5,
        drainageCapacity: 40,
        riskLevel: "high",
        threshold: { warning: 25, danger: 50, critical: 80 },
      },
      {
        id: 8,
        name: "Đường Hoàng Diệu",
        district: "Hải Châu",
        coords: { lat: 16.0747, lon: 108.2239 },
        elevation: 2,
        drainageCapacity: 45,
        riskLevel: "medium",
        threshold: { warning: 35, danger: 65, critical: 95 },
      },
    ];
  }

  analyzeForecast(hourlyForecast, options = {}) {
    const { maxAreas = 3 } = options;
    const predictions = this.floodProneAreas
      .map((area) => {
        const prediction = this.predictForArea(area, hourlyForecast);
        return prediction
          ? { area, prediction, timestamp: new Date().toISOString() }
          : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.prediction.riskScore - a.prediction.riskScore);

    return predictions.slice(0, maxAreas);
  }

  predictForArea(area, hourlyForecast) {
    if (!hourlyForecast || hourlyForecast.length === 0) {
      return null;
    }

    const rainfall3h = this.calculateRainfall(hourlyForecast, 3);
    const rainfall6h = this.calculateRainfall(hourlyForecast, 6);
    const rainfall12h = this.calculateRainfall(hourlyForecast, 12);

    const riskScore = this.calculateRiskScore(
      area,
      rainfall3h,
      rainfall6h,
      rainfall12h,
      hourlyForecast
    );

    const floodRisk = this.getFloodRiskLevel(area, rainfall3h);

    return {
      floodRisk: floodRisk.level,
      riskScore: Math.round(riskScore),
      message: floodRisk.message,
      color: floodRisk.color,
      details: {
        rainfall3h: Math.round(rainfall3h * 10) / 10,
        rainfall6h: Math.round(rainfall6h * 10) / 10,
        rainfall12h: Math.round(rainfall12h * 10) / 10,
        intensity: this.calculateRainIntensity(hourlyForecast),
        predictedDepth: this.estimateFloodDepth(rainfall3h, area),
        estimatedDuration: this.estimateFloodDuration(rainfall3h, area),
      },
      recommendation: this.getRecommendation(floodRisk.level),
    };
  }

  calculateRainfall(hourlyForecast, targetHours) {
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

    return totalRain;
  }

  calculateRiskScore(
    area,
    rainfall3h,
    rainfall6h,
    rainfall12h,
    hourlyForecast
  ) {
    let riskScore = 0;
    riskScore += (rainfall3h / area.threshold.critical) * 40;
    riskScore += (rainfall6h / (area.threshold.critical * 2)) * 25;
    riskScore += (5 - area.elevation) * 5;
    riskScore += ((100 - area.drainageCapacity) / 100) * 15;
    riskScore += this.calculateRainIntensity(hourlyForecast) * 10;
    riskScore += this.getRiskLevelScore(area.riskLevel) * 5;
    return Math.min(100, Math.max(0, riskScore));
  }

  getFloodRiskLevel(area, rainfall3h) {
    if (rainfall3h >= area.threshold.critical) {
      return {
        level: 3,
        message: "NGHIÊM TRỌNG - Ngập sâu có thể xảy ra",
        color: "red",
      };
    }
    if (rainfall3h >= area.threshold.danger) {
      return {
        level: 2,
        message: "NGUY HIỂM - Có thể ngập cục bộ",
        color: "orange",
      };
    }
    if (rainfall3h >= area.threshold.warning) {
      return {
        level: 1,
        message: "CẢNH BÁO - Theo dõi sát tình hình",
        color: "yellow",
      };
    }
    return {
      level: 0,
      message: "An toàn",
      color: "green",
    };
  }

  calculateRainIntensity(hourlyForecast) {
    const nextEntries = hourlyForecast.slice(0, 3);
    if (!nextEntries.length) return 0;

    const avgRain =
      nextEntries.reduce((sum, hour) => {
        const rain =
          typeof hour.rain?.normalized1h === "number"
            ? hour.rain.normalized1h
            : typeof hour.rain?.["1h"] === "number"
            ? hour.rain["1h"]
            : typeof hour.rain?.["3h"] === "number"
            ? hour.rain["3h"] / Math.max(hour.intervalHours || 3, 1)
            : 0;
        return sum + rain;
      }, 0) / nextEntries.length;

    if (avgRain > 10) return 3;
    if (avgRain > 5) return 2;
    if (avgRain > 0) return 1;
    return 0;
  }

  estimateFloodDepth(rainfall, area) {
    const excess = Math.max(0, rainfall - area.drainageCapacity);
    const depth = (excess / 10) * (5 - area.elevation);
    return Math.round(Math.max(0, depth));
  }

  estimateFloodDuration(rainfall, area) {
    const excess = Math.max(0, rainfall - area.drainageCapacity);
    const duration = (excess / area.drainageCapacity) * 60;
    return Math.round(Math.max(0, duration));
  }

  getRecommendation(floodRisk) {
    const recommendations = {
      0: "Tình hình bình thường. Không cần biện pháp đặc biệt.",
      1: "⚠️ Theo dõi dự báo thời tiết. Chuẩn bị sẵn sàng ứng phó nếu mưa tăng.",
      2: "🚨 Hạn chế di chuyển qua khu vực này. Chuẩn bị bao cát, máy bơm nước.",
      3: "🔴 NGUY HIỂM! Tránh xa khu vực. Di dời tài sản lên cao. Sẵn sàng sơ tán.",
    };
    return recommendations[floodRisk] || recommendations[0];
  }

  getRiskLevelScore(level) {
    const scores = { low: 1, medium: 2, high: 3 };
    return scores[level] || 1;
  }

  getAllFloodProneAreas() {
    return this.floodProneAreas;
  }

  getAreaById(areaId) {
    if (!areaId) return null;
    return this.floodProneAreas.find((area) => area.id === Number(areaId));
  }

  findNearestArea(lat, lon) {
    if (typeof lat !== "number" || typeof lon !== "number") {
      return null;
    }

    let nearest = null;
    let minDistance = Infinity;
    for (const area of this.floodProneAreas) {
      const distance = this.calculateDistance(
        lat,
        lon,
        area.coords.lat,
        area.coords.lon
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = area;
      }
    }

    return nearest ? { area: nearest, distanceKm: minDistance } : null;
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
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

module.exports = new FloodPredictionService();

