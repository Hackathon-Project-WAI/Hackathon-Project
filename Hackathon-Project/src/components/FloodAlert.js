import React, { useState, useEffect } from "react";
import "./FloodAlert.css";
import weatherService from "../services/weatherService";
import floodPredictionService from "../services/floodPredictionService";

function FloodAlert() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    fetchFloodPredictions();
    // Auto refresh every 15 minutes
    const interval = setInterval(fetchFloodPredictions, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchFloodPredictions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Lấy dữ liệu hourly forecast từ OpenWeatherMap
      const hourlyData = await weatherService.getHourlyForecast(
        16.0544,
        108.2022
      );

      if (!hourlyData || hourlyData.length === 0) {
        throw new Error("Không có dữ liệu dự báo");
      }

      // Dự đoán ngập lụt
      const floodPredictions =
        floodPredictionService.predictFlooding(hourlyData);

      setPredictions(floodPredictions);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Lỗi khi dự báo ngập:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRiskIcon = (floodRisk) => {
    const icons = {
      0: "✅",
      1: "⚠️",
      2: "🚨",
      3: "🔴",
    };
    return icons[floodRisk] || "❓";
  };

  const getRiskClass = (floodRisk) => {
    const classes = {
      0: "safe",
      1: "warning",
      2: "danger",
      3: "critical",
    };
    return classes[floodRisk] || "safe";
  };

  if (loading) {
    return (
      <div className="flood-alert loading">
        <div className="loading-spinner"></div>
        <p>Đang phân tích dữ liệu dự báo ngập...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flood-alert error">
        <span className="error-icon">⚠️</span>
        <p>{error}</p>
        <button onClick={fetchFloodPredictions} className="retry-btn">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="flood-alert">
      <div className="flood-header">
        <h3>🌊 Dự Báo Ngập Lụt AI</h3>
        <button
          onClick={fetchFloodPredictions}
          className="refresh-btn"
          title="Làm mới"
        >
          🔄
        </button>
      </div>

      {lastUpdate && (
        <div className="last-update">
          Cập nhật: {lastUpdate.toLocaleTimeString("vi-VN")}
        </div>
      )}

      {predictions.length === 0 ? (
        <div className="no-flood-risk">
          <div className="safe-icon">✅</div>
          <h4>Tình hình an toàn</h4>
          <p>Hiện tại không có cảnh báo ngập lụt nào cho khu vực Đà Nẵng</p>
        </div>
      ) : (
        <div className="predictions-list">
          {predictions.map((item, index) => (
            <div
              key={item.area.id}
              className={`prediction-card ${getRiskClass(
                item.prediction.floodRisk
              )}`}
            >
              <div className="card-header">
                <div className="location-info">
                  <span className="risk-icon">
                    {getRiskIcon(item.prediction.floodRisk)}
                  </span>
                  <div>
                    <h4>{item.area.name}</h4>
                    <p className="district">{item.area.district}</p>
                  </div>
                </div>
                <div className="risk-badge">{item.prediction.riskScore}%</div>
              </div>

              <div className="card-body">
                <div className="status-message">{item.prediction.message}</div>

                <div className="prediction-details">
                  <div className="detail-row">
                    <span className="label">Mưa 3h tới:</span>
                    <span className="value">
                      {item.prediction.details.rainfall3h} mm
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Mưa 6h tới:</span>
                    <span className="value">
                      {item.prediction.details.rainfall6h} mm
                    </span>
                  </div>
                  {item.prediction.details.predictedDepth > 0 && (
                    <div className="detail-row highlight">
                      <span className="label">Độ sâu dự kiến:</span>
                      <span className="value">
                        {item.prediction.details.predictedDepth} cm
                      </span>
                    </div>
                  )}
                  {item.prediction.details.estimatedDuration > 0 && (
                    <div className="detail-row">
                      <span className="label">Thời gian ngập:</span>
                      <span className="value">
                        ~{item.prediction.details.estimatedDuration} phút
                      </span>
                    </div>
                  )}
                </div>

                <div className="recommendation">
                  <strong>💡 Khuyến nghị:</strong>
                  <p>{item.prediction.recommendation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flood-footer">
        <small>
          🤖 Dự báo bằng AI dựa trên dữ liệu thời tiết thực tế và mô hình học
          máy
        </small>
      </div>
    </div>
  );
}

export default FloodAlert;
