/**
 * TopNavigation Component - MODERN UI
 * Top-right navigation với tabs (Bản đồ/Thời tiết) và avatar dropdown
 * Giống code MapApp bạn gửi
 */

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Map as MapIcon,
  Cloud,
  User,
  Settings,
  LogOut,
  Activity,
  QrCode,
  Bell,
} from "lucide-react";
import TelegramQRCode from "./TelegramQRCode";
import "./TopNavigation.css";

const TopNavigation = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("map");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isTelegramLinked, setIsTelegramLinked] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState(null);
  const userMenuRef = useRef(null);

  // Close menu khi click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Kiểm tra trạng thái liên kết Telegram khi user đăng nhập
  useEffect(() => {
    if (user?.uid) {
      checkTelegramLinkStatus();
    }
  }, [user]);

  const checkTelegramLinkStatus = async () => {
    try {
      const { checkTelegramStatus } = await import("../api/telegramApi");
      const response = await checkTelegramStatus(user.uid);

      if (response.success && response.data.isLinked) {
        setIsTelegramLinked(true);
        setTelegramUsername(response.data.username);
        console.log("✅ Telegram đã liên kết:", response.data.username);
      } else {
        setIsTelegramLinked(false);
        setTelegramUsername(null);
      }
    } catch (error) {
      console.error("Error checking Telegram status:", error);
      setIsTelegramLinked(false);
    }
  };

  const handleUnlinkTelegram = async () => {
    if (!window.confirm("Bạn có chắc muốn hủy liên kết Telegram?")) {
      return;
    }

    try {
      const { unlinkTelegram } = await import("../api/telegramApi");
      const response = await unlinkTelegram(user.uid);

      if (response.success) {
        setIsTelegramLinked(false);
        setTelegramUsername(null);
        alert("Đã hủy liên kết Telegram thành công!");
      }
    } catch (error) {
      console.error("Error unlinking Telegram:", error);
      alert("Lỗi khi hủy liên kết. Vui lòng thử lại.");
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === "map") {
      navigate("/");
    } else if (tab === "weather") {
      navigate("/weather-detail");
    } else if (tab === "auto-alert") {
      navigate("/auto-alert");
    } else if (tab === "sensors") {
      navigate("/sensors");
    }
  };

  const handleMenuClick = (action) => {
    setShowUserMenu(false);
    switch (action) {
      case "map":
        navigate("/");
        break;
      case "weather":
        navigate("/weather-detail");
        break;
      case "sensors":
        navigate("/sensors");
        break;
      case "qrcode":
        setShowQRModal(true);
        break;
      case "profile":
        navigate("/profile");
        break;
      case "settings":
        navigate("/profile");
        break;
      case "logout":
        onLogout();
        break;
      default:
        break;
    }
  };

  // Avatar URL
  const avatarUrl =
    user?.photoURL ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || "User"}`;

  return (
    <div className="top-navigation-container" ref={userMenuRef}>
      {/* Main Nav Buttons */}
      <div className="glass-panel nav-tabs">
        <button
          onClick={() => handleTabClick("map")}
          className={`nav-tab ${activeTab === "map" ? "active" : ""}`}
        >
          <MapIcon size={16} /> Bản đồ
        </button>
        <button
          onClick={() => handleTabClick("weather")}
          className={`nav-tab ${activeTab === "weather" ? "active" : ""}`}
        >
          <Cloud size={16} /> Thời tiết
        </button>
        <button
          onClick={() => handleTabClick("auto-alert")}
          className={`nav-tab ${activeTab === "auto-alert" ? "active" : ""}`}
        >
          <Bell size={16} /> Cảnh báo
        </button>
      </div>

      {/* Avatar & Dropdown Container */}
      {user && (
        <div className="avatar-container">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`avatar-button ${showUserMenu ? "active" : ""}`}
          >
            <img src={avatarUrl} alt="User" />
          </button>

          {/* User Dropdown Menu */}
          {showUserMenu && (
            <div className="user-menu-dropdown">
              {/* Header */}
              <div className="user-menu-header">
                <div className="user-menu-avatar">
                  <User size={24} />
                </div>
                <div className="user-menu-info">
                  <h4 className="user-menu-name">
                    {user.displayName || "User"}
                  </h4>
                  <p className="user-menu-email">{user.email}</p>
                </div>
              </div>

              {/* Menu Items */}
              <div className="user-menu-items">
                <button
                  onClick={() => handleMenuClick("map")}
                  className="user-menu-item"
                >
                  <MapIcon size={18} className="menu-icon indigo" />
                  <span>Bản đồ</span>
                </button>
                <button
                  onClick={() => handleMenuClick("weather")}
                  className="user-menu-item"
                >
                  <Cloud size={18} className="menu-icon sky" />
                  <span>Thời tiết chi tiết</span>
                </button>
                <button
                  onClick={() => handleMenuClick("sensors")}
                  className="user-menu-item"
                >
                  <Activity size={18} className="menu-icon green" />
                  <span>Sensors</span>
                </button>

                {/* Hiển thị QR Code nếu chưa liên kết, hoặc trạng thái nếu đã liên kết */}
                {!isTelegramLinked ? (
                  <button
                    onClick={() => handleMenuClick("qrcode")}
                    className="user-menu-item"
                  >
                    <QrCode size={18} className="menu-icon telegram" />
                    <span>Liên kết Telegram Bot</span>
                  </button>
                ) : (
                  <div className="user-menu-item telegram-linked">
                    <QrCode size={18} className="menu-icon telegram" />
                    <div className="telegram-status">
                      <span className="telegram-linked-text">
                        Telegram đã liên kết ✅
                      </span>
                      {telegramUsername && (
                        <span className="telegram-username">
                          @{telegramUsername}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnlinkTelegram();
                      }}
                      className="unlink-button"
                      title="Hủy liên kết"
                    >
                      ×
                    </button>
                  </div>
                )}

                <div className="menu-separator"></div>

                <button
                  onClick={() => handleMenuClick("profile")}
                  className="user-menu-item"
                >
                  <User size={18} className="menu-icon slate" />
                  <span>Trang cá nhân</span>
                </button>

                <div className="menu-separator"></div>

                <button
                  onClick={() => handleMenuClick("logout")}
                  className="user-menu-item logout"
                >
                  <LogOut size={18} className="menu-icon" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Login button nếu chưa đăng nhập */}
      {!user && (
        <button
          onClick={() => navigate("/login")}
          className="glass-panel login-button"
        >
          Đăng nhập
        </button>
      )}

      {/* QR Code Modal */}
      <TelegramQRCode
        showModal={showQRModal}
        onClose={() => {
          setShowQRModal(false);
          // Refresh trạng thái ngay lập tức khi đóng modal
          console.log("🔄 Modal đóng, đang refresh trạng thái Telegram...");
          checkTelegramLinkStatus();
        }}
      />
    </div>
  );
};

export default TopNavigation;
