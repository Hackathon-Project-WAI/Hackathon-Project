/**
 * Route Colors Constants
 * Màu sắc cho các routes alternatives
 */

export const ROUTE_COLORS = [
  { main: "#4CAF50", selected: "#2E7D32", name: "green" }, // Xanh lá
  { main: "#2196F3", selected: "#1565C0", name: "blue" }, // Xanh dương
  { main: "#9C27B0", selected: "#6A1B9A", name: "purple" }, // Tím
];

export const FLOOD_COLORS = {
  main: "#FF9800", // Cam
  selected: "#E65100", // Đỏ cam
  warning: "#F44336", // Đỏ
};

/**
 * Risk Level Colors
 * Màu cho các mức độ rủi ro ngập
 */
export const RISK_COLORS = {
  high: {
    fill: "rgba(244, 67, 54, 0.3)",
    stroke: "rgba(244, 67, 54, 0.8)",
    label: "#D32F2F",
  },
  medium: {
    fill: "rgba(255, 152, 0, 0.3)",
    stroke: "rgba(255, 152, 0, 0.8)",
    label: "#F57C00",
  },
  low: {
    fill: "rgba(76, 175, 80, 0.25)",
    stroke: "rgba(76, 175, 80, 0.7)",
    label: "#388E3C",
  },
};

/**
 * Map Configuration
 */
export const MAP_CONFIG = {
  defaultCenter: { lat: 16.0544, lng: 108.2022 }, // Đà Nẵng
  defaultZoom: 12,
  userLocationZoom: 17, // Zoom rất gần để thấy chi tiết vị trí (tăng từ 18 lên 19)
  animationDuration: 1500, // Thời gian animation zoom (ms) - tăng từ mặc định lên 1.5s
  routeLineWidth: {
    selected: 8,
    unselected: 5,
  },
  markerSize: {
    default: 32,
    user: 40,
  },
};

/**
 * Routing Configuration
 */
export const ROUTING_CONFIG = {
  maxAlternatives: 5, // Giới hạn 5 tuyến đường thay thế
  maxAvoidAreas: 10,
  transportMode: "car", // Default mode
  routingMode: "fast",
  returnValues: "polyline,summary,actions,instructions",
  avoidFloodZones: true, // Chủ động tránh vùng ngập
  floodBufferPercent: 0, // Buffer động theo radius (tính trong convertFloodZonesToAvoidAreas)
  floodBufferMeters: 5, // Buffer thêm 5m ngoài bán kính vùng ngập
  avoidRiskLevels: ["high", "medium", "low"], // Tránh TẤT CẢ vùng ngập
};

/**
 * Transport Modes Configuration
 * HERE API v8 transport modes
 */
export const TRANSPORT_MODES = {
  car: {
    id: "car",
    apiValue: "car",
    icon: "🚗",
    label: "Ô tô",
    routingMode: "fast",
    avoidFloods: true, // Tránh ngập
    enabled: true,
  },
  pedestrian: {
    id: "pedestrian",
    apiValue: "pedestrian",
    icon: "🚶",
    label: "Đi bộ",
    routingMode: "short", // Đi bộ ưu tiên đường ngắn
    avoidFloods: true, // Vẫn nên tránh ngập
    enabled: true,
  },
  bicycle: {
    id: "bicycle",
    apiValue: "bicycle",
    icon: "🚴",
    label: "Xe đạp",
    routingMode: "fast",
    avoidFloods: true, // Xe đạp cũng nên tránh ngập
    enabled: true,
  },
  scooter: {
    id: "scooter",
    apiValue: "scooter", // HERE API hỗ trợ 'scooter' (xe tay ga/xe máy)
    icon: "🛵",
    label: "Xe máy",
    routingMode: "fast",
    avoidFloods: true, // Xe máy nên tránh ngập
    enabled: true, // Hỗ trợ đầy đủ
  },
};

/**
 * Geolocation Configuration
 */
export const GEOLOCATION_CONFIG = {
  enableHighAccuracy: true, // Bật GPS độ chính xác cao
  timeout: 30000, // Tăng timeout lên 30 giây để đợi GPS
  maximumAge: 0, // Không dùng cache - luôn lấy vị trí mới
};

/**
 * Permission States
 */
export const PERMISSION_STATES = {
  PROMPT: "prompt",
  GRANTED: "granted",
  DENIED: "denied",
};

/**
 * Route Selection Criteria
 */
export const ROUTE_SELECTION_PRIORITY = {
  FLOOD_COUNT: "floodCount", // Ưu tiên ít ngập
  DISTANCE: "distance", // Ưu tiên ngắn
  DURATION: "duration", // Ưu tiên nhanh
};
