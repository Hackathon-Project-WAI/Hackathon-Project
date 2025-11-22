const axios = require("axios");

class OpenWeatherClient {
  constructor() {
    this.apiKey =
      process.env.OPENWEATHER_API_KEY ||
      process.env.REACT_APP_OPENWEATHER_API_KEY;
    this.baseUrl = "https://api.openweathermap.org/data/2.5";
  }

  /**
   * Kiểm tra API key
   */
  ensureApiKey() {
    if (!this.apiKey) {
      throw new Error(
        "OPENWEATHER_API_KEY chưa được cấu hình trong biến môi trường"
      );
    }
  }

  /**
   * Lấy dự báo thời tiết theo giờ
   */
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

      // Format dữ liệu
      return data.list.map((item) => ({
        dt: item.dt,
        temp: item.main.temp,
        feels_like: item.main.feels_like,
        pressure: item.main.pressure,
        humidity: item.main.humidity,
        clouds: item.clouds.all,
        visibility: item.visibility,
        wind_speed: item.wind.speed,
        wind_deg: item.wind.deg,
        wind_gust: item.wind.gust,
        weather: item.weather[0],
        pop: item.pop || 0,
        rain: item.rain || { "3h": 0 },
        snow: item.snow || { "3h": 0 },
      }));
    } catch (error) {
      console.error("❌ Lỗi lấy dự báo thời tiết:", error.message);
      throw error;
    }
  }

  /**
   * Lấy thời tiết hiện tại
   */
  async getCurrentWeather(lat, lon) {
    this.ensureApiKey();

    try {
      const { data } = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: "metric",
          lang: "vi",
        },
      });

      return {
        temp: data.main.temp,
        feels_like: data.main.feels_like,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        weather: data.weather[0],
        wind: {
          speed: data.wind.speed,
          deg: data.wind.deg,
        },
        clouds: data.clouds.all,
        rain: data.rain ? data.rain["1h"] || data.rain["3h"] || 0 : 0,
        timestamp: data.dt,
      };
    } catch (error) {
      console.error("❌ Lỗi lấy thời tiết hiện tại:", error.message);
      throw error;
    }
  }

  /**
   * Tính tổng lượng mưa trong N giờ
   */
  calculateTotalRain(hourlyData, hours) {
    let total = 0;
    const limit = Math.min(hours, hourlyData.length);

    for (let i = 0; i < limit; i++) {
      const rain =
        hourlyData[i].rain?.["3h"] || hourlyData[i].rain?.["1h"] || 0;
      total += rain;
    }

    return total;
  }
}

module.exports = new OpenWeatherClient();
