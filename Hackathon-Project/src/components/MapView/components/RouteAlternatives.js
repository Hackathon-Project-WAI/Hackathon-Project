/**
 * RouteAlternatives Component
 * Component hiển thị danh sách các routes alternatives
 */

import React, { memo } from "react";
import { ROUTE_COLORS, FLOOD_COLORS } from "../../../utils/routeConstants";
import "./RouteAlternatives.css";

// Pure function - không cần useCallback
const getRouteColor = (index, hasFlood, isSelected) => {
  if (hasFlood) {
    return isSelected ? FLOOD_COLORS.selected : FLOOD_COLORS.main;
  }
  const colorScheme = ROUTE_COLORS[index % ROUTE_COLORS.length];
  return isSelected ? colorScheme.selected : colorScheme.main;
};

const RouteAlternatives = memo(({ routes, selectedIndex, onSelectRoute }) => {
  console.log("🗺️ RouteAlternatives render:", {
    routesCount: routes?.length,
    selectedIndex,
  });

  if (!routes || routes.length === 0) return null;

  return (
    <div className="route-alternatives">
      <div className="alternatives-header">
        <h4>
          🗺️{" "}
          {routes.length > 1
            ? `Chọn tuyến đường (${routes.length} lựa chọn)`
            : "Tuyến đường"}
        </h4>
        <span className="alternatives-hint">
          {routes.length > 1
            ? "Click vào route trên bản đồ hoặc chọn bên dưới:"
            : "Đây là tuyến đường duy nhất có thể đi"}
        </span>
      </div>

      <div className="alternatives-list">
        {routes.map((route, index) => {
          const isSelected = index === selectedIndex;
          const hasFlood = route.floodCount > 0;
          const color = getRouteColor(index, hasFlood, isSelected);

          return (
            <div
              key={index}
              className={`alternative-item ${isSelected ? "selected" : ""} ${
                hasFlood ? "has-flood" : "safe"
              }`}
              onClick={() => onSelectRoute(index)}
            >
              <div className="alternative-number">
                {isSelected ? "✓" : index + 1}
              </div>

              <div className="alternative-info">
                <div className="alternative-main">
                  <span className="alternative-distance">
                    {route.distance.toFixed(2)} km
                  </span>
                  <span className="alternative-duration">
                    {Math.round(route.duration)} phút
                  </span>
                </div>

                <div className="alternative-status">
                  {hasFlood ? (
                    <span className="flood-badge">
                      ⚠️ {route.floodCount} vùng ngập
                    </span>
                  ) : (
                    <span className="safe-badge">✅ An toàn</span>
                  )}
                </div>
              </div>

              <div className="alternative-legend">
                <div
                  className="route-color-indicator"
                  style={{ backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

RouteAlternatives.displayName = "RouteAlternatives";

export default RouteAlternatives;
