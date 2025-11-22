/**
 * HERE Maps Helper Functions
 * Các hàm tiện ích cho HERE Maps
 */

import { RISK_COLORS } from "./routeConstants";

/**
 * Tạo marker cho user location
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {H.map.DomMarker} Marker object
 */
export const createUserLocationMarker = (lat, lng) => {
  if (!window.H || typeof lat !== "number" || typeof lng !== "number")
    return null;

  const markerHTML = `
    <div style="
      display: flex;
      align-items: center;
      gap: 8px;
      transform: translate(-50%, -100%);
    ">
      <div style="
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
        border: 4px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        animation: pulse 2s infinite;
      ">
        📍
      </div>
      <div style="
        background: rgba(33, 150, 243, 0.95);
        color: white;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      ">
        Vị trí của bạn
      </div>
    </div>
    <style>
      @keyframes pulse {
        0%, 100% { transform: scale(1); box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4); }
        50% { transform: scale(1.1); box-shadow: 0 6px 20px rgba(33, 150, 243, 0.6); }
      }
    </style>
  `;

  const icon = new window.H.map.DomIcon(markerHTML);
  const position = new window.H.geo.Point(lat, lng);
  const marker = new window.H.map.DomMarker(position, { icon });
  marker.setZIndex(9999); // Đảm bảo marker luôn ở trên cùng
  return marker;
};

/**
 * Tạo marker cho start/end point của route
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} type - 'start' hoặc 'end'
 * @returns {H.map.DomMarker} Marker object
 */
export const createRouteMarker = (lat, lng, type = "start") => {
  if (!window.H || typeof lat !== "number" || typeof lng !== "number")
    return null;

  const isStart = type === "start";
  const color = isStart ? "#4CAF50" : "#F44336";
  const label = isStart ? "A" : "B";

  const markerHTML = `
    <div style="
      width: 36px;
      height: 36px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 16px;
      color: white;
    ">
      ${label}
    </div>
  `;

  const icon = new window.H.map.DomIcon(markerHTML);
  const position = new window.H.geo.Point(lat, lng);
  return new window.H.map.DomMarker(position, { icon });
};

/**
 * Tạo marker cho địa điểm (places)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} name - Tên địa điểm
 * @returns {H.map.Marker} Marker object
 */
export const createPlaceMarker = (lat, lng, name) => {
  if (!window.H || typeof lat !== "number" || typeof lng !== "number")
    return null;

  const icon = new window.H.map.Icon(
    `data:image/svg+xml,${encodeURIComponent(`
      <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="10" fill="#FF5722" stroke="white" stroke-width="3"/>
        <circle cx="16" cy="16" r="4" fill="white"/>
      </svg>
    `)}`
  );

  const position = new window.H.geo.Point(lat, lng);
  const marker = new window.H.map.Marker(position, { icon });
  marker.setData({ name });

  return marker;
};

/**
 * Lấy màu theo risk level
 * @param {string} riskLevel - 'high', 'medium', 'low'
 * @returns {Object} Object chứa fill và stroke colors
 */
export const getRiskColors = (riskLevel) => {
  return RISK_COLORS[riskLevel] || RISK_COLORS.medium;
};

/**
 * Tạo circle cho flood zone
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radius - Bán kính (meters)
 * @param {string} riskLevel - Mức độ rủi ro
 * @returns {H.map.Circle} Circle object
 */
export const createFloodZoneCircle = (
  lat,
  lng,
  radius,
  riskLevel = "medium"
) => {
  if (!window.H || typeof lat !== "number" || typeof lng !== "number")
    return null;

  const colors = getRiskColors(riskLevel);
  const center = new window.H.geo.Point(lat, lng);

  return new window.H.map.Circle(center, radius, {
    style: {
      strokeColor: colors.stroke,
      lineWidth: 2,
      fillColor: colors.fill,
    },
    volatility: true,
  });
};

/**
 * Tạo info bubble cho map
 * @param {Object} map - HERE Map instance
 * @param {Object} position - {lat, lng}
 * @param {string} content - HTML content
 * @returns {H.ui.InfoBubble} Info bubble object
 */
export const createInfoBubble = (map, position, content) => {
  if (!window.H || !map) return null;

  const ui = window.H.ui.UI.createDefault(map, map.createDefaultLayers());
  const bubble = new window.H.ui.InfoBubble(position, {
    content,
  });

  ui.addBubble(bubble);
  return bubble;
};

/**
 * Format HTML cho flood info bubble
 * @param {Object} zoneData - Flood zone data
 * @returns {string} HTML string
 */
export const formatFloodInfoBubble = (zoneData) => {
  const { name, district, riskLevel, description, rainThreshold } = zoneData;

  const riskLabels = {
    high: "🔴 Nguy hiểm cao",
    medium: "🟡 Nguy hiểm trung bình",
    low: "🟢 Nguy hiểm thấp",
  };

  return `
    <div class="flood-info-bubble">
      <div class="bubble-header">
        <h3>${name}</h3>
        <span class="bubble-close">×</span>
      </div>
      <div class="bubble-district">
        📍 <strong>${district}</strong>
      </div>
      <div class="bubble-risk">
        <strong>Mức độ:</strong> ${riskLabels[riskLevel] || riskLabels.medium}
      </div>
      ${
        description
          ? `
        <div class="bubble-description">
          ${description}
        </div>
      `
          : ""
      }
      ${
        rainThreshold
          ? `
        <div class="bubble-threshold">
          <p>⚠️ Ngưỡng mưa cảnh báo:</p>
          <ul>
            <li>🟡 Vàng: ${rainThreshold.yellow || 30}mm/3h</li>
            <li>🟠 Cam: ${rainThreshold.orange || 50}mm/3h</li>
            <li>🔴 Đỏ: ${rainThreshold.red || 80}mm/3h</li>
          </ul>
        </div>
      `
          : ""
      }
    </div>
  `;
};

/**
 * Zoom map to bounds
 * @param {Object} map - HERE Map instance
 * @param {H.geo.Rect} bounds - Bounding box
 * @param {Object} options - Zoom options
 */
export const zoomToBounds = (map, bounds, options = {}) => {
  if (!map || !bounds) return;

  map.getViewModel().setLookAtData({
    bounds,
    ...options,
  });
};

/**
 * Clear all objects from a group
 * @param {H.map.Group} group - Map group
 */
export const clearGroup = (group) => {
  if (!group) return;

  group.removeAll();
};
