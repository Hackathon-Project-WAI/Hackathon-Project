/**
 * RouteControls Component
 * Component điều khiển routing mode
 */

import React, { memo } from "react";
import "./RouteControls.css";

const RouteControls = memo(({ routingMode, onToggle, locationPermission }) => {
  return (
    <div className="route-controls-wrapper">
      <button
        className={`routing-toggle-btn ${routingMode ? "active" : ""}`}
        onClick={onToggle}
        title="Bật/tắt chế độ dẫn đường tránh ngập"
      >
        {routingMode ? "🗺️ Tắt dẫn đường" : "🚗 Dẫn đường tránh ngập"}
      </button>

      {routingMode && locationPermission === "prompt" && (
        <div className="location-status location-prompt">
          <span className="status-icon">📍</span>
          <span>Đang yêu cầu quyền truy cập vị trí...</span>
        </div>
      )}

      {routingMode && locationPermission === "denied" && (
        <div className="location-status location-denied">
          <span className="status-icon">❌</span>
          <span>
            Không có quyền truy cập vị trí. Vui lòng chọn điểm xuất phát thủ
            công.
          </span>
        </div>
      )}

      {routingMode && locationPermission === "granted" && (
        <div className="location-status location-granted">
          <span className="status-icon">✅</span>
          <span>Đã lấy vị trí của bạn!</span>
        </div>
      )}
    </div>
  );
});

RouteControls.displayName = "RouteControls";

export default RouteControls;
