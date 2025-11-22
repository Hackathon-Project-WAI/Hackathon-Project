/**
 * WelcomeModal Component
 * Modal chào mừng cho user mới đăng nhập lần đầu
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Bell, Shield, ArrowRight } from "lucide-react";
import "./WelcomeModal.css";

const WelcomeModal = ({ isOpen, onClose, user }) => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/profile");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="welcome-overlay" onClick={onClose}>
      <div className="welcome-content" onClick={(e) => e.stopPropagation()}>
        <div className="welcome-header">
          <div className="welcome-icon">🎉</div>
          <h2>Chào mừng đến với hệ thống!</h2>
          <p className="welcome-subtitle">
            Xin chào <strong>{user?.displayName || user?.email}</strong>
          </p>
        </div>

        <div className="welcome-body">
          <p className="welcome-intro">
            Cảm ơn bạn đã tin tưởng và sử dụng hệ thống dự báo ngập lụt thông
            minh của chúng tôi. Để nhận được cảnh báo chính xác nhất, hãy cung
            cấp thêm một số thông tin:
          </p>

          <div className="welcome-features">
            <div className="welcome-feature">
              <div className="feature-icon">
                <MapPin size={24} />
              </div>
              <div className="feature-content">
                <h3>📍 Thêm địa điểm quan trọng</h3>
                <p>Nhà, công ty, trường học... để nhận cảnh báo kịp thời</p>
              </div>
            </div>

            <div className="welcome-feature">
              <div className="feature-icon">
                <Bell size={24} />
              </div>
              <div className="feature-content">
                <h3>🔔 Cài đặt thông báo</h3>
                <p>Chọn cách bạn muốn nhận cảnh báo: Email, Push, SMS</p>
              </div>
            </div>

            <div className="welcome-feature">
              <div className="feature-icon">
                <Shield size={24} />
              </div>
              <div className="feature-content">
                <h3>⚡ Cảnh báo thông minh</h3>
                <p>Nhận thông báo sớm 1-3 giờ trước khi ngập xảy ra</p>
              </div>
            </div>
          </div>

          <div className="welcome-benefits">
            <h4>🎯 Lợi ích khi hoàn thiện hồ sơ:</h4>
            <ul>
              <li>✅ Cảnh báo cá nhân hóa cho từng địa điểm quan trọng</li>
              <li>✅ Dự báo chính xác hơn dựa trên vị trí của bạn</li>
              <li>✅ Tránh ngập lụt hiệu quả, tiết kiệm thời gian</li>
              <li>✅ Thống kê và theo dõi lịch sử cảnh báo</li>
            </ul>
          </div>
        </div>

        <div className="welcome-actions">
          <button className="btn-skip" onClick={onClose}>
            Để sau
          </button>
          <button className="btn-get-started" onClick={handleGetStarted}>
            Bắt đầu ngay
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
