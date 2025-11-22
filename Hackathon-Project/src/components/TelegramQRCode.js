/**
 * TelegramQRCode Component
 * Hiển thị QR code để người dùng quét và truy cập Telegram Bot
 */

import React, { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  getTelegramQRInfo,
  getBotInfo,
  checkTelegramStatus,
} from "../api/telegramApi";
import "./TelegramQRCode.css";

const TelegramQRCode = ({ showModal = false, onClose }) => {
  const [qrData, setQrData] = useState("");
  const [botInfo, setBotInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState(false);
  const pollingIntervalRef = useRef(null);
  const userIdRef = useRef(null);

  useEffect(() => {
    if (showModal) {
      loadBotInfo();
      startPolling();
    } else {
      stopPolling();
      // Reset states khi đóng modal
      setIsLinked(false);
      setLinkSuccess(false);
    }

    return () => {
      stopPolling();
    };
  }, [showModal]);

  const loadBotInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      // Lấy userId từ Firebase Auth (imported from configs)
      const { auth } = await import("../configs/firebase");
      const currentUser = auth.currentUser;
      const userId = currentUser?.uid;

      console.log("🔐 Current user ID for QR:", userId);
      userIdRef.current = userId; // Lưu userId để polling

      // Lấy thông tin QR với userId để auto-link
      const qrResponse = await getTelegramQRInfo(userId);
      if (qrResponse.success) {
        setQrData(qrResponse.data.qrData);
        console.log("✅ QR data loaded:", qrResponse.data.qrData);
      }

      // Lấy thông tin chi tiết bot
      const infoResponse = await getBotInfo();
      if (infoResponse.success) {
        setBotInfo(infoResponse.data);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error loading bot info:", err);
      setError("Không thể tải thông tin bot. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  // Polling để kiểm tra trạng thái liên kết
  const startPolling = () => {
    console.log("🔄 Bắt đầu polling kiểm tra liên kết Telegram...");

    pollingIntervalRef.current = setInterval(async () => {
      if (!userIdRef.current) return;

      try {
        const response = await checkTelegramStatus(userIdRef.current);

        if (response.success && response.data.isLinked) {
          console.log("✅ Phát hiện liên kết thành công!", response.data);
          setIsLinked(true);
          setLinkSuccess(true);
          stopPolling();

          // Tự động đóng modal sau 2 giây để user thấy thông báo thành công
          setTimeout(() => {
            onClose();
          }, 2000);
        }
      } catch (error) {
        console.error("❌ Lỗi khi polling:", error);
      }
    }, 2000); // Kiểm tra mỗi 2 giây
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      console.log("⏹️ Dừng polling");
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Đã sao chép link!");
  };

  if (!showModal) {
    return null;
  }

  return (
    <div className="telegram-qr-overlay" onClick={onClose}>
      <div
        className="telegram-qr-container"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="telegram-qr-close" onClick={onClose}>
          ×
        </button>

        <div className="telegram-qr-header">
          <div className="telegram-qr-icon">📱</div>
          <h2>Quét mã để chat với Bot</h2>
          <p className="telegram-qr-subtitle">
            Nhận cảnh báo ngập lụt trực tiếp trên Telegram
          </p>
        </div>

        {loading ? (
          <div className="telegram-qr-loading">
            <div className="spinner"></div>
            <p>Đang tải...</p>
          </div>
        ) : error ? (
          <div className="telegram-qr-error">
            <p>❌ {error}</p>
            <button onClick={loadBotInfo} className="retry-button">
              Thử lại
            </button>
          </div>
        ) : (
          <div className="telegram-qr-content">
            {/* Success Message */}
            {linkSuccess && (
              <div className="link-success-banner">
                <div className="success-icon">✅</div>
                <h3>Liên kết thành công!</h3>
                <p>
                  Bạn đã liên kết Telegram thành công. Modal sẽ tự động đóng...
                </p>
              </div>
            )}

            {/* QR Code - Ẩn khi đã liên kết */}
            {!linkSuccess && (
              <>
                <div className="qr-code-wrapper">
                  <QRCodeSVG
                    value={qrData}
                    size={256}
                    level="H"
                    includeMargin={true}
                  />
                  <div className="qr-code-label">
                    <span className="telegram-icon">✈️</span>
                    <span>@{botInfo?.username}</span>
                  </div>
                </div>
              </>
            )}

            {/* Instructions - Ẩn khi đã liên kết */}
            {!linkSuccess && (
              <>
                <div className="telegram-instructions">
                  <h3>📖 Hướng dẫn sử dụng:</h3>
                  <ol>
                    <li>
                      <strong>Mở Telegram</strong> trên điện thoại
                    </li>
                    <li>
                      <strong>Chạm vào biểu tượng QR</strong> ở thanh tìm kiếm
                    </li>
                    <li>
                      <strong>Quét mã QR</strong> phía trên
                    </li>
                    <li>
                      <strong>Nhấn "Start"</strong> để bắt đầu nhận cảnh báo
                    </li>
                  </ol>

                  <div className="polling-status">
                    <span className="polling-indicator">🔄</span>
                    <span className="polling-text">
                      Đang chờ bạn quét mã...
                    </span>
                  </div>
                </div>

                {/* Direct Link */}
                <div className="telegram-direct-link">
                  <p className="link-label">Hoặc truy cập trực tiếp:</p>
                  <div className="link-container">
                    <a
                      href={qrData}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bot-link"
                    >
                      t.me/{botInfo?.username}
                    </a>
                    <button
                      onClick={() => copyToClipboard(qrData)}
                      className="copy-button"
                      title="Sao chép link"
                    >
                      📋
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Bot Info Toggle */}
            <div className="bot-info-section">
              <button
                className="show-detail-button"
                onClick={() => setShowDetail(!showDetail)}
              >
                {showDetail ? "▼" : "▶"} Thông tin chi tiết
              </button>

              {showDetail && botInfo && (
                <div className="bot-detail-info">
                  <div className="info-row">
                    <span className="info-label">Bot ID:</span>
                    <span className="info-value">{botInfo.id}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Username:</span>
                    <span className="info-value">@{botInfo.username}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Tên:</span>
                    <span className="info-value">{botInfo.firstName}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Người dùng đã đăng ký:</span>
                    <span className="info-value highlight">
                      {botInfo.registeredUsers} người
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Email:</span>
                    <span className="info-value">1fvhkhoa@gmail.com</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">User ID:</span>
                    <span className="info-value">
                      Dz1IjDVXNRcp3q1wNBNDnoHGZBj1
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">QR Link:</span>
                    <span className="info-value link-text">
                      {botInfo.deepLink}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Features */}
            <div className="telegram-features">
              <h3>✨ Tính năng:</h3>
              <ul>
                <li>🌊 Cảnh báo ngập lụt theo thời gian thực</li>
                <li>📍 Thông báo cho khu vực bạn quan tâm</li>
                <li>⚡ Cảnh báo khẩn cấp ưu tiên</li>
                <li>📊 Thông tin chi tiết về mực nước</li>
                <li>🆓 Hoàn toàn miễn phí</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TelegramQRCode;
