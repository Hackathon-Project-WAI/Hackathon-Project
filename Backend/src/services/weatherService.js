const axios = require("axios");

class WeatherService {
  constructor() {
    this.apiKey =
      process.env.OPENWEATHER_API_KEY ||
      process.env.REACT_APP_OPENWEATHER_API_KEY;
    this.baseUrl = "https://api.openweathermap.org/data/2.5";
  }

  ensureApiKey() {
    if (!this.apiKey) {
      throw new Error(
        "OPENWEATHER_API_KEY chưa được cấu hình trong biến môi trường"
      );
    }
  }

  async getHourlyForecast(lat, lon) {
    this.ensureApiKey();

    if (typeof lat !== "number" || typeof lon !== "number") {
      throw new Error("Lat/Lon phải là số hợp lệ");
    }

    try {
      const { data } = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: "metric",
          lang: "vi",
        },
      });

      return data.list.map((item) => this.transformForecastItem(item));
    } catch (error) {
      const status = error.response?.status;
      const message =
        status === 401
          ? "API key OpenWeather không hợp lệ"
          : status === 429
          ? "OpenWeather API bị giới hạn rate limit"
          : error.message;
      throw new Error(`Không thể lấy dữ liệu thời tiết: ${message}`);
    }
  }

  transformForecastItem(item) {
    const rain3h =
      typeof item.rain?.["3h"] === "number" ? item.rain["3h"] : undefined;
    const rain1h =
      typeof item.rain?.["1h"] === "number" ? item.rain["1h"] : undefined;

    const intervalHours = 3; // OpenWeather /forecast trả dữ liệu mỗi 3 giờ
    const normalized1h =
      typeof rain1h === "number"
        ? rain1h
        : typeof rain3h === "number"
        ? rain3h / intervalHours
        : 0;

    const round = (value) =>
      typeof value === "number" ? Math.round(value * 100) / 100 : undefined;

    return {
      dt: item.dt,
      timestamp: item.dt * 1000,
      intervalHours,
      temp: round(item.main?.temp),
      feels_like: round(item.main?.feels_like),
      pressure: item.main?.pressure,
      humidity: item.main?.humidity,
      wind_speed: round(item.wind?.speed),
      wind_deg: item.wind?.deg,
      wind_gust: round(item.wind?.gust),
      weather: item.weather?.[0],
      pop: item.pop ?? 0,
      rain: {
        "1h": round(normalized1h),
        "3h": typeof rain3h === "number" ? round(rain3h) : undefined,
        normalized1h: round(normalized1h),
      },
      raw: item,
    };
  }
}

module.exports = new WeatherService();

