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
 * @param {number} sampleInterval - Số điểm sample (default: 5 - rất chi tiết)
 * @returns {Array} Danh sách các flood zones mà route đi qua
 */
export const checkRouteFloodIntersection = (
  polyline,
  floodZones,
  sampleInterval = 5
) => {
  if (!window.H || !polyline || !floodZones || floodZones.length === 0) {
    return [];
  }

  try {
    const lineString = window.H.geo.LineString.fromFlexiblePolyline(polyline);
    const coords = lineString.getLatLngAltArray();
    const affectedZonesSet = new Set();

    // Sample points DÀY ĐẶC dọc theo route để không bỏ sót vùng ngập nhỏ
    // sampleInterval = 5 → check ~mỗi 50-100m
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
    console.error("Error checking route flood intersection:", error);
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
  console.log(`🔍 analyzeRoutesFlood: Checking ${routes.length} routes against ${floodZones.length} flood zones`);
  console.log("🌊 Flood zones detail:", floodZones.map(z => ({
    id: z.id,
    name: z.name,
    coords: z.coords,
    radius: z.radius,
    riskLevel: z.riskLevel,
    type: z.type
  })));

  const analyzed = routes.map((route, index) => {
    const section = route.sections[0];
    const affectedZones = checkRouteFloodIntersection(
      section.polyline,
      floodZones
    );
    const distance = section.summary.length / 1000; // km
    const duration = section.summary.duration / 60; // minutes

    console.log(`📍 Route ${index + 1}: ${distance.toFixed(2)}km, ${Math.round(duration)}min → Intersects ${affectedZones.length} flood zones`);
    if (affectedZones.length > 0) {
      console.log(`   ⚠️ Affected zones:`, affectedZones.map(z => z.name || z.id));
    }

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

  // Chỉ giữ lại routes AN TOÀN (không đi qua vùng ngập)
  const safeRoutes = analyzed.filter((route) => route.floodCount === 0);
  
  console.log(`✅ Safe routes (no flood intersections): ${safeRoutes.length}/${analyzed.length}`);
  console.log(`⚠️ Unsafe routes (have flood intersections): ${analyzed.length - safeRoutes.length}/${analyzed.length}`);
  
  if (safeRoutes.length > 0) {
    console.log("🔵 Safe routes detail:");
    safeRoutes.forEach((r, i) => {
      console.log(`  ${i + 1}. Original route ${r.index + 1}: ${r.distance.toFixed(2)}km, ${Math.round(r.duration)}min`);
    });
  }
  
  if (safeRoutes.length < analyzed.length) {
    console.log("🔴 Unsafe routes detail:");
    analyzed.filter(r => r.floodCount > 0).forEach((r, i) => {
      console.log(`  ${i + 1}. Original route ${r.index + 1}: ${r.distance.toFixed(2)}km, ${Math.round(r.duration)}min → ${r.floodCount} zones`);
    });
  }

  // Loại bỏ routes trùng lặp (cùng duration và distance)
  const uniqueRoutes = [];
  const seen = new Set();

  for (const route of safeRoutes) {
    // Key dựa trên duration (phút) và distance (km) làm tròn 2 chữ số
    const key = `${Math.round(route.duration)}-${route.distance.toFixed(2)}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueRoutes.push(route);
    }
  }

  // Sắp xếp routes an toàn: Khoảng cách ngắn → Thời gian nhanh
  uniqueRoutes.sort((a, b) => {
    // 1. Ưu tiên khoảng cách ngắn hơn
    if (Math.abs(a.distance - b.distance) > 0.5) {
      // chênh > 500m
      return a.distance - b.distance;
    }
    // 2. Nếu cùng khoảng cách, ưu tiên thời gian nhanh hơn
    return a.duration - b.duration;
  });

  // Cập nhật lại index sau khi sort
  const sortedWithNewIndex = uniqueRoutes
    .slice(0, 5)
    .map((route, newIndex) => ({
      ...route,
      index: newIndex,
    }));

  return sortedWithNewIndex;
};

/**
 * Chọn route tốt nhất dựa trên criteria
 * @param {Array} analyzedRoutes - Routes đã được phân tích
 * @param {string} priority - Tiêu chí ưu tiên ('floodCount', 'distance', 'duration')
 * @returns {Object} Route tốt nhất
 */
export const selectBestRoute = (analyzedRoutes, priority = "floodCount") => {
  if (!analyzedRoutes || analyzedRoutes.length === 0) return null;

  // Routes đã được sắp xếp trong analyzeRoutesFlood
  // Route đầu tiên là tốt nhất: An toàn nhất → Ngắn nhất → Nhanh nhất
  const bestRoute = analyzedRoutes[0];

  // ✅ bestIndex luôn là 0 sau khi sort
  return { ...bestRoute, bestIndex: 0 };
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

/**
 * Chuyển đổi flood zones thành avoid areas cho HERE API
 * Format: bbox:lat1,lng1;lat2,lng2
 * @param {Array} floodZones - Danh sách flood zones
 * @param {number} bufferPercent - Buffer thêm % để đảm bảo tránh xa (default: 20%)
 * @returns {string} String avoid areas cho HERE API
 */
export const convertFloodZonesToAvoidAreas = (
  floodZones,
  bufferMeters = 100
) => {
  if (!floodZones || floodZones.length === 0) return "";

  // HERE API limit: tối đa 10 avoid areas
  const maxAreas = 10;

  // Ưu tiên vùng ngập high risk trước
  const sortedZones = [...floodZones].sort((a, b) => {
    const riskOrder = { high: 3, medium: 2, low: 1 };
    return (riskOrder[b.riskLevel] || 0) - (riskOrder[a.riskLevel] || 0);
  });

  const zonesToAvoid = sortedZones.slice(0, maxAreas);

  const bboxes = zonesToAvoid.map((zone) => {
    const lat = zone.coords?.lat || zone.lat;
    const lng = zone.coords?.lng || zone.lng;
    const radius = zone.radius || 300; // meters - mặc định 300m nếu không có radius

    // Thêm buffer (mặc định +5m) để tuyến đường né vùng ngập
    const bufferedRadius = radius + bufferMeters; // bufferedRadius = radius + 5m
    // 1 degree latitude ≈ 111km
    // 1 degree longitude ≈ 111km * cos(latitude)
    const latDelta = bufferedRadius / 1000 / 111; // degrees
    const lngDelta =
      bufferedRadius / 1000 / (111 * Math.cos((lat * Math.PI) / 180)); // degrees

    const minLat = (lat - latDelta).toFixed(6);
    const minLng = (lng - lngDelta).toFixed(6);
    const maxLat = (lat + latDelta).toFixed(6);
    const maxLng = (lng + lngDelta).toFixed(6);

    // Format: bbox:west,south,east,north theo HERE API v8
    return `bbox:${minLng},${minLat},${maxLng},${maxLat}`;
  });

  return bboxes.join("|");
};

/**
 * Lọc flood zones theo mức độ rủi ro
 * @param {Array} floodZones - Danh sách flood zones
 * @param {Array} riskLevels - Các mức độ cần lọc ['high', 'medium', 'low']
 * @returns {Array} Flood zones đã lọc
 */
export const filterFloodZonesByRisk = (
  floodZones,
  riskLevels = ["high", "medium"]
) => {
  if (!floodZones || floodZones.length === 0) return [];
  return floodZones.filter((zone) => riskLevels.includes(zone.riskLevel));
};

/**
 * Tính khoảng cách từ điểm đến đoạn thẳng (point-to-line distance)
 * @param {number} px - Latitude điểm
 * @param {number} py - Longitude điểm
 * @param {number} x1 - Latitude điểm đầu đoạn thẳng
 * @param {number} y1 - Longitude điểm đầu đoạn thẳng
 * @param {number} x2 - Latitude điểm cuối đoạn thẳng
 * @param {number} y2 - Longitude điểm cuối đoạn thẳng
 * @returns {number} Khoảng cách tính bằng mét
 */
const pointToLineDistance = (px, py, x1, y1, x2, y2) => {
  // Tính khoảng cách từ điểm (px, py) đến đoạn thẳng (x1, y1) -> (x2, y2)
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  return calculateDistance(px, py, xx, yy);
};

/**
 * Lọc vùng ngập GẦN ĐƯỜNG THẲNG giữa start-end
 * Chỉ lấy vùng ngập trong "hành lang" maxDistance từ đường đi
 * @param {Array} floodZones - Danh sách flood zones
 * @param {Object} start - Điểm xuất phát {lat, lng}
 * @param {Object} end - Điểm đích {lat, lng}
 * @param {number} maxDistance - Khoảng cách tối đa từ đường thẳng start-end (meters)
 * @returns {Array} Flood zones gần route
 */
export const filterFloodZonesNearRoute = (
  floodZones,
  start,
  end,
  maxDistance = 2000
) => {
  if (!floodZones || floodZones.length === 0 || !start || !end) {
    return floodZones || [];
  }

  // Lọc vùng ngập nằm trong "hành lang" maxDistance từ đường thẳng start-end
  return floodZones.filter((zone) => {
    const zoneLat = zone.coords?.lat || zone.lat;
    const zoneLng = zone.coords?.lng || zone.lng;

    // Tính khoảng cách từ vùng ngập đến đường thẳng start-end
    const distanceToLine = pointToLineDistance(
      zoneLat,
      zoneLng,
      start.lat,
      start.lng,
      end.lat,
      end.lng
    );

    // Chỉ lấy vùng ngập nằm trong hành lang maxDistance
    return distanceToLine <= maxDistance;
  });
};

/**
 * Lọc thông minh: Kết hợp risk level + khoảng cách + giới hạn 10 vùng
 * @param {Array} floodZones - Danh sách flood zones
 * @param {Object} start - Điểm xuất phát
 * @param {Object} end - Điểm đích
 * @param {Array} riskLevels - Các mức độ risk cần tránh
 * @param {number} maxAreas - Số vùng tối đa (default: 10)
 * @returns {Array} Top vùng ngập cần tránh
 */
export const selectFloodZonesToAvoid = (
  floodZones,
  start,
  end,
  riskLevels = ["high", "medium", "low"],
  maxAreas = 10
) => {
  if (!floodZones || floodZones.length === 0) return [];

  // Bước 1: Lọc theo risk level
  let filtered = filterFloodZonesByRisk(floodZones, riskLevels);

  // Bước 2: Sắp xếp theo ưu tiên: high > medium > low, sau đó theo khoảng cách gần
  const sortedZones = [...filtered].sort((a, b) => {
    const riskOrder = { high: 3, medium: 2, low: 1 };
    const riskDiff =
      (riskOrder[b.riskLevel] || 0) - (riskOrder[a.riskLevel] || 0);

    // Nếu cùng risk level, so sánh theo khoảng cách
    if (riskDiff === 0) {
      const distA = pointToLineDistance(
        a.coords?.lat || a.lat,
        a.coords?.lng || a.lng,
        start.lat,
        start.lng,
        end.lat,
        end.lng
      );
      const distB = pointToLineDistance(
        b.coords?.lat || b.lat,
        b.coords?.lng || b.lng,
        start.lat,
        start.lng,
        end.lat,
        end.lng
      );
      return distA - distB; // Gần hơn = ưu tiên hơn
    }

    return riskDiff;
  });

  // Bước 3: Nếu >10 vùng, CHỈ lấy 10 vùng ưu tiên cao nhất
  // (Những vùng còn lại route có thể đi qua được)
  const selectedZones = sortedZones.slice(0, maxAreas);

  console.log(
    `🎯 Chọn ${selectedZones.length}/${filtered.length} vùng ngập ưu tiên cao nhất để tránh`
  );
  return selectedZones;
};
