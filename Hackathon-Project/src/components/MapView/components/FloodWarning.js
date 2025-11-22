/**
 * FloodWarning Component
 * Component cảnh báo vùng ngập
 */

import React, { memo } from 'react';
import './FloodWarning.css';

const FloodWarning = memo(({ warning }) => {
  if (!warning || !warning.zones || warning.zones.length === 0) return null;

  const { message, zones } = warning;

  return (
    <div className="route-warning">
      <div className="warning-header">
        <span className="warning-icon">⚠️</span>
        <h4>Cảnh báo ngập lụt!</h4>
      </div>

      <p className="warning-message">{message}</p>

      <div className="warning-zones">
        <strong>Khu vực ngập trên đường:</strong>
        <ul>
          {zones.map((zone, idx) => (
            <li key={idx}>
              🔴 {zone.name} ({zone.district})
            </li>
          ))}
        </ul>
      </div>

      <p className="warning-note">
        💡 Hệ thống đã cố gắng tìm đường tránh ngập. Nếu không tránh được, vui lòng cân nhắc
        tuyến đường khác.
      </p>
    </div>
  );
});

FloodWarning.displayName = 'FloodWarning';

export default FloodWarning;






