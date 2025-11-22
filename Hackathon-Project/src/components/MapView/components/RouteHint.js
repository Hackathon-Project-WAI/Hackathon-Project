/**
 * RouteHint Component
 * Component hiển thị hướng dẫn routing
 */

import React, { memo } from 'react';
import './RouteHint.css';

const RouteHint = memo(({ userLocation, routeStart, routeEnd, locationPermission }) => {
  // Nếu có user location và đã chọn destination, không hiện hint
  if (userLocation && routeEnd) return null;

  // Nếu chưa có user location và permission không phải prompt, hiện hint chọn start
  if (!userLocation && !routeStart && locationPermission !== 'prompt') {
    return (
      <div className="routing-hint">
        <span className="hint-icon">📍</span>
        <span>Click vào bản đồ để chọn điểm xuất phát (A)</span>
      </div>
    );
  }

  // Nếu đã có start (hoặc user location) nhưng chưa có end
  if ((routeStart || userLocation) && !routeEnd) {
    return (
      <div className="routing-hint">
        <span className="hint-icon">📍</span>
        <span>
          {userLocation
            ? 'Click vào bản đồ để chọn điểm đến'
            : 'Click tiếp để chọn điểm đến (B)'}
        </span>
      </div>
    );
  }

  return null;
});

RouteHint.displayName = 'RouteHint';

export default RouteHint;






