import React, { useState, useEffect, useCallback } from "react";
import weatherService from "../services/weatherService";

const WeatherDisplay = ({ onWeatherUpdate }) => {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [hourlyForecast, setHourlyForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch weather data
  const fetchWeatherData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!weatherService.isApiKeyValid()) {
        throw new Error("OpenWeatherMap API key chưa được cấu hình");
      }

      // Fetch current weather, forecast và hourly data song song
      const [currentWeather, forecastData, hourlyData] = await Promise.all([
        weatherService.getCurrentWeather(),
        weatherService.getForecast(),
        weatherService.getHourlyForecast(),
      ]);

      setWeather(currentWeather);
      setForecast(forecastData);
      setHourlyForecast(hourlyData);
      setLastUpdated(new Date());

      // Callback để parent component có thể sử dụng dữ liệu weather
      if (onWeatherUpdate) {
        onWeatherUpdate({ current: currentWeather, forecast: forecastData });
      }
    } catch (err) {
      console.error("Lỗi khi lấy dữ liệu thời tiết:", err);
      setError(err.message || "Không thể tải dữ liệu thời tiết");
    } finally {
      setLoading(false);
    }
  }, [onWeatherUpdate]);

  // Initial load và auto refresh mỗi 10 phút
  useEffect(() => {
    fetchWeatherData();

    const interval = setInterval(fetchWeatherData, 10 * 60 * 1000); // 10 phút
    return () => clearInterval(interval);
  }, [fetchWeatherData]);

  // Helper functions
  const calculateAverageRainfall = (hours, limit) => {
    if (!hours || hours.length === 0) return 0;
    const now = Date.now();
    const futureHours = hours.filter((hour) => hour.dt * 1000 > now);
    if (futureHours.length === 0) return 0;

    let totalRain = 0;
    const dataPoints = Math.min(limit, futureHours.length);

    for (let i = 0; i < dataPoints; i++) {
      const hour = futureHours[i];
      if (hour.rain?.["1h"]) {
        totalRain += hour.rain["1h"];
      } else if (hour.rain?.["3h"] && i === 0) {
        totalRain = (hour.rain["3h"] * Math.min(limit, 3)) / 3;
        break;
      }
    }
    return totalRain / limit;
  };

  const getRainLevel = (rainfall) => {
    if (rainfall === 0)
      return { label: "Không mưa", description: "Trời khô ráo" };
    if (rainfall < 2.5)
      return { label: "Mưa nhẹ", description: "Mưa phùn, có thể không cần ô" };
    if (rainfall < 10)
      return { label: "Mưa vừa", description: "Nên mang theo ô" };
    if (rainfall < 50)
      return { label: "Mưa to", description: "Hạn chế di chuyển" };
    return { label: "Mưa rất to", description: "Nguy hiểm ngập lụt" };
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <i className="fa-solid fa-triangle-exclamation text-4xl text-yellow-500 mb-4"></i>
        <p className="text-slate-600 mb-4">{error}</p>
        <button
          onClick={fetchWeatherData}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const rainfall3h = hourlyForecast
    ? calculateAverageRainfall(hourlyForecast, 3)
    : 0;
  const rainLevel3h = getRainLevel(rainfall3h);

  return (
    <div className="weather-main-grid">
      {/* LEFT COLUMN */}
      <div className="weather-left-column">
        {/* Top Section: Current Status + Rainfall Highlight */}
        <div className="weather-top-section">
          {/* Current Status */}
          <div className="glass-card current-weather-card">
            <div className="flex items-center justify-between mb-4">
              <span className="weather-badge">Hiện tại</span>
              <i className="fa-regular fa-circle-question text-slate-400 hover:text-blue-500 cursor-pointer"></i>
            </div>

            <div className="current-temp-display">
              <h2 className="temp-large">
                {Math.round(weather?.current?.temp || 0)}°
              </h2>
              <div className="temp-info">
                <p className="weather-description capitalize">
                  {weather?.current?.weather?.[0]?.description}
                </p>
                <p className="feels-like">
                  Cảm giác như {Math.round(weather?.current?.feels_like || 0)}°C
                </p>
              </div>
            </div>

            <div className="weather-tags">
              <span className="weather-tag">
                <i className="fa-solid fa-droplet text-blue-500"></i>
                {rainfall3h > 0 ? rainLevel3h.label : "Không mưa"}
              </span>
              <span className="weather-tag">
                <i className="fa-solid fa-wind text-cyan-500"></i>
                {weather?.current?.wind?.speed < 5 ? "Gió nhẹ" : "Gió mạnh"}
              </span>
            </div>
          </div>

          {/* Rainfall Stats (Highlighted) */}
          <div className="glass-card rainfall-card">
            <div className="rainfall-header">
              <div className="rainfall-icon">
                <i className="fa-solid fa-cloud-showers-heavy"></i>
              </div>
              <div className="rainfall-title">
                <h3>{rainLevel3h.label}</h3>
                <p>{rainLevel3h.description}</p>
              </div>
            </div>

            <div className="rainfall-value">
              <span className="value-large">{rainfall3h.toFixed(1)}</span>
              <span className="value-unit">mm/h</span>
              <p className="value-description">Trung bình 3 giờ tới</p>
            </div>

            <div className="rainfall-grid">
              <div className="rainfall-item">
                <span className="rainfall-item-label">1h tới</span>
                <span className="rainfall-item-value">
                  {hourlyForecast
                    ? calculateAverageRainfall(hourlyForecast, 1).toFixed(1)
                    : 0}{" "}
                  mm/h
                </span>
              </div>
              <div className="rainfall-item">
                <span className="rainfall-item-label">12h tới</span>
                <span className="rainfall-item-value">
                  {hourlyForecast
                    ? calculateAverageRainfall(hourlyForecast, 12).toFixed(1)
                    : 0}{" "}
                  mm/h
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Card */}
        <div className="glass-card chart-card">
          <div className="chart-header">
            <h3 className="chart-title">
              <i className="fa-solid fa-chart-simple"></i>
              Lượng mưa 24h tới
            </h3>
            <div className="chart-legend">
              <span className="legend-item">
                <span className="legend-dot bg-green-400"></span> Nhẹ
                (&lt;2.5mm)
              </span>
              <span className="legend-item">
                <span className="legend-dot bg-yellow-400"></span> Vừa
              </span>
              <span className="legend-item">
                <span className="legend-dot bg-red-400"></span> To
              </span>
            </div>
          </div>

          {/* Custom Bar Chart */}
          <div className="bar-container">
            {hourlyForecast &&
              hourlyForecast.slice(0, 16).map((hour, index) => {
                // Sửa lỗi: Kiểm tra cả rain['1h'] và rain['3h']
                let rain = 0;
                if (hour.rain?.["1h"]) {
                  rain = hour.rain["1h"];
                } else if (hour.rain?.["3h"]) {
                  rain = hour.rain["3h"] / 3; // Chia 3 để quy đổi ra lượng mưa/giờ
                }

                // Scale height: max 10mm for visualization
                const heightPercent = Math.min((rain / 5) * 100, 100);
                let barColor = "bg-blue-400";
                if (rain > 2.5) barColor = "bg-yellow-400";
                if (rain > 10) barColor = "bg-red-400";

                // Nếu không mưa, hiển thị bar thấp mờ để giữ layout
                if (rain === 0) barColor = "bg-blue-200/30";

                return (
                  <div
                    key={index}
                    className={`bar ${barColor}`}
                    style={{ height: `${Math.max(heightPercent, 5)}%` }}
                    data-val={`${rain.toFixed(1)}`}
                  ></div>
                );
              })}
          </div>

          <div className="chart-labels">
            {hourlyForecast &&
              hourlyForecast
                .slice(0, 16)
                .filter((_, i) => i % 3 === 0)
                .map((hour, i) => (
                  <span key={i}>{new Date(hour.dt * 1000).getHours()}h</span>
                ))}
          </div>

          <div className="chart-stats">
            <div className="chart-stat-item">
              <span className="chart-stat-label">TB 3h tới</span>
              <span className="chart-stat-value">
                {rainfall3h.toFixed(1)} mm/h
              </span>
            </div>
            <div className="chart-stat-item">
              <span className="chart-stat-label">TB 6h tới</span>
              <span className="chart-stat-value">
                {hourlyForecast
                  ? calculateAverageRainfall(hourlyForecast, 6).toFixed(1)
                  : 0}{" "}
                mm/h
              </span>
            </div>
            <div className="chart-stat-item">
              <span className="chart-stat-label">TB 12h tới</span>
              <span className="chart-stat-value">
                {hourlyForecast
                  ? calculateAverageRainfall(hourlyForecast, 12).toFixed(1)
                  : 0}{" "}
                mm/h
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="weather-right-column">
        {/* Indicators */}
        <div className="indicators-grid">
          {/* Humidity */}
          <div className="indicator-card blue">
            <div className="indicator-content">
              <div className="indicator-icon blue">
                <i className="fa-solid fa-droplet"></i>
              </div>
              <div className="indicator-info">
                <span className="indicator-label">Độ ẩm</span>
                <span className="indicator-value">
                  {weather?.current?.humidity}%
                </span>
              </div>
            </div>
          </div>

          {/* Wind */}
          <div className="indicator-card purple">
            <div className="indicator-content">
              <div className="indicator-icon purple">
                <i className="fa-solid fa-wind"></i>
              </div>
              <div className="indicator-info">
                <span className="indicator-label">Gió</span>
                <span className="indicator-value">
                  {weather?.current?.wind?.speed}{" "}
                  <span className="indicator-value-unit">m/s</span>
                </span>
              </div>
            </div>
          </div>

          {/* Pressure */}
          <div className="indicator-card pink">
            <div className="indicator-content">
              <div className="indicator-icon pink">
                <i className="fa-solid fa-gauge-high"></i>
              </div>
              <div className="indicator-info">
                <span className="indicator-label">Áp suất</span>
                <span className="indicator-value">
                  {weather?.current?.pressure}{" "}
                  <span className="indicator-value-unit">hPa</span>
                </span>
              </div>
            </div>
          </div>

          {/* Rain Total */}
          <div className="indicator-card primary">
            <div className="indicator-content">
              <div className="indicator-icon white">
                <i className="fa-solid fa-cloud-rain"></i>
              </div>
              <div className="indicator-info">
                <span className="indicator-label">Lượng mưa</span>
                <span className="indicator-value">
                  {rainfall3h.toFixed(1)}{" "}
                  <span className="indicator-value-unit">mm/h</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 5-Day Forecast */}
        <div className="glass-card forecast-card">
          <h3 className="forecast-title">Dự báo 5 ngày</h3>
          <div className="forecast-list">
            {forecast?.daily?.slice(0, 5).map((day, index) => (
              <div key={index} className="forecast-item">
                <span className="forecast-day">
                  {index === 0
                    ? "Hôm nay"
                    : new Date(day.date).toLocaleDateString("vi-VN", {
                        weekday: "short",
                        day: "numeric",
                        month: "numeric",
                      })}
                </span>
                <div className="forecast-icon text-slate-500">
                  <img
                    src={`https://openweathermap.org/img/wn/${day.weather.icon}.png`}
                    alt=""
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <div className="forecast-temps">
                  <span className="forecast-temp-high">
                    {Math.round(day.temp_max)}°
                  </span>
                  <span className="forecast-temp-low">
                    {Math.round(day.temp_min)}°
                  </span>
                </div>
                <span className="forecast-rain">
                  {day.total_rain.toFixed(1)}mm
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherDisplay;
