import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import WeatherDisplay from "../components/WeatherDisplay";
import "./WeatherDetailPage.css";

const WeatherDetailPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("weather");

  return (
    <div className="weather-detail-page">
      {/* Header with back button */}
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate("/")}>
          ← Quay lại bản đồ
        </button>
        <h1 className="detail-title">
          {activeTab === "weather"
            ? "☀️ Thời tin thời tiết"
            : "⚙️ Các tính năng đang phát triển"}
        </h1>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === "weather" ? "active" : ""}`}
          onClick={() => setActiveTab("weather")}
        >
          ☀️ Thời Tiết
        </button>
        <button
          className={`tab-btn ${activeTab === "flood" ? "active" : ""}`}
          onClick={() => setActiveTab("flood")}
        >
          ⚙️ Các tính năng đang phát triển
        </button>
      </div>

      {/* Content */}
      <div className="detail-content">
        {activeTab === "weather" ? (
          <WeatherDisplay />
        ) : (
          /* 🚧 TÍNH NĂNG ĐANG PHÁT TRIỂN - Personalized Flood Prediction */
          <div className="feature-development-notice">
            <div className="development-card">
              <div className="dev-icon">🚧</div>
              <div className="dev-content">
                <h3>⚙️ Các tính năng đang phát triển</h3>
                <p className="dev-description">
                  Dự báo ngập lụt thông minh với cá nhân hóa cho từng người dùng
                </p>
                <div className="dev-features">
                  <div className="dev-feature-item">
                    <span className="feature-icon">📍</span>
                    <span>Cảnh báo khu vực của bạn</span>
                  </div>
                  <div className="dev-feature-item">
                    <span className="feature-icon">⚡</span>
                    <span>Thông báo thời gian thực</span>
                  </div>
                  <div className="dev-feature-item">
                    <span className="feature-icon">🗺️</span>
                    <span>Bản đồ ngập chi tiết</span>
                  </div>
                  <div className="dev-feature-item">
                    <span className="feature-icon">🔔</span>
                    <span>Cảnh báo sớm cá nhân</span>
                  </div>
                </div>
                <div className="dev-status">
                  <span className="status-badge">Sắp ra mắt</span>
                  <span className="status-text">
                    Yêu cầu đăng nhập để sử dụng
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherDetailPage;
