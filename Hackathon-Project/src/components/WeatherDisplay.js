import React, { useState, useEffect, useCallback } from "react";
import weatherService from "../services/weatherService";
import "./WeatherDisplay.css";

const WeatherDisplay = ({ onWeatherUpdate }) => {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [hourlyForecast, setHourlyForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Helper function: Phân loại mức độ mưa
  const getRainLevel = (rainfall) => {
    if (rainfall === 0) {
      return {
        level: "none",
        label: "Không mưa",
        icon: "☀️",
        color: "#4CAF50",
        description: "Trời khô ráo",
      };
    } else if (rainfall < 2.5) {
      return {
        level: "light",
        label: "Mưa nhẹ",
        icon: "🌦️",
        color: "#81C784",
        description: "Mưa phùn, có thể không cần ô",
      };
    } else if (rainfall < 10) {
      return {
        level: "moderate",
        label: "Mưa vừa",
        icon: "🌧️",
        color: "#FFA726",
        description: "Nên mang theo ô",
      };
    } else if (rainfall < 50) {
      return {
        level: "heavy",
        label: "Mưa to",
        icon: "⛈️",
        color: "#FF6F00",
        description: "Mưa to, hạn chế đi lại",
      };
    } else {
      return {
        level: "extreme",
        label: "Mưa rất to",
        icon: "🌊",
        color: "#D32F2F",
        description: "Nguy hiểm! Có thể gây ngập",
      };
    }
  };

  // Helper function: Tính tổng mưa từ hourly data (chỉ tính giờ tương lai)
  const calculateTotalRainfall = (hours, limit) => {
    if (!hours || hours.length === 0) return 0;

    // Lọc chỉ lấy các giờ trong tương lai
    const now = Date.now();
    const futureHours = hours.filter((hour) => hour.dt * 1000 > now);

    if (futureHours.length === 0) return 0;

    let totalRain = 0;
    const dataPoints = Math.min(limit, futureHours.length);

    for (let i = 0; i < dataPoints; i++) {
      const hour = futureHours[i];

      // Kiểm tra data có phải là 1h hay 3h interval
      if (hour.rain?.["1h"]) {
        // Data 1h - cộng trực tiếp
        totalRain += hour.rain["1h"];
      } else if (hour.rain?.["3h"] && i === 0) {
        // Data 3h - chỉ lấy từ data point đầu tiên
        // Tính tỷ lệ theo limit
        totalRain = (hour.rain["3h"] * Math.min(limit, 3)) / 3;
        break; // Chỉ lấy data point đầu tiên
      }
    }

    return totalRain;
  };

  // Helper function: Tính lượng mưa TRUNG BÌNH mỗi giờ (giống overlay)
  const calculateAverageRainfall = (hours, limit) => {
    const total = calculateTotalRainfall(hours, limit);
    return total / limit; // Trả về mm/h thay vì mm tổng
  };

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

  // Loading state
  if (loading) {
    return (
      <div className="weather-display loading">
        <div className="weather-header">
          <h3>🌤️ Thời tiết Đà Nẵng</h3>
        </div>
        <div className="weather-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu thời tiết...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="weather-display error">
        <div className="weather-header">
          <h3>🌤️ Thời tiết Đà Nẵng</h3>
        </div>
        <div className="weather-error">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button onClick={fetchWeatherData} className="retry-btn">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="weather-display">
      {/* Header */}
      <div className="weather-header">
        <h3>🌤️ Thời tiết Đà Nẵng</h3>
        <button
          onClick={fetchWeatherData}
          className="refresh-btn"
          title="Làm mới"
        >
          🔄
        </button>
      </div>

      {/* Current Weather */}
      {weather && (
        <div className="current-weather">
          <div className="weather-main">
            <div className="weather-icon">
              <img
                src={`https://openweathermap.org/img/wn/${weather.current.weather.icon}@2x.png`}
                alt={weather.current.weather.description}
              />
            </div>
            <div className="weather-info">
              <div className="temperature">{weather.current.temp}°C</div>
              <div className="description">
                {weather.current.weather.description}
              </div>
              <div className="feels-like">
                Cảm giác như {weather.current.feels_like}°C
              </div>
            </div>
          </div>

          {/* Rainfall + Weather Details Container - 2 cột */}
          {hourlyForecast && hourlyForecast.length > 0 && (
            <div className="rainfall-weather-container">
              {/* Bên trái: Rainfall Indicator (2 phần) */}
              <div className="rainfall-section">
                <div className="rainfall-indicator">
                  {(() => {
                    const rainfall3h = calculateAverageRainfall(
                      hourlyForecast,
                      3
                    );
                    const rainfall6h = calculateAverageRainfall(
                      hourlyForecast,
                      6
                    );
                    const rainfall12h = calculateAverageRainfall(
                      hourlyForecast,
                      12
                    );
                    const rainLevel3h = getRainLevel(rainfall3h);
                    const rainLevel6h = getRainLevel(rainfall6h);

                    return (
                      <>
                        <div
                          className="rainfall-main"
                          style={{ borderLeftColor: rainLevel3h.color }}
                        >
                          <div className="rainfall-header">
                            <span className="rainfall-icon">
                              {rainLevel3h.icon}
                            </span>
                            <div className="rainfall-info">
                              <h5>{rainLevel3h.label}</h5>
                              <p className="rainfall-desc">
                                {rainLevel3h.description}
                              </p>
                            </div>
                          </div>
                          <div
                            className="rainfall-value-large"
                            style={{ color: rainLevel3h.color }}
                          >
                            {rainfall3h.toFixed(1)} mm/h
                          </div>
                          <div className="rainfall-period">trung bình 3 giờ tới</div>
                        </div>

                        <div className="rainfall-extended">
                          <div
                            className="rainfall-item"
                            style={{ borderLeftColor: rainLevel6h.color }}
                          >
                            <span className="item-icon">
                              {rainLevel6h.icon}
                            </span>
                            <div className="item-content">
                              <div className="item-label">TB 6h tới</div>
                              <div
                                className="item-value"
                                style={{ color: rainLevel6h.color }}
                              >
                                {rainfall6h.toFixed(1)} mm/h
                              </div>
                              <div className="item-level">
                                {rainLevel6h.label}
                              </div>
                            </div>
                          </div>
                          <div
                            className="rainfall-item"
                            style={{
                              borderLeftColor: getRainLevel(rainfall12h).color,
                            }}
                          >
                            <span className="item-icon">
                              {getRainLevel(rainfall12h).icon}
                            </span>
                            <div className="item-content">
                              <div className="item-label">TB 12h tới</div>
                              <div
                                className="item-value"
                                style={{
                                  color: getRainLevel(rainfall12h).color,
                                }}
                              >
                                {rainfall12h.toFixed(1)} mm/h
                              </div>
                              <div className="item-level">
                                {getRainLevel(rainfall12h).label}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Rainfall Scale Guide */}
                        <div className="rainfall-guide">
                          <div className="guide-title">
                            📏 Thang đo lượng mưa:
                          </div>
                          <div className="guide-items">
                            <div className="guide-item">
                              <span
                                className="guide-dot"
                                style={{ background: "#81C784" }}
                              ></span>
                              <span className="guide-text">
                                Nhẹ (&lt; 2.5mm)
                              </span>
                            </div>
                            <div className="guide-item">
                              <span
                                className="guide-dot"
                                style={{ background: "#FFA726" }}
                              ></span>
                              <span className="guide-text">Vừa (2.5-10mm)</span>
                            </div>
                            <div className="guide-item">
                              <span
                                className="guide-dot"
                                style={{ background: "#FF6F00" }}
                              ></span>
                              <span className="guide-text">To (10-50mm)</span>
                            </div>
                            <div className="guide-item">
                              <span
                                className="guide-dot"
                                style={{ background: "#D32F2F" }}
                              ></span>
                              <span className="guide-text">
                                Rất to (&gt; 50mm)
                              </span>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Bên phải: Weather Details (1 phần) - xếp dọc */}
              <div className="weather-details">
                <div className="detail-item">
                  <span className="detail-icon">💧</span>
                  <div className="detail-info">
                    <span className="detail-label">Độ ẩm</span>
                    <span className="detail-value">
                      {weather.current.humidity}%
                    </span>
                  </div>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">💨</span>
                  <div className="detail-info">
                    <span className="detail-label">Gió</span>
                    <span className="detail-value">
                      {weather.current.wind.speed} m/s
                    </span>
                  </div>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">📊</span>
                  <div className="detail-info">
                    <span className="detail-label">Áp suất</span>
                    <span className="detail-value">
                      {weather.current.pressure} hPa
                    </span>
                  </div>
                </div>
                <div className="detail-item rain-highlight">
                  <span className="detail-icon">🌧️</span>
                  <div className="detail-info">
                    <span className="detail-label">Lượng mưa</span>
                    <span className="detail-value">
                      {(() => {
                        // Tính lượng mưa 1 giờ tới từ hourly forecast
                        if (!hourlyForecast || hourlyForecast.length === 0) {
                          return '0 mm/h';
                        }
                        const now = Date.now();
                        const nextHour = hourlyForecast.find(h => h.dt * 1000 > now);
                        if (!nextHour) return '0 mm/h';
                        
                        const rain = nextHour.rain?.['1h'] || nextHour.rain?.['3h'] || 0;
                        const rainPerHour = nextHour.rain?.['3h'] ? rain / 3 : rain;
                        return `${rainPerHour.toFixed(1)} mm/h`;
                      })()}
                    </span>
                    <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
                      (Giờ tới)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hourly Rainfall Chart */}
      {hourlyForecast && hourlyForecast.length > 0 && (
        <div className="hourly-rainfall">
          <h4>📊 Lượng mưa 24h tới</h4>
          <div className="rainfall-chart">
            {(() => {
              const now = Date.now();
              const futureHours = hourlyForecast.filter(
                (hour) => hour.dt * 1000 > now
              );
              const displayHours = futureHours.slice(0, 24);
              const maxRain = Math.max(
                ...displayHours.map(
                  (h) => h.rain?.["1h"] || h.rain?.["3h"] || 0
                )
              );

              return displayHours.map((hour, index) => {
                const rainfall = hour.rain?.["1h"] || hour.rain?.["3h"] || 0;
                const time = new Date(hour.dt * 1000);
                const height = maxRain > 0 ? (rainfall / maxRain) * 100 : 0;

                return (
                  <div key={index} className="rainfall-bar-container">
                    <div
                      className="rainfall-bar"
                      style={{ height: `${height}%` }}
                    >
                      {rainfall > 0 && (
                        <span className="rainfall-value">
                          {rainfall.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="rainfall-time">{time.getHours()}h</div>
                  </div>
                );
              });
            })()}
          </div>
          <div className="rainfall-summary">
            <div className="summary-item">
              <span className="label">TB 3h tới:</span>
              <span className="value">
                {calculateAverageRainfall(hourlyForecast, 3).toFixed(1)} mm/h
              </span>
            </div>
            <div className="summary-item">
              <span className="label">TB 6h tới:</span>
              <span className="value">
                {calculateAverageRainfall(hourlyForecast, 6).toFixed(1)} mm/h
              </span>
            </div>
            <div className="summary-item">
              <span className="label">TB 12h tới:</span>
              <span className="value">
                {calculateAverageRainfall(hourlyForecast, 12).toFixed(1)} mm/h
              </span>
            </div>
            <div className="summary-note" style={{ fontSize: '11px', color: '#999', marginTop: '8px', textAlign: 'center' }}>
              💡 Lượng mưa trung bình mỗi giờ (khớp với overlay trên map)
            </div>
          </div>
        </div>
      )}

      {/* Forecast */}
      {forecast && forecast.daily && (
        <div className="weather-forecast">
          <h4>Dự báo 5 ngày</h4>
          <div className="forecast-list">
            {forecast.daily.map((day, index) => (
              <div key={index} className="forecast-item">
                <div className="forecast-date">
                  {index === 0
                    ? "Hôm nay"
                    : new Date(day.date).toLocaleDateString("vi-VN", {
                        weekday: "short",
                        day: "numeric",
                        month: "numeric",
                      })}
                </div>
                <div className="forecast-icon">
                  <img
                    src={`https://openweathermap.org/img/wn/${day.weather.icon}.png`}
                    alt={day.weather.description}
                  />
                </div>
                <div className="forecast-temps">
                  <span className="temp-max">{day.temp_max}°</span>
                  <span className="temp-min">{day.temp_min}°</span>
                </div>
                <div className="forecast-rain">
                  <span className="rain-icon">🌧️</span>
                  <span className="rain-value">
                    {day.total_rain.toFixed(1)}mm
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Updated */}
      {lastUpdated && (
        <div className="weather-footer">
          <small>Cập nhật: {lastUpdated.toLocaleTimeString("vi-VN")}</small>
        </div>
      )}
    </div>
  );
};

export default WeatherDisplay;
