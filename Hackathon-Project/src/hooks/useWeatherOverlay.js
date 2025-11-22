/**
 * useWeatherOverlay Hook
 * Hook để quản lý weather overlay sử dụng Canvas Tile Layer
 * Hiệu suất cao hơn so với vẽ polygon trực tiếp
 */

import { useEffect, useRef, useCallback, useState } from "react";
import daNangDistricts from "../data/daNangDistricts.odm.json";
import { getAllDistrictRainfall } from "../services/districtRainfallService";

// Map tên quận từ tiếng Anh (không dấu) sang tiếng Việt (có dấu)
const DISTRICT_NAME_MAP = {
  "Ngu Hanh Son": "Ngũ Hành Sơn",
  "Hai Chau": "Hải Châu",
  "Cam Le": "Cẩm Lệ",
  "Lien Chieu": "Liên Chiểu",
  "Hoa Vang": "Hòa Vang",
  "Son Tra": "Sơn Trà",
  "Thanh Khe": "Thanh Khê",
};

export const useWeatherOverlay = (map, mapReady, isVisible = false) => {
  const boundariesRef = useRef([]); // Array to hold district polygons
  const labelsRef = useRef([]);
  const [rainfallData, setRainfallData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Calculate center of polygon for label placement
   */
  const getPolygonCenter = useCallback((coordinates) => {
    let latSum = 0;
    let lngSum = 0;
    const count = coordinates.length;

    coordinates.forEach((coord) => {
      lngSum += coord[0];
      latSum += coord[1];
    });

    return {
      lat: latSum / count,
      lng: lngSum / count,
    };
  }, []);

  /**
   * Fetch rainfall data from API
   */
  useEffect(() => {
    const fetchRainfall = async () => {
      if (!isVisible || rainfallData || isLoading) return;

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🗺️ WEATHER OVERLAY: Bắt đầu fetch rainfall data cho map');
      setIsLoading(true);
      try {
        const data = await getAllDistrictRainfall();
        console.log('✅ WEATHER OVERLAY: Đã fetch xong rainfall data');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        setRainfallData(data);
      } catch (error) {
        console.error("❌ Lỗi fetch rainfall data:", error);
        setRainfallData({
          "Hòa Vang": 5.2,
          "Liên Chiểu": 2.1,
          "Cẩm Lệ": 0.5,
          "Hải Châu": 3.8,
          "Sơn Trà": 1.2,
          "Thanh Khê": 2.5,
          "Ngũ Hành Sơn": 0.0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRainfall();
  }, [isVisible, rainfallData, isLoading]);

  /**
   * Get rainfall data for a ward/district
   * Map ward name to parent district for rainfall
   */
  const getDistrictRainfall = useCallback(
    (wardName) => {
      if (!rainfallData) return 0;

      // Chuẩn hóa tên từ tiếng Anh sang tiếng Việt
      const normalizedName = DISTRICT_NAME_MAP[wardName] || wardName;

      // Nếu có data trực tiếp cho ward/district này
      if (rainfallData[normalizedName]) {
        return rainfallData[normalizedName];
      }

      // Map phường/xã về quận cha
      // Dựa vào tên phường để xác định quận
      const districtMap = {
        "Hòa Vang": ["Hòa Tiến", "Hòa Vang", "Hòa Xuân", "Hòa Khánh"],
        "Liên Chiểu": ["Liên Chiểu", "Hòa Hiệp"],
        "Cẩm Lệ": ["Cẩm Lệ", "Hòa An", "Hòa Phát", "Hòa Thọ"],
        "Hải Châu": ["Hải Châu", "Thanh Bình", "Thạch Thang", "Hòa Thuận"],
        "Sơn Trà": ["Sơn Trà", "An Hải", "Mân Thái", "Nại Hiên"],
        "Thanh Khê": ["Thanh Khê", "An Khê", "Tân Chính", "Chính Gián"],
        "Ngũ Hành Sơn": ["Ngũ Hành Sơn", "Mỹ An", "Hòa Hải", "Hòa Quý"],
      };

      // Tìm quận cha dựa vào tên phường
      for (const [district, wards] of Object.entries(districtMap)) {
        if (wards.some((w) => normalizedName.includes(w))) {
          return rainfallData[district] || 0;
        }
      }

      // Fallback: tìm theo keyword trong tên
      if (normalizedName.includes("Hòa")) return rainfallData["Hòa Vang"] || 0;
      if (normalizedName.includes("Liên")) return rainfallData["Liên Chiểu"] || 0;
      if (normalizedName.includes("Cẩm")) return rainfallData["Cẩm Lệ"] || 0;
      if (normalizedName.includes("Hải")) return rainfallData["Hải Châu"] || 0;
      if (normalizedName.includes("Sơn")) return rainfallData["Sơn Trà"] || 0;
      if (normalizedName.includes("Thanh")) return rainfallData["Thanh Khê"] || 0;
      if (normalizedName.includes("Ngũ")) return rainfallData["Ngũ Hành Sơn"] || 0;

      return 0;
    },
    [rainfallData]
  );

  /**
   * 📊 Get rainfall for a specific district
   */

  /**
   * Get color based on rainfall intensity
   */
  const getRainfallColor = useCallback((rainfall) => {
    if (rainfall === 0) {
      return "rgba(0, 0, 0, 0)"; // TRONG SUỐT - Không mưa, hiển thị màu gốc của map
    } else if (rainfall < 1) {
      return "rgba(129, 199, 132, 0.3)"; // Xanh nhạt - Mưa nhẹ
    } else if (rainfall < 2.5) {
      return "rgba(255, 193, 7, 0.35)"; // Vàng - Mưa vừa
    } else if (rainfall < 10) {
      return "rgba(255, 152, 0, 0.4)"; // Cam - Mưa to
    } else {
      return "rgba(244, 67, 54, 0.45)"; // Đỏ nhạt hơn - Mưa rất to
    }
  }, []);

  /**
   * Create district polygons with rainfall colors
   * Vẽ CẢ polygon tô màu VÀ đường viền (polyline)
   * Hỗ trợ cả Polygon và MultiPolygon
   */
  const createDistrictBoundaries = useCallback(() => {
    if (!window.H) return [];

    try {
      const objects = [];

      daNangDistricts.features.forEach((feature) => {
        const districtName =
          feature.properties.shortName || feature.properties.name;

        // Lấy lượng mưa
        const rainfall = getDistrictRainfall(districtName);
        const fillColor = getRainfallColor(rainfall);

        const geometry = feature.geometry;

        // Xử lý cả Polygon và MultiPolygon
        if (geometry.type === "Polygon") {
          // Single Polygon - chỉ lấy outer ring
          const outerRing = geometry.coordinates[0];

          const lineString = new window.H.geo.LineString();
          for (let i = 0; i < outerRing.length; i++) {
            lineString.pushLatLngAlt(outerRing[i][1], outerRing[i][0], 0);
          }

          const polygon = new window.H.map.Polygon(lineString, {
            style: {
              fillColor: fillColor,
              strokeColor: "rgba(255, 255, 255, 0.6)", // Tăng độ rõ từ 0.2 lên 0.6
              lineWidth: 2, // Tăng độ dày từ 0.8 lên 2
              lineCap: "round",
              lineJoin: "round",
            },
            zIndex: 50,
            visibility: true,
            volatility: true,
          });

          polygon.setData({
            districtName,
            rainfall: rainfall.toFixed(1),
            rainfallText:
              rainfall === 0 ? "Không mưa" : `${rainfall.toFixed(1)} mm/h`,
          });

          objects.push(polygon);
        } else if (geometry.type === "MultiPolygon") {
          // MultiPolygon - tạo một MultiPolygon object cho HERE Maps
          const multiLineStrings = [];

          geometry.coordinates.forEach((polygonCoords) => {
            // Mỗi polygon trong MultiPolygon - chỉ lấy outer ring
            const outerRing = polygonCoords[0];

            const lineString = new window.H.geo.LineString();
            for (let i = 0; i < outerRing.length; i++) {
              lineString.pushLatLngAlt(outerRing[i][1], outerRing[i][0], 0);
            }

            multiLineStrings.push(lineString);
          });

          // Vẽ từng polygon riêng lẻ với cùng style
          multiLineStrings.forEach((lineString) => {
            const polygon = new window.H.map.Polygon(lineString, {
              style: {
                fillColor: fillColor,
                strokeColor: "rgba(255, 255, 255, 0.6)", // Tăng độ rõ từ 0.2 lên 0.6
                lineWidth: 2, // Tăng độ dày từ 0.8 lên 2
                lineCap: "round",
                lineJoin: "round",
              },
              zIndex: 50,
              visibility: true,
              volatility: true,
            });

            polygon.setData({
              districtName,
              rainfall: rainfall.toFixed(1),
              rainfallText:
                rainfall === 0 ? "Không mưa" : `${rainfall.toFixed(1)} mm/h`,
            });

            objects.push(polygon);
          });
        }

        console.log(
          `   📍 ${districtName}: ${rainfall.toFixed(1)} mm/h - ${fillColor}`
        );
      });

      console.log(`\n🗺️ Đã tạo ${objects.length} polygon với màu sắc mưa`);
      return objects;
    } catch (error) {
      console.error("❌ Error creating polygons:", error);
      return [];
    }
  }, [getDistrictRainfall, getRainfallColor]);

  /**
   * Create district labels
   */
  const createDistrictLabels = useCallback(() => {
    if (!window.H) return [];

    try {
      const labels = [];

      daNangDistricts.features.forEach((feature) => {
        const districtName =
          feature.properties.shortName || feature.properties.name;

        const geometry = feature.geometry;
        let coordinates;

        // Lấy coordinates tùy theo type
        if (geometry.type === "Polygon") {
          coordinates = geometry.coordinates[0];
        } else if (geometry.type === "MultiPolygon") {
          // Với MultiPolygon, lấy polygon lớn nhất (có nhiều điểm nhất)
          let largestPolygon = geometry.coordinates[0][0];
          let maxPoints = largestPolygon.length;

          geometry.coordinates.forEach((polygon) => {
            const outerRing = polygon[0];
            if (outerRing.length > maxPoints) {
              largestPolygon = outerRing;
              maxPoints = outerRing.length;
            }
          });

          coordinates = largestPolygon;
        } else {
          return; // Skip nếu không phải Polygon hoặc MultiPolygon
        }

        // Tính center của polygon
        const center = getPolygonCenter(coordinates);

        // Lấy lượng mưa để hiển thị - DÙNG getDistrictRainfall() để map tên
        const rainfall = getDistrictRainfall(districtName);
        const rainfallText =
          rainfall === 0 ? "Không mưa" : `${rainfall.toFixed(1)} mm/h`;

        // Tạo DOM element cho label với 2 dòng: tên + lượng mưa
        const labelDiv = document.createElement("div");
        labelDiv.innerHTML = `
          <div style="font-weight: 700; margin-bottom: 2px;">${districtName}</div>
          <div style="font-size: 11px; opacity: 0.9;">${rainfallText}</div>
        `;
        labelDiv.style.cssText = `
          background: rgba(0, 0, 0, 0.75);
          color: white;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          pointer-events: none;
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          text-align: center;
        `;

        // Tạo DOM marker
        const domIcon = new window.H.map.DomIcon(labelDiv);
        const marker = new window.H.map.DomMarker(
          { lat: center.lat, lng: center.lng },
          { icon: domIcon }
        );

        labels.push(marker);
        console.log(`   📍 ${districtName} - ${rainfallText}`);
      });

      console.log(`✅ Đã tạo ${labels.length} label`);
      return labels;
    } catch (error) {
      console.error("❌ Error creating labels:", error);
      return [];
    }
  }, [getPolygonCenter, getDistrictRainfall]);

  /**
   * Add weather layer to map
   */
  const addWeatherLayer = useCallback(() => {
    if (!map || !mapReady || boundariesRef.current.length > 0) return;

    // Chờ rainfall data load xong
    if (!rainfallData) {
      console.log("⏳ Đang chờ rainfall data...");
      return;
    }

    console.log("🌧️ Đang thêm rainfall overlay cho từng quận...\n");

    // 1. Add district polygons (tô màu theo lượng mưa)
    const polygons = createDistrictBoundaries();
    if (polygons.length > 0) {
      polygons.forEach((polygon) => {
        map.addObject(polygon);
      });
      boundariesRef.current = polygons;
      console.log(`✅ Đã thêm ${polygons.length} quận với màu sắc mưa THẬT`);
    }

    // 2. Add district labels (tên quận)
    const labels = createDistrictLabels();
    if (labels.length > 0) {
      labels.forEach((label) => {
        map.addObject(label);
      });
      labelsRef.current = labels;
      console.log(`✅ Đã thêm ${labels.length} label\n`);
    }
  }, [
    map,
    mapReady,
    rainfallData,
    createDistrictBoundaries,
    createDistrictLabels,
  ]);

  /**
   * Remove weather layer from map
   */
  const removeWeatherLayer = useCallback(() => {
    if (!map) return;

    // Remove district polygons
    if (boundariesRef.current.length > 0) {
      boundariesRef.current.forEach((polygon) => {
        map.removeObject(polygon);
      });
      boundariesRef.current = [];
      console.log("✅ Đã xóa polygons");
    }

    // Remove labels
    if (labelsRef.current.length > 0) {
      labelsRef.current.forEach((label) => {
        map.removeObject(label);
      });
      labelsRef.current = [];
      console.log("✅ Đã xóa labels");
    }
  }, [map]);

  /**
   * Toggle weather layer visibility
   */
  useEffect(() => {
    if (!mapReady || !map) return;

    if (isVisible) {
      addWeatherLayer();
    } else {
      removeWeatherLayer();
    }

    // Cleanup khi unmount
    return () => {
      if (boundariesRef.current.length > 0) {
        removeWeatherLayer();
      }
    };
  }, [
    mapReady,
    map,
    isVisible,
    rainfallData,
    addWeatherLayer,
    removeWeatherLayer,
  ]);

  return {
    boundaries: boundariesRef.current,
    labels: labelsRef.current,
    rainfallData,
    isLoading,
    addWeatherLayer,
    removeWeatherLayer,
  };
};
