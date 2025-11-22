/**
 * WeatherDropdown Component
 * Compact weather info dropdown for navigation
 */

import React, { useState, useEffect } from "react";
import "./WeatherDropdown.css";
import weatherService from "../services/weatherService";
import floodService from "../services/floodPredictionService";
import floodData from "../data/floodProneAreas.json";

const WeatherDropdown = () => {
  const [weather, setWeather] = useState(null);
  const [hourlyForecast, setHourlyForecast] = useState(null);
  const [floodPredictions, setFloodPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 600000); // Refresh every 10 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const lat = 16.0544;
      const lon = 108.2022;

      // Fetch weather data
      const [weatherData, hourlyData] = await Promise.all([
        weatherService.getCurrentWeather(lat, lon),
        weatherService.getHourlyForecast(lat, lon),
      ]);

      setWeather(weatherData);
      setHourlyForecast(hourlyData);

      // Fetch flood predictions
      if (hourlyData && hourlyData.length > 0) {
        const predictions = await floodService.predictFlooding(hourlyData);
        setFloodPredictions(predictions);
      }
    } catch (error) {
      console.error("Error fetching weather dropdown data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate rainfall for next 3 hours
  const calculateRainfall3h = () => {
    if (!hourlyForecast || hourlyForecast.length === 0) return 0;

    const now = Date.now();
    const futureHours = hourlyForecast.filter((hour) => hour.dt * 1000 > now);

    if (futureHours.length === 0) return 0;

    let totalRain = 0;
    const limit = 3;
    const dataPoints = Math.min(limit, futureHours.length);

    for (let i = 0; i < dataPoints; i++) {
      const hour = futureHours[i];
      if (hour.rain?.["1h"]) {
        totalRain += hour.rain["1h"];
      } else if (hour.rain?.["3h"]) {
        if (limit <= 3) {
          totalRain += (hour.rain["3h"] * limit) / 3;
          break;
        } else {
          totalRain += hour.rain["3h"];
        }
      }
    }

    return totalRain;
  };

  // Get rain level
  const getRainLevel = (rainfall) => {
    if (rainfall === 0)
      return { level: "none", label: "Không mưa", color: "#4CAF50" };
    if (rainfall < 2.5)
      return { level: "light", label: "Mưa nhẹ", color: "#81C784" };
    if (rainfall < 10)
      return { level: "moderate", label: "Mưa vừa", color: "#FFA726" };
    if (rainfall < 50)
      return { level: "heavy", label: "Mưa to", color: "#FF6F00" };
    return { level: "extreme", label: "Mưa rất to", color: "#D32F2F" };
  };

  // Get highest flood risk
  const getFloodRisk = () => {
    if (!floodPredictions || floodPredictions.length === 0) {
      const totalFloodZones = floodData?.floodPrones?.length || 0;
      return {
        level: "monitor",
        label: `${totalFloodZones} điểm theo dõi`,
        icon: "📍",
        color: "#2196F3",
      };
    }

    const highestRisk = floodPredictions.reduce((max, pred) => {
      return pred.riskScore > max.riskScore ? pred : max;
    }, floodPredictions[0]);

    if (highestRisk.riskLevel === "critical") {
      return {
        level: "critical",
        label: "Ngập nặng",
        icon: "🚨",
        color: "#D32F2F",
      };
    } else if (highestRisk.riskLevel === "danger") {
      return {
        level: "danger",
        label: "Có ngập",
        icon: "⚠️",
        color: "#FF6F00",
      };
    } else if (highestRisk.riskLevel === "warning") {
      return {
        level: "warning",
        label: "Nguy cơ ngập",
        icon: "⚡",
        color: "#FFA726",
      };
    }
    return {
      level: "safe",
      label: "Không ngập",
      icon: "✅",
      color: "#4CAF50",
    };
  };

  if (loading || !weather) {
    return (
      <div className="weather-dropdown-content loading">
        <div className="dropdown-spinner">⏳ Đang tải...</div>
      </div>
    );
  }

  const rainfall3h = calculateRainfall3h();
  const rainLevel = getRainLevel(rainfall3h);
  const floodRisk = getFloodRisk();

  return (
    <div className="weather-dropdown-content">
      <div className="weather-dropdown-items">
        {/* Temperature */}
        <div className="weather-dropdown-item temperature">
          <div className="dropdown-item-icon">🌡️</div>
          <div className="dropdown-item-info">
            <div className="dropdown-item-value">
              {Math.round(weather.current.temp)}°C
            </div>
            <div className="dropdown-item-label">
              {weather.current.description}
            </div>
          </div>
        </div>

        {/* Rainfall */}
        <div className="weather-dropdown-item rainfall">
          <div className="dropdown-item-icon">🌧️</div>
          <div className="dropdown-item-info">
            <div
              className="dropdown-item-value"
              style={{ color: rainLevel.color }}
            >
              {rainfall3h.toFixed(1)} mm
            </div>
            <div className="dropdown-item-label">
              {rainLevel.label} (3h tới)
            </div>
          </div>
        </div>

        {/* Flood Risk */}
        <div className="weather-dropdown-item flood">
          <div className="dropdown-item-icon">{floodRisk.icon}</div>
          <div className="dropdown-item-info">
            <div
              className="dropdown-item-value"
              style={{ color: floodRisk.color }}
            >
              {floodRisk.label}
            </div>
            <div className="dropdown-item-label">Tình trạng ngập</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherDropdown;
