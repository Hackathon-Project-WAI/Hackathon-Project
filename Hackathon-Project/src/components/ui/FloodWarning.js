import React, { useState, useEffect } from "react";
import floodWarningService from "../services/floodWarningService";
import "./FloodWarning.css";

const FloodWarning = ({ weatherData, onWarningsUpdate }) => {
  const [warnings, setWarnings] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [expandedWarning, setExpandedWarning] = useState(null);

  // Fetch flood warnings
  const fetchWarnings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Phân tích nguy cơ ngập lụt
      const [warningsList, stats] = await Promise.all([
        floodWarningService.analyzeFloodRisk(),
        floodWarningService.getFloodStatistics(),
      ]);

      setWarnings(warningsList);
      setStatistics(stats);
      setLastUpdated(new Date());

      // Callback để parent component có thể sử dụng dữ liệu
      if (onWarningsUpdate) {
        onWarningsUpdate(warningsList);
      }
    } catch (err) {
      console.error("Lỗi khi phân tích cảnh báo ngập lụt:", err);
      setError(err.message || "Không thể phân tích nguy cơ ngập lụt");
    } finally {
      setLoading(false);
    }
  };

  // Tự động cập nhật khi có dữ liệu thời tiết mới
  useEffect(() => {
    if (weatherData) {
      fetchWarnings();
    }
  }, [weatherData]);

  // Initial load
  useEffect(() => {
    fetchWarnings();

    // Auto refresh mỗi 15 phút
    const interval = setInterval(fetchWarnings, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Get icon cho warning level
  const getWarningIcon = (level) => {
    const icons = {
      yellow: "🟡",
      orange: "🟠",
      red: "🔴",
      green: "🟢",
    };
    return icons[level] || "⚠️";
  };

  // Format thời gian
  const formatTime = (date) => {
    if (!date) return "Chưa xác định";
    return new Date(date).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });
  };

  // Toggle expanded warning
  const toggleWarning = (warningId) => {
    setExpandedWarning(expandedWarning === warningId ? null : warningId);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flood-warning loading">
        <div className="warning-header">
          <h3>🌊 Cảnh báo ngập lụt</h3>
        </div>
        <div className="warning-loading">
          <div className="loading-spinner"></div>
          <p>Đang phân tích nguy cơ ngập lụt...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flood-warning error">
        <div className="warning-header">
          <h3>🌊 Cảnh báo ngập lụt</h3>
        </div>
        <div className="warning-error">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button onClick={fetchWarnings} className="retry-btn">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flood-warning">
      {/* Header với thống kê */}
      <div className="warning-header">
        <h3>🌊 Cảnh báo ngập lụt</h3>
        <button onClick={fetchWarnings} className="refresh-btn" title="Làm mới">
          🔄
        </button>
      </div>

      {/* Statistics Summary */}
      {statistics && (
        <div className="warning-summary">
          <div className="summary-item">
            <span className="summary-icon">📍</span>
            <span className="summary-label">Tổng điểm</span>
            <span className="summary-value">{statistics.totalAreas}</span>
          </div>
          <div className="summary-item red">
            <span className="summary-icon">🔴</span>
            <span className="summary-label">Nguy cơ cao</span>
            <span className="summary-value">
              {statistics.warningCounts.red}
            </span>
          </div>
          <div className="summary-item orange">
            <span className="summary-icon">🟠</span>
            <span className="summary-label">Nguy cơ TB</span>
            <span className="summary-value">
              {statistics.warningCounts.orange}
            </span>
          </div>
          <div className="summary-item yellow">
            <span className="summary-icon">🟡</span>
            <span className="summary-label">Theo dõi</span>
            <span className="summary-value">
              {statistics.warningCounts.yellow}
            </span>
          </div>
        </div>
      )}

      {/* Warnings List */}
      <div className="warnings-list">
        {warnings.length === 0 ? (
          <div className="no-warnings">
            <span className="no-warnings-icon">✅</span>
            <h4>Tình hình tốt</h4>
            <p>Hiện tại không có cảnh báo ngập lụt nào</p>
          </div>
        ) : (
          warnings.map((warning) => (
            <div
              key={warning.areaId}
              className={`warning-item ${warning.warningLevel}`}
              onClick={() => toggleWarning(warning.areaId)}
            >
              {/* Warning Header */}
              <div className="warning-item-header">
                <div className="warning-main">
                  <span className="warning-icon">
                    {getWarningIcon(warning.warningLevel)}
                  </span>
                  <div className="warning-info">
                    <h4 className="warning-title">{warning.areaName}</h4>
                    <p className="warning-district">{warning.district}</p>
                  </div>
                </div>
                <div className="warning-level">
                  <span
                    className="level-badge"
                    style={{
                      backgroundColor: warning.warningInfo.color,
                    }}
                  >
                    {warning.warningInfo.name}
                  </span>
                  <span className="expand-icon">
                    {expandedWarning === warning.areaId ? "▼" : "▶"}
                  </span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="warning-quick-stats">
                <div className="quick-stat">
                  <span className="stat-icon">🌧️</span>
                  <span className="stat-value">
                    {warning.rainData.total24h}mm
                  </span>
                  <span className="stat-label">24h</span>
                </div>
                <div className="quick-stat">
                  <span className="stat-icon">📊</span>
                  <span className="stat-value">
                    {warning.prediction.floodProbability}%
                  </span>
                  <span className="stat-label">Xác suất</span>
                </div>
                <div className="quick-stat">
                  <span className="stat-icon">⏰</span>
                  <span className="stat-value">
                    {warning.prediction.estimatedStartTime
                      ? formatTime(warning.prediction.estimatedStartTime)
                      : "N/A"}
                  </span>
                  <span className="stat-label">Bắt đầu</span>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedWarning === warning.areaId && (
                <div className="warning-details">
                  {/* Rain Details */}
                  <div className="detail-section">
                    <h5>📊 Dữ liệu mưa</h5>
                    <div className="rain-breakdown">
                      <div className="rain-item">
                        <span>3 giờ tới:</span>
                        <span className="rain-value">
                          {warning.rainData.total3h}mm
                        </span>
                      </div>
                      <div className="rain-item">
                        <span>6 giờ tới:</span>
                        <span className="rain-value">
                          {warning.rainData.total6h}mm
                        </span>
                      </div>
                      <div className="rain-item">
                        <span>24 giờ tới:</span>
                        <span className="rain-value">
                          {warning.rainData.total24h}mm
                        </span>
                      </div>
                    </div>
                    <div className="thresholds">
                      <span>Ngưỡng cảnh báo: </span>
                      <span className="threshold yellow">
                        Vàng: {warning.rainData.threshold.yellow}mm
                      </span>
                      <span className="threshold orange">
                        Cam: {warning.rainData.threshold.orange}mm
                      </span>
                      <span className="threshold red">
                        Đỏ: {warning.rainData.threshold.red}mm
                      </span>
                    </div>
                  </div>

                  {/* Predictions */}
                  <div className="detail-section">
                    <h5>🔮 Dự báo</h5>
                    <div className="prediction-grid">
                      <div className="prediction-item">
                        <span className="pred-label">Xác suất ngập:</span>
                        <span className="pred-value">
                          {warning.prediction.floodProbability}%
                        </span>
                      </div>
                      <div className="prediction-item">
                        <span className="pred-label">Độ sâu dự kiến:</span>
                        <span className="pred-value">
                          {warning.prediction.estimatedDepth}m
                        </span>
                      </div>
                      <div className="prediction-item">
                        <span className="pred-label">Thời gian ngập:</span>
                        <span className="pred-value">
                          {warning.prediction.duration}h
                        </span>
                      </div>
                      <div className="prediction-item">
                        <span className="pred-label">Bắt đầu lúc:</span>
                        <span className="pred-value">
                          {formatTime(warning.prediction.estimatedStartTime)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="detail-section">
                    <h5>💡 Khuyến nghị</h5>
                    <ul className="recommendations">
                      {warning.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {lastUpdated && (
        <div className="warning-footer">
          <small>Cập nhật: {lastUpdated.toLocaleTimeString("vi-VN")}</small>
        </div>
      )}
    </div>
  );
};

export default FloodWarning;
