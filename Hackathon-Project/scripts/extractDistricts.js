/**
 * Script để extract CHỈ CÁC QUẬN (admin_level=5 hoặc tên chứa "Quận"/"Huyện")
 * từ file daNangDistricts.json
 */

const fs = require("fs");
const path = require("path");

function main() {
  const inputFile = path.join(__dirname, "../src/data/daNangDistricts.json");
  const outputFile = path.join(
    __dirname,
    "../src/data/daNangDistricts.main.json"
  );

  console.log("📂 Reading GeoJSON file...");
  const geojson = JSON.parse(fs.readFileSync(inputFile, "utf8"));

  console.log(`📍 Total features: ${geojson.features.length}`);

  // Filter chỉ lấy QUẬN (name chứa "Quận" hoặc "Huyện", không phải "Phường")
  const districts = geojson.features.filter((feature) => {
    const name = feature.properties.name || "";
    const isDistrict =
      name.includes("Quận") ||
      name.includes("Huyện") ||
      feature.properties.admin_level === "5";

    const isWard = name.includes("Phường") || name.includes("Xã");

    return isDistrict && !isWard;
  });

  console.log(`\n✅ Found ${districts.length} districts:`);
  districts.forEach((d) => {
    const name = d.properties.name;
    const shortName =
      d.properties.shortName || name.replace(/^(Quận|Huyện)\s+/, "");
    const points = d.geometry.coordinates[0]?.length || 0;

    // Update shortName
    d.properties.shortName = shortName;

    console.log(`   - ${name} (${shortName}): ${points} points`);
  });

  const filtered = {
    type: "FeatureCollection",
    features: districts,
  };

  console.log("\n💾 Writing districts GeoJSON...");
  fs.writeFileSync(outputFile, JSON.stringify(filtered, null, 2));

  const outputSize = fs.statSync(outputFile).size;
  console.log(`✅ File size: ${(outputSize / 1024).toFixed(2)} KB`);
  console.log(`🎯 File saved to: ${outputFile}`);
  console.log(`📊 Districts: ${districts.length}`);
}

main();
