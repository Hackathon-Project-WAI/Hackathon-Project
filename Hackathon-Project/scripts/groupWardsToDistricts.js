/**
 * Script để nhóm các PHƯỜNG thành QUẬN
 * Merge tất cả phường cùng quận thành 1 polygon lớn
 */

const fs = require("fs");
const path = require("path");

// Mapping phường -> quận (dựa vào tên phường)
const wardToDistrictMap = {
  "Hòa Vang": [
    "Hòa Bắc",
    "Hòa Liên",
    "Hòa Ninh",
    "Hòa Sơn",
    "Hòa Nhơn",
    "Hòa Phú",
    "Hòa Phong",
    "Hòa Châu",
    "Hòa Tiến",
    "Hòa Phước",
    "Hòa Khương",
  ],
  "Liên Chiểu": [
    "Hòa Hiệp Bắc",
    "Hòa Hiệp Nam",
    "Hòa Khánh Bắc",
    "Hòa Khánh Nam",
    "Hòa Minh",
  ],
  "Cẩm Lệ": [
    "Hòa Phát",
    "Hòa An",
    "Hòa Thọ Đông",
    "Hòa Thọ Tây",
    "Khuê Trung",
    "Hòa Xuân",
  ],
  "Hải Châu": [
    "Thanh Bình",
    "Thạch Thang",
    "Hải Châu I",
    "Hải Châu II",
    "Phước Ninh",
    "Hòa Thuận Tây",
    "Hòa Thuận Đông",
    "Nam Dương",
    "Bình Hiên",
    "Hòa Cường Bắc",
    "Hòa Cường Nam",
    "Bình Thuận",
    "Thạch Thang",
  ],
  "Thanh Khê": [
    "Tam Thuận",
    "Thanh Khê Tây",
    "Thanh Khê Đông",
    "Xuân Hà",
    "Tân Chính",
    "Chính Gián",
    "Vĩnh Trung",
    "Thạc Gián",
    "An Khê",
    "Hòa Khê",
  ],
  "Sơn Trà": [
    "Thọ Quang",
    "Nại Hiên Đông",
    "Mân Thái",
    "An Hải Bắc",
    "Phước Mỹ",
    "An Hải Tây",
    "An Hải Đông",
  ],
  "Ngũ Hành Sơn": ["Mỹ An", "Khuê Mỹ", "Hòa Quý", "Hòa Hải"],
};

/**
 * Determine district name from ward name
 */
function getDistrictFromWard(wardName) {
  for (const [district, wards] of Object.entries(wardToDistrictMap)) {
    if (wards.some((w) => wardName.includes(w))) {
      return district;
    }
  }

  // Fallback: extract from name
  if (wardName.includes("Hòa Vang")) return "Hòa Vang";
  if (wardName.includes("Liên Chiểu")) return "Liên Chiểu";
  if (wardName.includes("Cẩm Lệ")) return "Cẩm Lệ";
  if (wardName.includes("Hải Châu")) return "Hải Châu";
  if (wardName.includes("Thanh Khê")) return "Thanh Khê";
  if (wardName.includes("Sơn Trà")) return "Sơn Trà";
  if (wardName.includes("Ngũ Hành Sơn")) return "Ngũ Hành Sơn";

  return "Unknown";
}

/**
 * Merge multiple polygons into one
 * Lấy tất cả outer rings và tạo MultiPolygon
 */
function mergePolygons(features) {
  const allRings = [];

  features.forEach((feature) => {
    const coords = feature.geometry.coordinates;
    if (feature.geometry.type === "Polygon") {
      // Chỉ lấy outer ring (bỏ holes)
      allRings.push(coords[0]);
    } else if (feature.geometry.type === "MultiPolygon") {
      coords.forEach((polygon) => {
        allRings.push(polygon[0]);
      });
    }
  });

  // Nếu chỉ có 1 ring -> Polygon, nhiều rings -> MultiPolygon
  if (allRings.length === 1) {
    return {
      type: "Polygon",
      coordinates: [allRings[0]],
    };
  } else {
    return {
      type: "MultiPolygon",
      coordinates: allRings.map((ring) => [ring]),
    };
  }
}

function main() {
  const inputFile = path.join(__dirname, "../src/data/daNangDistricts.json");
  const outputFile = path.join(
    __dirname,
    "../src/data/daNangDistricts.grouped.json"
  );

  console.log("📂 Reading wards GeoJSON...");
  const geojson = JSON.parse(fs.readFileSync(inputFile, "utf8"));

  console.log(`📍 Total wards: ${geojson.features.length}\n`);

  // Group features by district
  const districtGroups = {};

  geojson.features.forEach((feature) => {
    const wardName =
      feature.properties.name || feature.properties.shortName || "";
    const district = getDistrictFromWard(wardName);

    if (!districtGroups[district]) {
      districtGroups[district] = [];
    }

    districtGroups[district].push(feature);
    console.log(`   ${wardName} → ${district}`);
  });

  console.log("\n🗺️ Merging wards into districts...\n");

  // Create district features
  const districtFeatures = [];

  Object.entries(districtGroups).forEach(([districtName, wards]) => {
    if (districtName === "Unknown") return;

    const mergedGeometry = mergePolygons(wards);
    const totalPoints = JSON.stringify(mergedGeometry).length;

    districtFeatures.push({
      type: "Feature",
      properties: {
        name: `${
          districtName.includes("Hòa Vang") ? "Huyện" : "Quận"
        } ${districtName}`,
        shortName: districtName,
        admin_level: "5",
        wardCount: wards.length,
      },
      geometry: mergedGeometry,
    });

    console.log(
      `✅ ${districtName}: ${wards.length} wards merged, ${totalPoints} bytes`
    );
  });

  const result = {
    type: "FeatureCollection",
    features: districtFeatures,
  };

  console.log("\n💾 Writing grouped districts...");
  fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));

  const outputSize = fs.statSync(outputFile).size;
  console.log(`✅ File size: ${(outputSize / 1024).toFixed(2)} KB`);
  console.log(`🎯 File saved to: ${outputFile}`);
  console.log(`📊 Districts: ${districtFeatures.length}`);
}

main();
