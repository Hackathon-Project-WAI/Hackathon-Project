/**
 * Flood Zone Calculations Utilities
 * Các hàm tính toán liên quan đến vùng ngập
 */

/**
 * Tính khoảng cách giữa 2 điểm (Haversine formula)
 * @param {number} lat1 - Latitude điểm 1
 * @param {number} lng1 - Longitude điểm 1
 * @param {number} lat2 - Latitude điểm 2
 * @param {number} lng2 - Longitude điểm 2
 * @returns {number} Khoảng cách tính bằng mét
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Kiểm tra xem một điểm có nằm trong flood zone không
 * @param {number} lat - Latitude điểm cần kiểm tra
 * @param {number} lng - Longitude điểm cần kiểm tra
 * @param {Array} floodZones - Danh sách các flood zones
 * @returns {boolean} True nếu điểm nằm trong flood zone
 */
export const isPointInFloodZone = (lat, lng, floodZones) => {
  if (!floodZones || floodZones.length === 0) return false;

  return floodZones.some((zone) => {
    const zoneLat = zone.coords?.lat || zone.lat;
    const zoneLng = zone.coords?.lng || zone.lng;
    const radius = zone.radius || 500;

    const distance = calculateDistance(lat, lng, zoneLat, zoneLng);
    return distance <= radius;
  });
};

/**
 * Tìm các flood zones mà một điểm nằm trong đó
 * @param {number} lat - Latitude điểm cần kiểm tra  
 * @param {number} lng - Longitude điểm cần kiểm tra
 * @param {Array} floodZones - Danh sách các flood zones
 * @returns {Array} Danh sách các zones chứa điểm này
 */
export const getFloodZonesAtPoint = (lat, lng, floodZones) => {
  if (!floodZones || floodZones.length === 0) return [];

  return floodZones.filter((zone) => {
    const zoneLat = zone.coords?.lat || zone.lat;
    const zoneLng = zone.coords?.lng || zone.lng;
    const radius = zone.radius || 500;

    const distance = calculateDistance(lat, lng, zoneLat, zoneLng);
    return distance <= radius;
  });
};

/**
 * Kiểm tra route có đi qua các flood zones không
 * @param {string} polyline - Flexible polyline của route
 * @param {Array} floodZones - Danh sách flood zones
 * @param {number} sampleInterval - Số điểm sample (default: 50)
 * @returns {Array} Danh sách các flood zones mà route đi qua
 */
export const checkRouteFloodIntersection = (polyline, floodZones, sampleInterval = 50) => {
  if (!window.H || !polyline || !floodZones || floodZones.length === 0) {
    return [];
  }

  try {
    const lineString = window.H.geo.LineString.fromFlexiblePolyline(polyline);
    const coords = lineString.getLatLngAltArray();
    const affectedZonesSet = new Set();

    // Sample points dọc theo route
    for (let i = 0; i < coords.length; i += 3 * sampleInterval) {
      const lat = coords[i];
      const lng = coords[i + 1];

      const zonesAtPoint = getFloodZonesAtPoint(lat, lng, floodZones);
      zonesAtPoint.forEach((zone) => {
        affectedZonesSet.add(JSON.stringify(zone));
      });
    }

    // Convert Set back to array of objects
    return Array.from(affectedZonesSet).map((zoneStr) => JSON.parse(zoneStr));
  } catch (error) {
    console.error('Error checking route flood intersection:', error);
    return [];
  }
};

/**
 * Tính tổng số điểm ngập trên route
 * @param {Array} routes - Danh sách routes
 * @param {Array} floodZones - Danh sách flood zones
 * @returns {Array} Routes với thông tin flood count
 */
export const analyzeRoutesFlood = (routes, floodZones) => {
  return routes.map((route, index) => {
    const section = route.sections[0];
    const affectedZones = checkRouteFloodIntersection(section.polyline, floodZones);
    const distance = section.summary.length / 1000; // km
    const duration = section.summary.duration / 60; // minutes

    return {
      route,
      section,
      affectedZones,
      distance,
      duration,
      floodCount: affectedZones.length,
      index,
    };
  });
};

/**
 * Chọn route tốt nhất dựa trên criteria
 * @param {Array} analyzedRoutes - Routes đã được phân tích
 * @param {string} priority - Tiêu chí ưu tiên ('floodCount', 'distance', 'duration')
 * @returns {Object} Route tốt nhất
 */
export const selectBestRoute = (analyzedRoutes, priority = 'floodCount') => {
  if (!analyzedRoutes || analyzedRoutes.length === 0) return null;

  let bestRoute = analyzedRoutes[0];
  let bestIndex = 0;

  analyzedRoutes.forEach((analysis, index) => {
    // Ưu tiên 1: ít flood zones nhất
    if (analysis.floodCount < bestRoute.floodCount) {
      bestRoute = analysis;
      bestIndex = index;
    } 
    // Nếu bằng số flood zones, so sánh theo priority
    else if (analysis.floodCount === bestRoute.floodCount) {
      if (priority === 'distance' && analysis.distance < bestRoute.distance) {
        bestRoute = analysis;
        bestIndex = index;
      } else if (priority === 'duration' && analysis.duration < bestRoute.duration) {
        bestRoute = analysis;
        bestIndex = index;
      }
    }
  });

  return { ...bestRoute, bestIndex };
};

/**
 * Format flood zones cho display
 * @param {Array} zones - Danh sách flood zones
 * @returns {Array} Zones đã format
 */
export const formatFloodZones = (zones) => {
  return zones.map((zone) => ({
    id: zone.id,
    name: zone.name,
    district: zone.district,
    riskLevel: zone.riskLevel,
    description: zone.description,
  }));
};






