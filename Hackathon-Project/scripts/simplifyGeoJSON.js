/**
 * Script để simplify GeoJSON - giảm số điểm để polygon mượt mà hơn
 * Sử dụng Ramer-Douglas-Peucker algorithm
 */

const fs = require("fs");
const path = require("path");

/**
 * Ramer-Douglas-Peucker algorithm
 * Simplify polyline by removing points that don't contribute much to the shape
 */
function simplifyDouglasPeucker(points, tolerance) {
  if (points.length <= 2) return points;

  // Find the point with the maximum distance from line between start and end
  let maxDistance = 0;
  let maxIndex = 0;
  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(points[i], start, end);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  // If max distance is greater than tolerance, recursively simplify
  if (maxDistance > tolerance) {
    const left = simplifyDouglasPeucker(
      points.slice(0, maxIndex + 1),
      tolerance
    );
    const right = simplifyDouglasPeucker(points.slice(maxIndex), tolerance);

    // Combine results (remove duplicate middle point)
    return left.slice(0, -1).concat(right);
  } else {
    // All points between start and end can be removed
    return [start, end];
  }
}

/**
 * Calculate perpendicular distance from point to line
 */
function perpendicularDistance(point, lineStart, lineEnd) {
  const [x, y] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;

  const A = x - x1;
  const B = y - y1;
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

  const dx = x - xx;
  const dy = y - yy;

  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Simplify a single ring (array of coordinates)
 */
function simplifyRing(ring, tolerance) {
  if (!ring || ring.length === 0) return ring;

  const simplified = simplifyDouglasPeucker(ring, tolerance);

  // Ensure ring is closed (first point = last point)
  if (simplified.length > 0) {
    const first = simplified[0];
    const last = simplified[simplified.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      simplified.push([...first]);
    }
  }

  return simplified;
}

/**
 * Simplify GeoJSON geometry
 * Chỉ giữ outer ring, bỏ hoàn toàn inner rings (holes)
 */
function simplifyGeometry(geometry, tolerance) {
  if (geometry.type === "Polygon") {
    // Chỉ lấy outer ring (coordinates[0]), bỏ hết inner rings
    const outerRing = geometry.coordinates[0];
    const simplifiedOuterRing = simplifyRing(outerRing, tolerance);

    return {
      ...geometry,
      coordinates: [simplifiedOuterRing], // Chỉ 1 ring - không có holes
    };
  } else if (geometry.type === "MultiPolygon") {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((polygon) => {
        // Mỗi polygon chỉ lấy outer ring
        const outerRing = polygon[0];
        const simplifiedOuterRing = simplifyRing(outerRing, tolerance);
        return [simplifiedOuterRing];
      }),
    };
  }
  return geometry;
}

/**
 * Simplify entire GeoJSON FeatureCollection
 */
function simplifyGeoJSON(geojson, tolerance = 0.001) {
  console.log(`🔧 Simplifying GeoJSON with tolerance: ${tolerance}...`);

  const simplified = {
    ...geojson,
    features: geojson.features.map((feature) => {
      const originalPoints = JSON.stringify(feature.geometry).length;
      const simplifiedGeometry = simplifyGeometry(feature.geometry, tolerance);
      const simplifiedPoints = JSON.stringify(simplifiedGeometry).length;

      const reduction = (
        ((originalPoints - simplifiedPoints) / originalPoints) *
        100
      ).toFixed(1);

      console.log(
        `  ✅ ${feature.properties.shortName || feature.properties.name}: ` +
          `${originalPoints} → ${simplifiedPoints} bytes (${reduction}% reduction)`
      );

      return {
        ...feature,
        geometry: simplifiedGeometry,
      };
    }),
  };

  return simplified;
}

/**
 * Main execution
 */
function main() {
  const inputFile = path.join(__dirname, "../src/data/daNangDistricts.json");
  const outputFile = path.join(
    __dirname,
    "../src/data/daNangDistricts.simplified.json"
  );

  console.log("📂 Reading GeoJSON file...");
  const geojson = JSON.parse(fs.readFileSync(inputFile, "utf8"));

  console.log(
    `📊 Original file size: ${(fs.statSync(inputFile).size / 1024).toFixed(
      2
    )} KB`
  );
  console.log(`📍 Features: ${geojson.features.length}\n`);

  // Simplify with different tolerances
  // 0.00001 = very detailed, very smooth (giảm ~5-10%)
  // 0.00005 = detailed, smooth (giảm ~15-25%) - RECOMMENDED
  // 0.0001 = moderate (giảm ~30-40%)
  // 0.0002 = noticeable simplification (giảm ~60-80%)

  const tolerance = 0.00001; // VERY DETAILED - Keep almost all points for ultra-smooth curves
  const simplified = simplifyGeoJSON(geojson, tolerance);
  console.log("\n💾 Writing simplified GeoJSON...");
  fs.writeFileSync(outputFile, JSON.stringify(simplified, null, 2));

  const outputSize = fs.statSync(outputFile).size;
  console.log(`✅ Simplified file size: ${(outputSize / 1024).toFixed(2)} KB`);
  console.log(`🎯 File saved to: ${outputFile}`);

  const originalSize = fs.statSync(inputFile).size;
  const reduction = (
    ((originalSize - outputSize) / originalSize) *
    100
  ).toFixed(1);
  console.log(`📉 Total reduction: ${reduction}%`);

  console.log("\n🎨 To use the simplified file, update your import:");
  console.log(
    '   import daNangDistricts from "../data/daNangDistricts.simplified.json";'
  );
}

// Run the script
main();
