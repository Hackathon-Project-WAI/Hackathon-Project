/**
 * RouteInfo Component
 * Component hiển thị thông tin route hiện tại
 */

import React, { memo } from "react";
import "./RouteInfo.css";

const RouteInfo = memo(({ routeInfo, onClear }) => {
  if (!routeInfo) return null;

  const { distance, duration, safeRoute, routeNumber, totalRoutes } = routeInfo;

  return (
    <div className="route-info-panel">
      <div className={`route-info-header ${safeRoute ? "safe" : "warning"}`}>
        <h3>
          {safeRoute ? "✅ Đường đi an toàn" : "⚠️ Cảnh báo ngập"}
          {totalRoutes > 1 && (
            <span className="route-number-badge">
              Route {routeNumber}/{totalRoutes}
            </span>
          )}
        </h3>
        <button onClick={onClear} className="clear-route-btn" title="Xóa route">
          🗑️ Xóa
        </button>
      </div>

      <div className="route-stats">
        <div className="stat-item">
          <span className="stat-icon">📏</span>
          <span className="stat-label">Khoảng cách:</span>
          <span className="stat-value">{distance}</span>
        </div>

        <div className="stat-item">
          <span className="stat-icon">⏱️</span>
          <span className="stat-label">Thời gian:</span>
          <span className="stat-value">{duration}</span>
        </div>

        <div className="stat-item">
          <span className="stat-icon">{safeRoute ? "✅" : "⚠️"}</span>
          <span className="stat-label">Trạng thái:</span>
          <span className={`stat-value ${safeRoute ? "safe" : "danger"}`}>
            {safeRoute ? "An toàn" : "Có ngập"}
          </span>
        </div>
      </div>
    </div>
  );
});

RouteInfo.displayName = "RouteInfo";

export default RouteInfo;
