/**
 * Route Colors Constants
 * Màu sắc cho các routes alternatives
 */

export const ROUTE_COLORS = [
  { main: '#4CAF50', selected: '#2E7D32', name: 'green' },    // Xanh lá
  { main: '#2196F3', selected: '#1565C0', name: 'blue' },     // Xanh dương  
  { main: '#9C27B0', selected: '#6A1B9A', name: 'purple' },   // Tím
];

export const FLOOD_COLORS = {
  main: '#FF9800',      // Cam
  selected: '#E65100',  // Đỏ cam
  warning: '#F44336',   // Đỏ
};

/**
 * Risk Level Colors
 * Màu cho các mức độ rủi ro ngập
 */
export const RISK_COLORS = {
  high: {
    fill: 'rgba(244, 67, 54, 0.3)',
    stroke: 'rgba(244, 67, 54, 0.8)',
    label: '#D32F2F',
  },
  medium: {
    fill: 'rgba(255, 152, 0, 0.3)',
    stroke: 'rgba(255, 152, 0, 0.8)',
    label: '#F57C00',
  },
  low: {
    fill: 'rgba(76, 175, 80, 0.25)',
    stroke: 'rgba(76, 175, 80, 0.7)',
    label: '#388E3C',
  },
};

/**
 * Map Configuration
 */
export const MAP_CONFIG = {
  defaultCenter: { lat: 16.0544, lng: 108.2022 }, // Đà Nẵng
  defaultZoom: 12,
  userLocationZoom: 14,
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
  maxAlternatives: 3,
  maxAvoidAreas: 10,
  transportMode: 'car',
  routingMode: 'fast',
  returnValues: 'polyline,summary,actions,instructions',
};

/**
 * Geolocation Configuration
 */
export const GEOLOCATION_CONFIG = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

/**
 * Permission States
 */
export const PERMISSION_STATES = {
  PROMPT: 'prompt',
  GRANTED: 'granted',
  DENIED: 'denied',
};

/**
 * Route Selection Criteria
 */
export const ROUTE_SELECTION_PRIORITY = {
  FLOOD_COUNT: 'floodCount',    // Ưu tiên ít ngập
  DISTANCE: 'distance',         // Ưu tiên ngắn
  DURATION: 'duration',         // Ưu tiên nhanh
};






