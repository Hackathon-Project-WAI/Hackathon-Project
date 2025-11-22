// WeatherService - Xử lý API calls tới OpenWeatherMap
class WeatherService {
  constructor() {
    this.apiKey = process.env.REACT_APP_OPENWEATHER_API_KEY;
    this.baseUrl = "https://api.openweathermap.org/data/2.5";
    this.oneCallUrl = "https://api.openweathermap.org/data/3.0/onecall";
  }

  /**
   * Lấy thời tiết hiện tại
   * @param {number} lat - Vĩ độ
   * @param {number} lon - Kinh độ
   * @returns {Promise<Object>} Dữ liệu thời tiết hiện tại
   */
  async getCurrentWeather(lat = 16.0544, lon = 108.2022) {
    try {
      const response = await fetch(
        `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&lang=vi`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.formatCurrentWeather(data);
    } catch (error) {
      console.error("Lỗi khi lấy thời tiết hiện tại:", error);
      throw error;
    }
  }

  /**
   * Lấy dự báo thời tiết 5 ngày
   * @param {number} lat - Vĩ độ
   * @param {number} lon - Kinh độ
   * @returns {Promise<Object>} Dữ liệu dự báo
   */
  async getForecast(lat = 16.0544, lon = 108.2022) {
    try {
      const response = await fetch(
        `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&lang=vi`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.formatForecast(data);
    } catch (error) {
      console.error("Lỗi khi lấy dự báo thời tiết:", error);
      throw error;
    }
  }

  /**
   * Lấy dữ liệu OneCall API (chi tiết hơn)
   * @param {number} lat - Vĩ độ
   * @param {number} lon - Kinh độ
   * @returns {Promise<Object>} Dữ liệu chi tiết
   */
  async getDetailedWeather(lat = 16.0544, lon = 108.2022) {
    // Dùng Free Tier API thay vì One Call API (trả phí)
    try {
      const [current, forecast] = await Promise.all([
        this.getCurrentWeather(lat, lon),
        this.getForecast(lat, lon),
      ]);

      return {
        current: current.current,
        daily: forecast.daily,
      };
    } catch (error) {
      console.error("Lỗi khi lấy thời tiết chi tiết:", error);
      return await this.getCurrentWeather(lat, lon);
    }
  }

  /**
   * Lấy dữ liệu dự báo THEO GIỜ (Hourly) - Quan trọng cho dự báo ngập
   * @param {number} lat - Vĩ độ
   * @param {number} lon - Kinh độ
   * @returns {Promise<Array>} Dữ liệu hourly 48 giờ tới
   */
  async getHourlyForecast(lat = 16.0544, lon = 108.2022) {
    console.log(`🌦️ OpenWeather API: Gọi getHourlyForecast(${lat}, ${lon})`);
    // Dùng trực tiếp Free Tier API - không cần One Call API
    return await this.getForecastHourly(lat, lon);
  }

  /**
   * Fallback: Lấy dữ liệu 5-day forecast (mỗi 3h)
   */
  async getForecastHourly(lat = 16.0544, lon = 108.2022) {
    try {
      const response = await fetch(
        `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&lang=vi`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

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
      console.error("Lỗi khi lấy forecast hourly:", error);
      return [];
    }
  }

  /**
   * Format dữ liệu thời tiết hiện tại
   */
  formatCurrentWeather(data) {
    return {
      location: {
        name: data.name,
        country: data.sys.country,
        coords: {
          lat: data.coord.lat,
          lon: data.coord.lon,
        },
      },
      current: {
        temp: Math.round(data.main.temp),
        feels_like: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        weather: {
          main: data.weather[0].main,
          description: data.weather[0].description,
          icon: data.weather[0].icon,
        },
        wind: {
          speed: data.wind.speed,
          deg: data.wind.deg,
        },
        clouds: data.clouds.all,
        visibility: data.visibility,
        rain: data.rain ? data.rain["1h"] || data.rain["3h"] || 0 : 0,
        timestamp: data.dt,
      },
      sunrise: data.sys.sunrise,
      sunset: data.sys.sunset,
    };
  }

  /**
   * Format dữ liệu dự báo
   */
  formatForecast(data) {
    const dailyForecasts = {};

    data.list.forEach((item) => {
      const date = new Date(item.dt * 1000).toDateString();

      if (!dailyForecasts[date]) {
        dailyForecasts[date] = {
          date: date,
          temps: [],
          humidity: [],
          rain: [],
          weather: item.weather[0],
          items: [],
        };
      }

      dailyForecasts[date].temps.push(item.main.temp);
      dailyForecasts[date].humidity.push(item.main.humidity);
      dailyForecasts[date].rain.push(item.rain ? item.rain["3h"] || 0 : 0);
      dailyForecasts[date].items.push({
        time: new Date(item.dt * 1000),
        temp: Math.round(item.main.temp),
        rain: item.rain ? item.rain["3h"] || 0 : 0,
        weather: item.weather[0],
      });
    });

    // Tính toán min/max/avg cho mỗi ngày
    Object.keys(dailyForecasts).forEach((date) => {
      const day = dailyForecasts[date];
      day.temp_min = Math.round(Math.min(...day.temps));
      day.temp_max = Math.round(Math.max(...day.temps));
      day.avg_humidity = Math.round(
        day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length
      );
      day.total_rain = day.rain.reduce((a, b) => a + b, 0);
    });

    return {
      city: data.city,
      daily: Object.values(dailyForecasts).slice(0, 5), // 5 ngày đầu
    };
  }

  /**
   * Format dữ liệu OneCall
   */
  formatDetailedWeather(data) {
    return {
      current: {
        temp: Math.round(data.current.temp),
        feels_like: Math.round(data.current.feels_like),
        humidity: data.current.humidity,
        pressure: data.current.pressure,
        uvi: data.current.uvi,
        weather: data.current.weather[0],
        wind: {
          speed: data.current.wind_speed,
          deg: data.current.wind_deg,
        },
        rain: data.current.rain ? data.current.rain["1h"] || 0 : 0,
      },
      hourly: data.hourly.slice(0, 24).map((hour) => ({
        time: new Date(hour.dt * 1000),
        temp: Math.round(hour.temp),
        rain: hour.rain ? hour.rain["1h"] || 0 : 0,
        weather: hour.weather[0],
      })),
      daily: data.daily.slice(0, 7).map((day) => ({
        date: new Date(day.dt * 1000),
        temp_min: Math.round(day.temp.min),
        temp_max: Math.round(day.temp.max),
        humidity: day.humidity,
        rain: day.rain || 0,
        weather: day.weather[0],
      })),
    };
  }

  /**
   * Kiểm tra API key có hợp lệ không
   */
  isApiKeyValid() {
    return !!(this.apiKey && this.apiKey !== "your_openweather_api_key_here");
  }

  /**
   * Lấy lượng mưa dự báo cho phân tích ngập lụt
   * @param {number} lat - Vĩ độ
   * @param {number} lon - Kinh độ
   * @param {number} hours - Số giờ dự báo (mặc định 24h)
   * @returns {Promise<Array>} Mảng dữ liệu mưa theo giờ
   */
  async getRainForecast(lat = 16.0544, lon = 108.2022, hours = 24) {
    try {
      const forecast = await this.getForecast(lat, lon);
      const rainData = [];

      forecast.daily.forEach((day) => {
        day.items.forEach((item) => {
          rainData.push({
            time: item.time,
            rain: item.rain,
            coords: { lat, lon },
          });
        });
      });

      return rainData.slice(0, Math.ceil(hours / 3)); // API trả về mỗi 3h
    } catch (error) {
      console.error("Lỗi khi lấy dự báo mưa:", error);
      return [];
    }
  }
}

const weatherService = new WeatherService();
export default weatherService;
