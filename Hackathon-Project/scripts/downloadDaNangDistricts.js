/**
 * Script để tải dữ liệu GeoJSON CHÍNH THỐNG cho các quận Đà Nẵng
 * Từ OpenStreetMap Overpass API
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// Overpass API query để lấy các quận/huyện của Đà Nẵng
const overpassQuery = `
[out:json][timeout:25];
area["name:en"="Da Nang"]["admin_level"="4"]->.a;
(
  relation["admin_level"="6"]["boundary"="administrative"](area.a);
);
out geom;
`;

const url = "https://overpass-api.de/api/interpreter";

function overpassToGeoJSON(data) {
  const features = [];

  data.elements.forEach((element) => {
    if (element.type === "relation" && element.members) {
      // Extract outer ways
      const outerMembers = element.members.filter((m) => m.role === "outer");

      if (outerMembers.length === 0) return;

      // Get coordinates from geometry
      const coordinates = [];
      outerMembers.forEach((member) => {
        if (member.geometry) {
          const coords = member.geometry.map((node) => [node.lon, node.lat]);
          coordinates.push(...coords);
        }
      });

      // Close the polygon
      if (coordinates.length > 0) {
        coordinates.push([...coordinates[0]]);
      }

      const name = element.tags["name"] || element.tags["name:vi"] || "Unknown";
      const shortName = name.replace(/^(Quận|Huyện)\s+/, "");

      features.push({
        type: "Feature",
        properties: {
          id: element.id,
          name: name,
          shortName: shortName,
          "name:vi": element.tags["name:vi"],
          "name:en": element.tags["name:en"],
          admin_level: element.tags["admin_level"],
        },
        geometry: {
          type: "Polygon",
          coordinates: [coordinates],
        },
      });
    }
  });

  return {
    type: "FeatureCollection",
    features: features,
  };
}

function downloadData() {
  console.log("🌍 Đang tải dữ liệu từ OpenStreetMap...\n");

  const postData = `data=${encodeURIComponent(overpassQuery)}`;

  const options = {
    hostname: "overpass-api.de",
    path: "/api/interpreter",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(postData),
    },
  };

  const req = https.request(options, (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      try {
        const osmData = JSON.parse(data);
        console.log(`✅ Đã tải ${osmData.elements.length} elements từ OSM\n`);

        const geojson = overpassToGeoJSON(osmData);
        console.log(`📊 Đã tạo ${geojson.features.length} features\n`);

        geojson.features.forEach((f) => {
          const points = f.geometry.coordinates[0].length;
          console.log(`   - ${f.properties.name}: ${points} points`);
        });

        const outputFile = path.join(
          __dirname,
          "../src/data/daNangDistricts.osm.json"
        );
        fs.writeFileSync(outputFile, JSON.stringify(geojson, null, 2));

        const size = fs.statSync(outputFile).size;
        console.log(`\n✅ File saved: ${(size / 1024).toFixed(2)} KB`);
        console.log(`📁 ${outputFile}`);
      } catch (error) {
        console.error("❌ Error parsing data:", error);
      }
    });
  });

  req.on("error", (error) => {
    console.error("❌ Error downloading data:", error);
  });

  req.write(postData);
  req.end();
}

downloadData();
