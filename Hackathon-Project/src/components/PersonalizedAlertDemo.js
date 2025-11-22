/**
 * Personalized Alert Demo Component
 * Component để demo tính năng cảnh báo cá nhân hóa
 */
import React, { useState, useEffect } from 'react';
import { usePersonalizedAlert } from '../hooks/usePersonalizedAlert';
import './PersonalizedAlertDemo.css';

const PersonalizedAlertDemo = ({ currentUserId = null }) => {
  const [userId, setUserId] = useState(currentUserId || 'MgqmfPnodPRCjEhqyfycYavN2cK2');
  const [minRiskLevel, setMinRiskLevel] = useState(1);
  const [sendEmail, setSendEmail] = useState(false); // Default false for demo
  
  const {
    loading,
    error,
    locations,
    alerts,
    stats,
    fetchLocations,
    checkLocationsAndAlert,
    fetchLocationStats,
  } = usePersonalizedAlert(userId);

  useEffect(() => {
    if (userId) {
      fetchLocations();
      fetchLocationStats();
    }
  }, [userId, fetchLocations, fetchLocationStats]);

  const handleCheckAlerts = async () => {
    try {
      await checkLocationsAndAlert(minRiskLevel, sendEmail);
    } catch (err) {
      console.error('Failed to check alerts:', err);
    }
  };

  const getRiskLevelColor = (level) => {
    const colors = {
      0: '#4caf50',
      1: '#ffc107',
      2: '#ff9800',
      3: '#f44336',
    };
    return colors[level] || '#9e9e9e';
  };

  const getRiskLevelText = (level) => {
    const texts = {
      0: 'An toàn',
      1: 'Cảnh báo',
      2: 'Nguy hiểm',
      3: 'Nghiêm trọng',
    };
    return texts[level] || 'Không xác định';
  };

  const getStatusColor = (status) => {
    const colors = {
      safe: '#4caf50',
      warning: '#ffc107',
      danger: '#ff9800',
      critical: '#f44336',
    };
    return colors[status] || '#9e9e9e';
  };

  return (
    <div className="personalized-alert-demo">
      <div className="demo-header">
        <h2>🎯 Personalized Flood Alerts</h2>
        <p>Cảnh báo ngập lụt cá nhân hóa dựa trên địa điểm của bạn</p>
      </div>

      {/* User Input */}
      <div className="user-input-section">
        <div className="form-group">
          <label>User ID:</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Nhập Firebase User ID"
          />
        </div>

        <div className="form-group">
          <label>Mức độ cảnh báo tối thiểu:</label>
          <select
            value={minRiskLevel}
            onChange={(e) => setMinRiskLevel(parseInt(e.target.value))}
          >
            <option value="0">Tất cả (bao gồm an toàn)</option>
            <option value="1">Cảnh báo trở lên</option>
            <option value="2">Nguy hiểm trở lên</option>
            <option value="3">Chỉ nghiêm trọng</option>
          </select>
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
            />
            Gửi email cảnh báo
          </label>
        </div>

        <button
          onClick={handleCheckAlerts}
          disabled={loading || !userId}
          className="btn-check-alerts"
        >
          {loading ? '⏳ Đang kiểm tra...' : '🔍 Kiểm tra Cảnh Báo'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert-error">
          <strong>❌ Lỗi:</strong> {error}
        </div>
      )}

      {/* Stats Section */}
      {stats && (
        <div className="stats-section">
          <h3>📊 Thống kê địa điểm</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Tổng số</div>
            </div>
            <div className="stat-card active">
              <div className="stat-value">{stats.active}</div>
              <div className="stat-label">Đang theo dõi</div>
            </div>
            <div className="stat-card danger">
              <div className="stat-value">{stats.inDanger}</div>
              <div className="stat-label">Có nguy cơ</div>
            </div>
          </div>
        </div>
      )}

      {/* Locations List */}
      {locations.length > 0 && (
        <div className="locations-section">
          <h3>📍 Địa điểm của bạn ({locations.length})</h3>
          <div className="locations-list">
            {locations.map((location) => (
              <div
                key={location.id}
                className={`location-card ${!location.is_active ? 'inactive' : ''}`}
              >
                <div className="location-header">
                  <h4>{location.name}</h4>
                  {location.last_alert_status && (
                    <span
                      className="status-badge"
                      style={{
                        backgroundColor: getStatusColor(location.last_alert_status),
                      }}
                    >
                      {location.last_alert_status}
                    </span>
                  )}
                </div>
                <p className="location-address">{location.address}</p>
                <div className="location-details">
                  {location.latitude && location.longitude && (
                    <span>🌍 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</span>
                  )}
                  <span>📡 Bán kính: {location.alert_radius || 0} km</span>
                  {location.last_checked && (
                    <span>
                      🕒 Kiểm tra: {new Date(location.last_checked).toLocaleString('vi-VN')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts Results */}
      {alerts && alerts.length > 0 && (
        <div className="alerts-section">
          <h3>⚠️ Cảnh báo ({alerts.length})</h3>
          <div className="alerts-list">
            {alerts.map((alert, index) => (
              <div key={index} className="alert-card">
                <div className="alert-card-header">
                  <h4>{alert.locationName}</h4>
                  <span
                    className="risk-badge"
                    style={{
                      backgroundColor: getRiskLevelColor(alert.floodRisk),
                    }}
                  >
                    {getRiskLevelText(alert.floodRisk)}
                  </span>
                </div>

                {alert.distance !== undefined && (
                  <p className="alert-distance">
                    📍 Khoảng cách đến khu vực ngập: {alert.distance.toFixed(2)} km
                  </p>
                )}

                {alert.alert && (
                  <>
                    <div className="alert-subject">
                      <strong>📧 {alert.alert.subject}</strong>
                    </div>
                    <div
                      className="alert-content"
                      dangerouslySetInnerHTML={{ __html: alert.alert.htmlBody }}
                    />
                  </>
                )}

                <div className="alert-footer">
                  {alert.emailSent ? (
                    <span className="email-sent">✅ Email đã gửi</span>
                  ) : (
                    <span className="email-not-sent">📭 Email chưa gửi</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && locations.length === 0 && (
        <div className="empty-state">
          <p>Không tìm thấy địa điểm nào cho user này.</p>
          <p>Vui lòng kiểm tra User ID hoặc thêm địa điểm trong Firebase.</p>
        </div>
      )}
    </div>
  );
};

export default PersonalizedAlertDemo;

