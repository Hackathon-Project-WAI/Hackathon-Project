/**
 * Script để fetch ranh giới các quận Đà Nẵng từ OpenStreetMap
 * Sử dụng Overpass API để lấy dữ liệu chi tiết nhất
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

// Overpass API endpoint
const OVERPASS_API = "https://overpass-api.de/api/interpreter";

// Query để lấy phường/xã của 7 quận chính Đà Nẵng
const overpassQuery = `
[out:json][timeout:120];
// Các quận chính của Đà Nẵng
area["name:vi"~"Hải Châu|Thanh Khê|Sơn Trà|Ngũ Hành Sơn|Liên Chiểu|Cẩm Lệ|Hòa Vang"]->.districts;
// Lấy phường/xã trong các quận này
(
  relation(area.districts)["boundary"="administrative"]["admin_level"="8"];
);
out geom;
`;

/**
 * Fetch data from Overpass API
 */
function fetchOverpassData(query) {
  return new Promise((resolve, reject) => {
    const postData = `data=${encodeURIComponent(query)}`;

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    console.log("📡 Fetching data from Overpass API...");
    console.log("⏳ This may take 30-60 seconds...\n");

    const req = https.request(OVERPASS_API, options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
        process.stdout.write(".");
      });

      res.on("end", () => {
        console.log("\n✅ Data received!\n");
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(new Error(`Failed to parse JSON: ${err.message}`));
        }
      });
    });

    req.on("error", (err) => {
      reject(new Error(`Request failed: ${err.message}`));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Convert Overpass format to GeoJSON
 */
function convertToGeoJSON(overpassData) {
  console.log("🔄 Converting to GeoJSON format...\n");

  const features = [];

  overpassData.elements.forEach((element) => {
    if (element.type === "relation" && element.members) {
      console.log(
        `📍 Processing: ${element.tags["name:vi"] || element.tags.name}`
      );

      // Tìm outer ways
      const outerWays = element.members
        .filter((member) => member.role === "outer")
        .map((member) => member.geometry || []);

      // Tìm inner ways (holes)
      const innerWays = element.members
        .filter((member) => member.role === "inner")
        .map((member) => member.geometry || []);

      if (outerWays.length === 0) {
        console.log(`  ⚠️  No outer ways found, skipping...`);
        return;
      }

      // Nối các outer ways thành 1 ring liên tục
      const outerRing = [];
      outerWays.forEach((way) => {
        way.forEach((coord) => {
          outerRing.push([coord.lon, coord.lat]);
        });
      });

      // Đóng ring nếu chưa đóng
      if (outerRing.length > 0) {
        const first = outerRing[0];
        const last = outerRing[outerRing.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          outerRing.push([...first]);
        }
      }

      console.log(`  ✅ Outer ring: ${outerRing.length} points`);

      // Nối các inner ways
      const innerRings = [];
      innerWays.forEach((way) => {
        const innerRing = [];
        way.forEach((coord) => {
          innerRing.push([coord.lon, coord.lat]);
        });

        // Đóng inner ring
        if (innerRing.length > 0) {
          const first = innerRing[0];
          const last = innerRing[innerRing.length - 1];
          if (first[0] !== last[0] || first[1] !== last[1]) {
            innerRing.push([...first]);
          }
          innerRings.push(innerRing);
        }
      });

      if (innerRings.length > 0) {
        console.log(`  🕳️  Inner rings (holes): ${innerRings.length}`);
      }

      // Tạo coordinates array
      const coordinates = [outerRing, ...innerRings];

      // Tạo feature
      const feature = {
        type: "Feature",
        properties: {
          id: element.id,
          name: element.tags.name || element.tags["name:vi"],
          "name:vi": element.tags["name:vi"],
          "name:en": element.tags["name:en"],
          admin_level: element.tags.admin_level,
          shortName: extractShortName(
            element.tags["name:vi"] || element.tags.name
          ),
        },
        geometry: {
          type: "Polygon",
          coordinates: coordinates,
        },
      };

      features.push(feature);
    }
  });

  return {
    type: "FeatureCollection",
    features: features,
  };
}

/**
 * Extract short district name
 */
function extractShortName(fullName) {
  if (!fullName) return "";

  // "Quận Hải Châu" -> "Hải Châu"
  // "Huyện Hòa Vang" -> "Hòa Vang"
  return fullName.replace(/^(Quận|Huyện)\s+/, "");
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log("🚀 Starting to fetch Đà Nẵng district boundaries...\n");

    // Fetch data
    const overpassData = await fetchOverpassData(overpassQuery);

    console.log(
      `📊 Found ${overpassData.elements.length} districts/relations\n`
    );

    // Convert to GeoJSON
    const geojson = convertToGeoJSON(overpassData);

    console.log(
      `\n✅ Successfully converted ${geojson.features.length} features\n`
    );

    // Save to file - đặt tên mới để không ghi đè
    const outputPath = path.join(__dirname, "../src/data/daNangWards.json"); // Phường/xã
    const backupPath = path.join(
      __dirname,
      "../src/data/daNangWards.backup.json"
    );

    // Backup old file if exists
    if (fs.existsSync(outputPath)) {
      fs.copyFileSync(outputPath, backupPath);
      console.log("💾 Old file backed up to daNangWards.backup.json");
    }

    // Write new file
    fs.writeFileSync(outputPath, JSON.stringify(geojson, null, 2));

    const fileSize = (fs.statSync(outputPath).size / 1024).toFixed(2);
    console.log(`✅ New file saved: ${fileSize} KB`);
    console.log(`📁 Location: ${outputPath}\n`);

    // Summary
    console.log("📋 Summary:");
    geojson.features.forEach((feature) => {
      const coords = feature.geometry.coordinates;
      const outerPoints = coords[0].length;
      const holes = coords.length - 1;
      console.log(
        `  • ${feature.properties.shortName}: ${outerPoints} points${
          holes > 0 ? ` + ${holes} holes` : ""
        }`
      );
    });

    console.log("\n🎉 Done! You can now use the new GeoJSON file.");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

// Run
main();
