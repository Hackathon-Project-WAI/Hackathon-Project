/**
 * Script để lọc chỉ lấy 7 quận chính của Đà Nẵng
 */

const fs = require("fs");
const path = require("path");

// Danh sách 7 quận chính
const MAIN_DISTRICTS = [
  "Liên Chiểu",
  "Thanh Khê",
  "Hải Châu",
  "Sơn Trà",
  "Ngũ Hành Sơn",
  "Cẩm Lệ",
  "Hòa Vang",
];

function main() {
  const inputPath = path.join(__dirname, "../src/data/daNangDistricts.json");
  const outputPath = path.join(
    __dirname,
    "../src/data/daNangDistricts.filtered.json"
  );

  console.log("📂 Reading full GeoJSON...");
  const fullData = JSON.parse(fs.readFileSync(inputPath, "utf8"));

  console.log(`📊 Total features: ${fullData.features.length}\n`);

  // Lọc chỉ lấy 7 quận chính
  const filtered = fullData.features.filter((feature) => {
    const name = feature.properties.shortName || feature.properties.name;
    return MAIN_DISTRICTS.includes(name);
  });

  console.log("🔍 Filtered districts:");
  filtered.forEach((feature) => {
    const coords = feature.geometry.coordinates;
    console.log(
      `  ✅ ${feature.properties.shortName}: ${coords[0].length} points`
    );
  });

  const result = {
    type: "FeatureCollection",
    features: filtered,
  };

  // Save
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

  const fileSize = (fs.statSync(outputPath).size / 1024).toFixed(2);
  console.log(`\n💾 Saved to: daNangDistricts.filtered.json`);
  console.log(`📦 File size: ${fileSize} KB`);
  console.log(`✅ ${filtered.length}/7 districts found`);

  if (filtered.length === 7) {
    // Replace original file
    fs.copyFileSync(outputPath, inputPath);
    console.log("\n🎉 Original file updated with filtered data!");
  } else {
    console.log(`\n⚠️  Warning: Only found ${filtered.length}/7 districts`);
    console.log(
      "Missing:",
      MAIN_DISTRICTS.filter(
        (d) => !filtered.find((f) => f.properties.shortName === d)
      )
    );
  }
}

main();
