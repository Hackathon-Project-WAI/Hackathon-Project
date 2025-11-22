/**
 * Firebase Sensors Monitor Component
 * Real-time monitoring của IoT sensors từ Firebase
 */
import React, { useState } from "react";
import { useFirebaseSensors } from "../hooks/useFirebaseSensors";
import { useAIAlert } from "../hooks/useAIAlert";
import "./FirebaseSensorsMonitor.css";

const FirebaseSensorsMonitor = () => {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [userEmail, setUserEmail] = useState("");

  const {
    sensors,
    loading,
    error,
    lastUpdate,
    fetchSensors,
    dangerousSensors,
  } = useFirebaseSensors(autoRefresh, refreshInterval);

  const { generateFromSensor } = useAIAlert();

  const getFloodStatusColor = (status) => {
    const colors = {
      SAFE: "#4caf50",
      WARNING: "#ffc107",
      DANGER: "#f44336",
      CRITICAL: "#b71c1c",
    };
    return colors[status] || "#9e9e9e";
  };

  const getFloodStatusText = (status) => {
    const texts = {
      SAFE: "An toàn",
      WARNING: "Cảnh báo",
      DANGER: "Nguy hiểm",
      CRITICAL: "Nghiêm trọng",
    };
    return texts[status] || status;
  };

  const handleGenerateAlert = async (sensor, sensorId) => {
    if (!sensor) return;

    try {
      const result = await generateFromSensor(
        {
          ...sensor,
          device_id: sensorId,
          water_level_percentage: sensor.water_level_cm * 2, // Convert cm to %
          previous_level: (sensor.water_level_cm - 5) * 2,
        },
        userEmail || null
      );

      alert(`✅ Cảnh báo đã được tạo!\n\nTiêu đề: ${result.alert.subject}`);
    } catch (err) {
      alert(`❌ Lỗi: ${err.message}`);
    }
  };

  return (
    <div className="firebase-sensors-monitor">
      <div className="monitor-header">
        <h2>🌊 Firebase IoT Sensors Monitor</h2>
        <p>Theo dõi thời gian thực các cảm biến ngập lụt</p>
      </div>

      {/* Controls */}
      <div className="monitor-controls">
        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Tự động refresh
          </label>

          {autoRefresh && (
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
            >
              <option value="3000">3 giây</option>
              <option value="5000">5 giây</option>
              <option value="10000">10 giây</option>
              <option value="30000">30 giây</option>
            </select>
          )}
        </div>

        <div className="control-group">
          <input
            type="email"
            placeholder="Email để nhận cảnh báo (tùy chọn)"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            className="email-input"
          />
        </div>

        <button
          onClick={fetchSensors}
          disabled={loading}
          className="btn-refresh"
        >
          {loading ? "⏳" : "🔄"} Refresh
        </button>
      </div>

      {/* Last Update */}
      {lastUpdate && (
        <div className="last-update">
          🕒 Cập nhật lần cuối: {lastUpdate.toLocaleString("vi-VN")}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="monitor-error">
          <strong>❌ Lỗi:</strong> {error}
          <p>Kiểm tra backend có đang chạy không (http://localhost:3001)</p>
        </div>
      )}

      {/* Dangerous Sensors Alert */}
      {dangerousSensors.length > 0 && (
        <div className="danger-alert">
          <strong>⚠️ CẢNH BÁO:</strong> {dangerousSensors.length} cảm biến ở
          trạng thái NGUY HIỂM!
        </div>
      )}

      {/* Sensors Display */}
      {sensors && (
        <div className="sensors-grid">
          {/* SENSOR_ROAD */}
          {sensors.SENSOR_ROAD && (
            <div className="sensor-card">
              <div className="sensor-header">
                <h3>🚗 {sensors.SENSOR_ROAD.device_id || "SENSOR_ROAD"}</h3>
                <span
                  className="status-badge"
                  style={{
                    backgroundColor: getFloodStatusColor(
                      sensors.SENSOR_ROAD.flood_status
                    ),
                  }}
                >
                  {getFloodStatusText(sensors.SENSOR_ROAD.flood_status)}
                </span>
              </div>

              <div className="sensor-body">
                <div className="sensor-metric">
                  <span className="metric-label">Mực nước:</span>
                  <span className="metric-value">
                    {sensors.SENSOR_ROAD.water_level_cm} cm
                  </span>
                </div>

                <div className="sensor-location">
                  📍 Vị trí: {sensors.SENSOR_ROAD.latitude?.toFixed(4)},{" "}
                  {sensors.SENSOR_ROAD.longitude?.toFixed(4)}
                </div>

                {sensors.SENSOR_ROAD.timestamp && (
                  <div className="sensor-time">
                    🕒{" "}
                    {new Date(
                      sensors.SENSOR_ROAD.timestamp * 1000
                    ).toLocaleString("vi-VN")}
                  </div>
                )}
              </div>

              <button
                onClick={() =>
                  handleGenerateAlert(sensors.SENSOR_ROAD, "SENSOR_ROAD")
                }
                className="btn-generate-alert"
              >
                🤖 Tạo AI Alert
              </button>
            </div>
          )}

          {/* SENSOR_SEWER */}
          {sensors.SENSOR_SEWER && (
            <div className="sensor-card">
              <div className="sensor-header">
                <h3>🚰 {sensors.SENSOR_SEWER.device_id || "SENSOR_SEWER"}</h3>
                <span
                  className="status-badge"
                  style={{
                    backgroundColor: getFloodStatusColor(
                      sensors.SENSOR_SEWER.flood_status
                    ),
                  }}
                >
                  {getFloodStatusText(sensors.SENSOR_SEWER.flood_status)}
                </span>
              </div>

              <div className="sensor-body">
                <div className="sensor-metric">
                  <span className="metric-label">Mực nước:</span>
                  <span className="metric-value">
                    {sensors.SENSOR_SEWER.water_level_cm} cm
                  </span>
                </div>

                <div className="sensor-location">
                  📍 Vị trí: {sensors.SENSOR_SEWER.latitude?.toFixed(4)},{" "}
                  {sensors.SENSOR_SEWER.longitude?.toFixed(4)}
                </div>

                {sensors.SENSOR_SEWER.timestamp && (
                  <div className="sensor-time">
                    🕒{" "}
                    {new Date(
                      sensors.SENSOR_SEWER.timestamp * 1000
                    ).toLocaleString("vi-VN")}
                  </div>
                )}
              </div>

              <button
                onClick={() =>
                  handleGenerateAlert(sensors.SENSOR_SEWER, "SENSOR_SEWER")
                }
                className="btn-generate-alert"
              >
                🤖 Tạo AI Alert
              </button>
            </div>
          )}

          {/* Water Level Status */}
          {sensors.water_level_status && (
            <div className="sensor-card status-card">
              <div className="sensor-header">
                <h3>📊 Water Level Status</h3>
              </div>

              <div className="sensor-body">
                <div className="status-list">
                  {Object.entries(sensors.water_level_status).map(
                    ([key, value]) => (
                      <div key={key} className="status-item">
                        <span className="status-key">{key}:</span>
                        <span className="status-value">{String(value)}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && !sensors && !error && (
        <div className="empty-state">
          <p>Không có dữ liệu sensors</p>
          <p>Kiểm tra Firebase Realtime Database có dữ liệu không</p>
        </div>
      )}
    </div>
  );
};

export default FirebaseSensorsMonitor;
