/**
 * Script để tải dữ liệu GeoJSON quận/huyện Đà Nẵng
 * từ OpenDevelopmentMekong (nguồn chính thống)
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// URL đến file GeoJSON chứa dữ liệu địa giới hành chính cấp huyện của Việt Nam
const geojsonUrl =
  "https://data.opendevelopmentmekong.net/dataset/6f054351-bf2c-422e-8deb-0a511d63a315/resource/78b3fb31-8c96-47d3-af64-d1a6e168e2ea/download/diaphanhuyen.geojson";

console.log("🌍 Đang tải dữ liệu GeoJSON từ OpenDevelopmentMekong...\n");

https
  .get(geojsonUrl, (response) => {
    let data = "";

    // Nhận dữ liệu từng chunk
    response.on("data", (chunk) => {
      data += chunk;
      process.stdout.write(".");
    });

    // Khi tải xong
    response.on("end", () => {
      console.log("\n\n✅ Tải dữ liệu thành công!\n");

      try {
        const geojson = JSON.parse(data);
        console.log(
          `📊 Tổng số features (toàn quốc): ${geojson.features.length}\n`
        );

        // In ra các thuộc tính của feature đầu tiên để kiểm tra cấu trúc
        if (geojson.features.length > 0) {
          console.log("🔍 Cấu trúc properties của feature đầu tiên:");
          console.log(JSON.stringify(geojson.features[0].properties, null, 2));
          console.log("\n");
        }

        // *** Lọc dữ liệu chỉ của Đà Nẵng ***
        // Thử nhiều cách để tìm Đà Nẵng
        const daNangFeatures = geojson.features.filter((feature) => {
          const props = feature.properties;

          // Kiểm tra trường Ten_Tinh (tên tỉnh)
          const tenTinh = props.Ten_Tinh || props.ten_tinh || "";

          // Kiểm tra các biến thể tên Đà Nẵng
          const daNangVariants = [
            "Đà Nẵng",
            "Da Nang",
            "ĐÀ NẴNG",
            "DA NANG",
            "Ða Nẵng",
            "ÐÀ NẴNG",
          ];

          return daNangVariants.some((variant) => tenTinh.includes(variant));
        });

        if (daNangFeatures.length > 0) {
          console.log(
            `✅ Tìm thấy ${daNangFeatures.length} features của Đà Nẵng (bao gồm cả Hoàng Sa)\n`
          );

          // Lọc bỏ Hoàng Sa và chỉ lấy 7 quận/huyện chính
          const mainDistricts = [
            "Hoa Vang",
            "Lien Chieu",
            "Cam Le",
            "Hai Chau",
            "Son Tra",
            "Thanh Khe",
            "Ngu Hanh Son",
          ];

          // Group các polygon trùng tên thành MultiPolygon
          const districtGroups = {};

          daNangFeatures.forEach((feature) => {
            const name = feature.properties.Ten_Huyen || "Unknown";

            // Bỏ qua Hoàng Sa
            if (name.includes("Hoang Sa")) return;

            if (!districtGroups[name]) {
              districtGroups[name] = [];
            }
            districtGroups[name].push(feature);
          });

          console.log(
            `📍 Đã nhóm thành ${
              Object.keys(districtGroups).length
            } quận/huyện chính:\n`
          );

          // Tạo GeoJSON mới
          const daNangGeoJSON = {
            type: "FeatureCollection",
            features: Object.entries(districtGroups).map(
              ([districtName, features]) => {
                console.log(
                  `   - ${districtName}: ${features.length} polygon(s)`
                );

                const shortName = districtName
                  .replace(/^(Quận|Huyện|Qu.n|Huy.n)\s+/i, "")
                  .trim();

                // Nếu chỉ có 1 polygon -> Polygon, nhiều hơn -> MultiPolygon
                let geometry;
                if (features.length === 1) {
                  geometry = features[0].geometry;
                } else {
                  // Merge thành MultiPolygon
                  geometry = {
                    type: "MultiPolygon",
                    coordinates: features.map((f) => f.geometry.coordinates),
                  };
                }

                return {
                  type: "Feature",
                  properties: {
                    name: districtName,
                    shortName: shortName,
                    fullName: districtName,
                    admin_level: "5",
                    Dan_So: features[0].properties.Dan_So,
                  },
                  geometry: geometry,
                };
              }
            ),
          };

          // Lưu file
          const outputFile = path.join(
            __dirname,
            "../src/data/daNangDistricts.odm.json"
          );
          fs.writeFileSync(outputFile, JSON.stringify(daNangGeoJSON, null, 2));

          const fileSize = fs.statSync(outputFile).size;
          console.log(`\n💾 Đã lưu file: ${(fileSize / 1024).toFixed(2)} KB`);
          console.log(`📁 ${outputFile}`);
          console.log(
            "\n🎉 Hoàn tất! Bạn có thể import file này vào useWeatherOverlay.js"
          );
        } else {
          console.warn(
            "⚠️ Không tìm thấy dữ liệu cho Đà Nẵng trong file đã tải."
          );
          console.log("\n🔍 Đang kiểm tra các tỉnh/thành có sẵn...");

          // In ra danh sách các tỉnh/thành để debug
          const provinces = new Set();
          geojson.features.forEach((f) => {
            const name =
              f.properties.NAME_1 || f.properties.name_1 || "Unknown";
            provinces.add(name);
          });

          console.log("Danh sách tỉnh/thành trong file:");
          Array.from(provinces)
            .sort()
            .forEach((p) => console.log(`  - ${p}`));
        }
      } catch (error) {
        console.error("❌ Lỗi khi parse JSON:", error.message);
      }
    });
  })
  .on("error", (error) => {
    console.error("❌ Lỗi khi tải file:", error.message);
  });
