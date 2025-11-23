const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs").promises;

/**
 * Service kiểm tra cảnh báo dựa trên SENSOR DATA (thay vì weather forecast)
 */
class SensorBasedAlertService {
  constructor() {
    this.mockFloodZones = null; // Cache mock data
  }
  /**
   * Lấy tất cả sensor data từ Firebase
   * Đọc từ sensors (sensor data chính) và flood_zones (mock data)
   */
  async getAllSensors() {
    try {
      const db = admin.database();
      const allSensors = {};

      // 1. Đọc từ sensors (sensor data chính) - như trong ảnh Firebase
      try {
        const sensorsRef = db.ref("sensors");
        const sensorsSnapshot = await sensorsRef.once("value");
        if (sensorsSnapshot.exists()) {
          const sensorsData = sensorsSnapshot.val();

          // ✅ Đảm bảo mỗi sensor có đầy đủ thông tin và source
          for (const [sensorId, sensorData] of Object.entries(sensorsData)) {
            if (
              sensorData &&
              (sensorData.latitude || sensorData.lat) &&
              (sensorData.longitude || sensorData.lon)
            ) {
              allSensors[sensorId] = {
                ...sensorData,
                source: "sensors", // Đảm bảo có source
                // ✅ Đảm bảo có cả latitude/longitude và lat/lon
                latitude: sensorData.latitude || sensorData.lat,
                longitude: sensorData.longitude || sensorData.lon,
                // ✅ Bán kính ảnh hưởng của sensor (mặc định 1000m nếu không có)
                radius: sensorData.radius || 1000,
              };
              console.log(
                `   ✅ Sensor ${sensorId}: ${allSensors[sensorId].latitude}, ${
                  allSensors[sensorId].longitude
                }, flood_status: ${
                  sensorData.flood_status || "NORMAL"
                }, water_level_cm: ${sensorData.water_level_cm || 0}, radius: ${
                  allSensors[sensorId].radius
                }m`
              );
            } else {
              console.warn(`   ⚠️ Sensor ${sensorId} bỏ qua: thiếu tọa độ`);
            }
          }

          console.log(
            `📡 Đọc ${
              Object.keys(allSensors).length
            } sensors từ /sensors (tổng: ${
              Object.keys(sensorsData).length
            } sensors trong DB)`
          );
        }
      } catch (error) {
        console.error("⚠️ Lỗi đọc /sensors:", error.message);
      }

      // 2. Đọc từ flood_zones (mock data từ Firebase - vùng ngập cố định)
      try {
        const floodZonesRef = db.ref("flood_zones");
        const floodZonesSnapshot = await floodZonesRef.once("value");
        if (floodZonesSnapshot.exists()) {
          const floodZones = floodZonesSnapshot.val();
          // Convert flood zones thành sensor format
          for (const [zoneId, zoneData] of Object.entries(floodZones)) {
            // Chỉ thêm nếu đang cảnh báo
            if (
              ["warning", "danger", "critical"].includes(
                zoneData.alert_status?.toLowerCase()
              )
            ) {
              allSensors[`zone_${zoneId}`] = {
                device_id: zoneData.zone_name || zoneId,
                latitude: zoneData.latitude || zoneData.lat,
                longitude: zoneData.longitude || zoneData.lon,
                water_level_cm: zoneData.current_level || 0,
                current_percent: zoneData.current_level
                  ? Math.round((zoneData.current_level / 100) * 100)
                  : 0,
                flood_status: zoneData.alert_status?.toUpperCase() || "WARNING",
                status: zoneData.alert_status?.toUpperCase() || "WARNING",
                timestamp: zoneData.last_updated || Date.now(),
                source: "flood_zones",
                zone_id: zoneId,
                radius: zoneData.radius || 1000, // ✅ Bán kính ảnh hưởng của flood zone (mặc định 1000m)
              };
            }
          }
          console.log(
            `📡 Đọc ${
              Object.keys(floodZones).length
            } flood zones từ /flood_zones`
          );
        }
      } catch (error) {
        console.error("⚠️ Lỗi đọc /flood_zones:", error.message);
      }

      // 4. Đọc từ file JSON mock data (floodProneAreas.json)
      try {
        const mockZones = await this.loadMockFloodZones();
        if (mockZones && mockZones.length > 0) {
          // Convert mock zones thành sensor format
          for (const zone of mockZones) {
            // Chỉ thêm nếu có tọa độ và riskLevel cao
            if (zone.coords && zone.coords.lat && zone.coords.lng) {
              // Tính toán mực nước giả định dựa trên riskLevel
              let waterLevelCm = 0;
              let floodStatus = "NORMAL";

              // Nếu riskLevel cao, coi như đang cảnh báo
              if (zone.riskLevel === "high") {
                waterLevelCm = 50; // Giả định 50cm cho high risk
                floodStatus = "WARNING";
              } else if (zone.riskLevel === "medium") {
                waterLevelCm = 30; // Giả định 30cm cho medium risk
                floodStatus = "WARNING";
              }

              // Chỉ thêm nếu có nguy cơ (high hoặc medium)
              if (zone.riskLevel === "high" || zone.riskLevel === "medium") {
                allSensors[`mock_${zone.id}`] = {
                  device_id: zone.name || zone.id,
                  latitude: zone.coords.lat,
                  longitude: zone.coords.lng,
                  water_level_cm: waterLevelCm,
                  current_percent: Math.round((waterLevelCm / 100) * 100),
                  flood_status: floodStatus,
                  status: floodStatus,
                  timestamp: Date.now(),
                  source: "floodProneAreas_json",
                  zone_id: zone.id,
                  radius: zone.radius || 500, // Bán kính ảnh hưởng
                  riskLevel: zone.riskLevel,
                };
              }
            }
          }
          console.log(
            `📡 Đọc ${mockZones.length} mock zones từ floodProneAreas.json (${
              mockZones.filter(
                (z) => z.riskLevel === "high" || z.riskLevel === "medium"
              ).length
            } có nguy cơ)`
          );
        }
      } catch (error) {
        console.error("⚠️ Lỗi đọc floodProneAreas.json:", error.message);
      }

      const totalSensors = Object.keys(allSensors).length;
      console.log(
        `✅ Tổng cộng: ${totalSensors} sensors từ tất cả nguồn (sensors + flood_zones + floodProneAreas.json)`
      );

      return allSensors;
    } catch (error) {
      console.error("Lỗi lấy sensor data:", error);
      return {};
    }
  }

  /**
   * Load mock flood zones từ file JSON
   * @returns {Promise<Array>} Danh sách mock zones
   */
  async loadMockFloodZones() {
    try {
      // Nếu đã cache, trả về cache
      if (this.mockFloodZones !== null) {
        return this.mockFloodZones;
      }

      // Đường dẫn tới file JSON (từ backend root)
      // File nằm ở: Hackathon-Project/src/data/floodProneAreas.json
      // Backend nằm ở: Backend/
      const jsonPath = path.join(
        __dirname,
        "../../../Hackathon-Project/src/data/floodProneAreas.json"
      );

      // Đọc file
      const fileContent = await fs.readFile(jsonPath, "utf8");
      const jsonData = JSON.parse(fileContent);

      // Lấy mảng floodPrones
      this.mockFloodZones = jsonData.floodPrones || [];

      console.log(
        `✅ Đã load ${this.mockFloodZones.length} mock flood zones từ JSON file`
      );

      return this.mockFloodZones;
    } catch (error) {
      // Nếu không tìm thấy file, thử đường dẫn khác
      try {
        const altPath = path.join(
          __dirname,
          "../../Hackathon-Project/src/data/floodProneAreas.json"
        );
        const fileContent = await fs.readFile(altPath, "utf8");
        const jsonData = JSON.parse(fileContent);
        this.mockFloodZones = jsonData.floodPrones || [];
        console.log(
          `✅ Đã load ${this.mockFloodZones.length} mock flood zones từ JSON file (alt path)`
        );
        return this.mockFloodZones;
      } catch (altError) {
        console.warn(`⚠️ Không thể đọc floodProneAreas.json: ${error.message}`);
        this.mockFloodZones = []; // Cache empty array để không retry lại
        return [];
      }
    }
  }

  /**
   * Tính khoảng cách giữa 2 điểm GPS (km)
   * ✅ Xử lý trường hợp tọa độ giống hệt nhau (trả về 0)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    // ✅ Nếu tọa độ giống hệt nhau, trả về 0 ngay
    if (lat1 === lat2 && lon1 === lon2) {
      return 0; // 0 km = 0m
    }

    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // km
  }

  /**
   * Kiểm tra nguy cơ ngập cho 1 location dựa trên sensors
   * @param {Object} location - Thông tin location
   * @param {Object} sensors - Dữ liệu sensors từ Firebase
   * @param {Object} userSettings - Cài đặt cảnh báo của user
   */
  async checkLocationWithSensors(location, sensors, userSettings = {}) {
    const nearbyFloods = [];
    const alertRadius = location.alertRadius || 1000; // Mặc định 1000m (1km)

    // ✅ Lấy ngưỡng từ USER SETTINGS (cm)
    const waterLevelThresholdCm = userSettings.waterLevelThreshold || 50;

    // Chuyển đổi cm → % (giả sử max = 100cm)
    const waterLevelThresholdPercent = (waterLevelThresholdCm / 100) * 100;

    console.log(`📍 Kiểm tra location: ${location.name}`);
    console.log(`   Tọa độ: ${location.coords.lat}, ${location.coords.lon}`);
    console.log(`   Bán kính cảnh báo: ${alertRadius}m`);
    console.log(
      `   Ngưỡng mực nước: ${waterLevelThresholdCm}cm (${waterLevelThresholdPercent}%)`
    );

    for (const [sensorId, sensorData] of Object.entries(sensors)) {
      // ✅ Kiểm tra tọa độ - hỗ trợ nhiều format
      const sensorLat = sensorData.latitude || sensorData.lat;
      const sensorLon = sensorData.longitude || sensorData.lon;

      if (
        !sensorLat ||
        !sensorLon ||
        !location.coords ||
        !location.coords.lat ||
        !location.coords.lon
      ) {
        console.log(`   ⏭️ Sensor ${sensorId} bỏ qua: thiếu tọa độ`);
        continue;
      }

      // ✅ Đảm bảo tọa độ là số
      const locLat = parseFloat(location.coords.lat);
      const locLon = parseFloat(location.coords.lon);
      const sensLat = parseFloat(sensorLat);
      const sensLon = parseFloat(sensorLon);

      if (isNaN(locLat) || isNaN(locLon) || isNaN(sensLat) || isNaN(sensLon)) {
        console.log(`   ⏭️ Sensor ${sensorId} bỏ qua: tọa độ không hợp lệ`);
        continue;
      }

      // Tính khoảng cách
      const distance = this.calculateDistance(locLat, locLon, sensLat, sensLon);

      const distanceMeters = Math.round(distance * 1000);

      // ✅ Log chi tiết để debug
      const isExactMatch = locLat === sensLat && locLon === sensLon;
      if (isExactMatch) {
        console.log(
          `   🎯 TỌA ĐỘ GIỐNG HỆT! Location "${location.name}" và sensor ${sensorId} cùng tọa độ: ${locLat},${locLon}`
        );
      }

      console.log(
        `   📏 Khoảng cách từ "${location.name}" đến sensor ${sensorId}: ${distanceMeters}m (tọa độ: ${locLat},${locLon} → ${sensLat},${sensLon})`
      );

      // Tính phần trăm mực nước
      const waterPercent =
        sensorData.current_percent !== undefined
          ? sensorData.current_percent
          : sensorData.water_level_cm !== undefined
          ? Math.round((sensorData.water_level_cm / 100) * 100)
          : 0;

      // ✅ Đảm bảo water_level_cm là số
      const waterLevelCm = parseFloat(sensorData.water_level_cm) || 0;

      // ✅ Đọc flood_status từ nhiều nguồn có thể
      const floodStatus = (
        sensorData.flood_status ||
        sensorData.status ||
        sensorData.alert_status ||
        "NORMAL"
      ).toUpperCase();

      console.log(
        `   🔍 Sensor ${sensorId} (${
          sensorData.source || "sensors"
        }): ${distanceMeters}m, mực nước ${waterLevelCm}cm (${waterPercent}%), trạng thái: ${floodStatus}`
      );

      // ✅ QUAN TRỌNG: Dùng BÁN KÍNH CỦA SENSOR/MOCK DATA để check, không dùng alertRadius của location
      // Logic: Check xem location có nằm trong bán kính ảnh hưởng của sensor/mock data không
      // - Mock data: dùng radius từ zone.radius (mặc định 500m)
      // - Sensor thực tế (sensors): LUÔN có bán kính tối thiểu 1000m
      // - Flood zones: dùng radius từ zoneData.radius (nếu có), nếu không có thì dùng mặc định 1000m

      let sensorRadius;
      if (sensorData.source === "floodProneAreas_json") {
        // Mock data từ JSON: dùng radius từ zone.radius hoặc mặc định 500m
        sensorRadius = sensorData.radius ? parseFloat(sensorData.radius) : 500;
      } else if (sensorData.source === "flood_zones") {
        // Flood zones từ Firebase: dùng radius từ zoneData.radius hoặc mặc định 1000m
        sensorRadius = sensorData.radius ? parseFloat(sensorData.radius) : 1000;
      } else {
        // Sensor thực tế (sensors, iotData): LUÔN có bán kính tối thiểu 1000m
        if (sensorData.radius !== undefined && sensorData.radius !== null) {
          const parsedRadius = parseFloat(sensorData.radius);
          // Nếu radius < 1000m, nâng lên 1000m cho sensor thực tế
          sensorRadius = parsedRadius > 0 ? Math.max(parsedRadius, 1000) : 1000;
        } else {
          // Không có radius → mặc định 1000m
          sensorRadius = 1000;
        }
      }

      // ✅ Check: location có nằm trong bán kính ảnh hưởng của sensor/mock data không
      const isInSensorRadius = distanceMeters <= sensorRadius;

      // ✅ Log bán kính sensor để debug
      if (sensorData.source === "sensors") {
        console.log(
          `   📡 Sensor thực tế ${sensorId} (${sensorData.source}): bán kính = ${sensorRadius}m`
        );
      }

      const isMockData = sensorData.source === "floodProneAreas_json";
      const isFloodAlerting = [
        "WARNING",
        "DANGER",
        "CRITICAL",
        "ALERT",
      ].includes(floodStatus.toUpperCase());
      const exceedsThreshold = waterLevelCm >= waterLevelThresholdCm;
      const hasWater = waterLevelCm > 0; // Có nước dù chưa vượt ngưỡng

      // ⭐ QUAN TRỌNG: Gửi cảnh báo nếu location nằm trong bán kính sensor VÀ có dấu hiệu ngập
      // Logic:
      // 1. Mực nước >= ngưỡng của user (exceedsThreshold), HOẶC
      // 2. Trạng thái cảnh báo (DANGER, CRITICAL, ALERT) - bất kể mực nước, HOẶC
      // 3. WARNING + có nước > 0 - nhưng chỉ nếu mực nước >= ngưỡng hoặc là mock data với riskLevel high
      // ⚠️ QUAN TRỌNG: Mock data cũng phải tuân theo ngưỡng của user, không phải luôn cảnh báo
      const isCriticalStatus = ["DANGER", "CRITICAL", "ALERT"].includes(
        floodStatus.toUpperCase()
      );
      const isWarningStatus = floodStatus.toUpperCase() === "WARNING";

      // Mock data với riskLevel high: cảnh báo nếu trong bán kính và (vượt ngưỡng HOẶC trạng thái nguy hiểm)
      const isHighRiskMock =
        isMockData &&
        (sensorData.riskLevel === "high" || sensorData.riskLevel === "HIGH");

      const shouldAlert =
        isInSensorRadius &&
        (exceedsThreshold || // Mực nước >= ngưỡng của user
          isCriticalStatus || // Trạng thái nguy hiểm (DANGER, CRITICAL, ALERT) - bất kể mực nước
          (isWarningStatus && exceedsThreshold) || // WARNING + vượt ngưỡng
          (isHighRiskMock && exceedsThreshold)); // Mock data high risk + vượt ngưỡng

      // ✅ Log chi tiết điều kiện check
      console.log(
        `   🔍 [CHECK] Sensor ${sensorId}: ` +
          `isInSensorRadius=${isInSensorRadius} (${distanceMeters}m <= ${sensorRadius}m [bán kính sensor]), ` +
          `isFloodAlerting=${isFloodAlerting} (${floodStatus}), ` +
          `exceedsThreshold=${exceedsThreshold} (${waterLevelCm}cm >= ${waterLevelThresholdCm}cm), ` +
          `hasWater=${hasWater} (${waterLevelCm}cm > 0), ` +
          `isMockData=${isMockData}, ` +
          `isCriticalStatus=${isCriticalStatus}, ` +
          `isHighRiskMock=${isHighRiskMock}, ` +
          `shouldAlert=${shouldAlert}`
      );

      if (shouldAlert) {
        let reason;
        if (isMockData) {
          reason = `khu vực dễ ngập (${sensorData.riskLevel || "high"} risk)`;
        } else if (isFloodAlerting) {
          reason = `trạng thái ${floodStatus}`;
        } else if (exceedsThreshold) {
          reason = `vượt ngưỡng ${waterLevelThresholdCm}cm`;
        } else if (hasWater) {
          reason = `phát hiện nước ${waterLevelCm}cm (phát hiện sớm)`;
        }

        console.log(
          `   ⚠️ CẢNH BÁO: Sensor ${sensorId} ${reason}! (${distanceMeters}m, ${waterLevelCm}cm, ${floodStatus})`
        );

        nearbyFloods.push({
          sensorId: sensorId,
          sensorName: sensorData.device_id || sensorData.zone_name || sensorId,
          distance: distanceMeters,
          waterLevel: waterLevelCm,
          waterPercent: waterPercent,
          floodStatus: floodStatus,
          coords: {
            lat: sensLat, // ✅ Dùng tọa độ đã parse
            lon: sensLon, // ✅ Dùng tọa độ đã parse
          },
          timestamp:
            sensorData.timestamp || sensorData.last_updated || Date.now(),
          alertReason: reason,
          source: sensorData.source || "sensors", // Nguồn dữ liệu
          // ✅ Thêm địa chỉ sensor nếu có
          address:
            sensorData.address ||
            sensorData.location ||
            sensorData.zone_name ||
            null,
        });
      } else if (isInSensorRadius) {
        // Log lý do không cảnh báo để debug
        console.log(
          `   ⏭️ Sensor ${sensorId} trong bán kính sensor (${sensorRadius}m) nhưng không cảnh báo: ` +
            `mực nước ${waterLevelCm}cm (ngưỡng: ${waterLevelThresholdCm}cm), ` +
            `trạng thái ${floodStatus}, không có dấu hiệu ngập`
        );
      } else {
        // Location nằm ngoài bán kính của sensor
        console.log(
          `   ⏭️ Sensor ${sensorId} nằm ngoài bán kính: ${distanceMeters}m > ${sensorRadius}m (bán kính sensor)`
        );
      }
    }

    if (nearbyFloods.length === 0) {
      console.log(
        `   ✅ Không có sensor nào cảnh báo trong bán kính ảnh hưởng của chúng`
      );
    }

    // Sắp xếp theo khoảng cách
    nearbyFloods.sort((a, b) => a.distance - b.distance);

    return nearbyFloods;
  }

  /**
   * Phân tích TẤT CẢ locations của user với sensor data
   */
  async analyzeUserLocations(userId) {
    try {
      const db = admin.database();

      // 1. Lấy USER SETTINGS (ngưỡng cảnh báo) - ✅ ĐỌC TỪ ĐÚNG PATH
      // Frontend lưu vào: userProfiles/{userId}/autoAlertSettings
      const settingsRef = db.ref(`userProfiles/${userId}/autoAlertSettings`);
      const settingsSnapshot = await settingsRef.once("value");

      let userSettings = {
        waterLevelThreshold: 50, // Mặc định 50cm
        riskLevelThreshold: 1, // Mặc định: warning (1)
      };

      if (settingsSnapshot.exists()) {
        const settings = settingsSnapshot.val();
        userSettings = {
          waterLevelThreshold: settings.waterLevelThreshold || 50,
          riskLevelThreshold: settings.riskLevelThreshold || 1,
        };
      }

      console.log(`⚙️ User Settings (từ autoAlertSettings):`, userSettings);

      // 2. Lấy user info từ Firebase Auth
      let userEmail = "";
      let userName = "Người dùng";

      try {
        const authUser = await admin.auth().getUser(userId);
        userEmail = authUser.email || "";
        userName =
          authUser.displayName || authUser.email?.split("@")[0] || "Người dùng";
        console.log(`✅ Lấy email từ Firebase Auth: ${userEmail}`);
      } catch (authError) {
        console.error(
          "⚠️ Không lấy được user từ Auth, dùng fallback:",
          authError.message
        );
      }

      // Fallback: Lấy từ userProfiles nếu Auth không có
      const userRef = db.ref(`userProfiles/${userId}`);
      const userSnapshot = await userRef.once("value");

      if (userSnapshot.exists()) {
        const userData = userSnapshot.val();
        if (!userEmail) userEmail = userData.email || "";
        if (userName === "Người dùng")
          userName = userData.name || userData.displayName || userName;
      }

      const user = {
        userId: userId,
        name: userName,
        email: userEmail,
        settings: userSettings, // ✅ Thêm settings vào user object
      };

      console.log(`👤 User info:`, {
        userId,
        name: user.name,
        email: user.email || "❌ KHÔNG CÓ EMAIL",
        hasEmail: !!user.email,
        waterLevelThreshold: userSettings.waterLevelThreshold + "cm",
        riskLevel: userSettings.riskLevelThreshold,
      });

      // 2. Lấy locations
      const locationsRef = db.ref(`userProfiles/${userId}/locations`);
      const locationsSnapshot = await locationsRef.once("value");

      if (!locationsSnapshot.exists()) {
        return {
          userId: userId,
          user: user,
          totalLocations: 0,
          affectedLocations: 0,
          alerts: [],
        };
      }

      const locationsData = locationsSnapshot.val();
      const locations = [];

      for (const [id, data] of Object.entries(locationsData)) {
        if (data.status !== "deleted" && data.coords) {
          // ✅ Validate tọa độ
          const lat = parseFloat(data.coords.lat);
          const lon = parseFloat(data.coords.lon);

          if (isNaN(lat) || isNaN(lon)) {
            console.warn(
              `⚠️ Location ${id} "${data.name}" có tọa độ không hợp lệ:`,
              data.coords
            );
            continue;
          }

          locations.push({
            id: id,
            ...data,
            coords: {
              lat: lat,
              lon: lon,
            },
          });

          console.log(
            `📍 Location "${data.name}": ${lat}, ${lon}, alertRadius: ${
              data.alertRadius || 1000
            }m`
          );
        } else {
          console.log(
            `⏭️ Location ${id} bỏ qua: status=${
              data.status
            }, hasCoords=${!!data.coords}`
          );
        }
      }

      // 3. Lấy tất cả sensors
      const sensors = await this.getAllSensors();

      if (Object.keys(sensors).length === 0) {
        console.log("⚠️ Không có sensor data trong Firebase");
        return {
          userId: userId,
          user: user,
          totalLocations: locations.length,
          affectedLocations: 0,
          alerts: [],
        };
      }

      console.log(
        `📊 Đang check ${locations.length} locations với ${
          Object.keys(sensors).length
        } sensors`
      );

      // 4. Check từng location với USER SETTINGS
      const alerts = [];

      for (const location of locations) {
        const nearbyFloods = await this.checkLocationWithSensors(
          location,
          sensors,
          userSettings // ✅ Truyền settings của user
        );

        if (nearbyFloods.length > 0) {
          console.log(
            `⚠️ Location "${location.name}" có ${nearbyFloods.length} sensors gần đang cảnh báo!`
          );

          for (const flood of nearbyFloods) {
            alerts.push({
              location: location,
              sensor: flood,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }

      return {
        userId: userId,
        user: user,
        totalLocations: locations.length,
        affectedLocations: alerts.length,
        alerts: alerts,
      };
    } catch (error) {
      console.error("Lỗi phân tích sensor data:", error);
      throw error;
    }
  }

  /**
   * Tạo prompt AI cá nhân hóa dựa trên sensor data
   */
  createPersonalizedPrompt(user, alert) {
    const { location, sensor } = alert;

    const locationTypeMap = {
      residential: "Nhà",
      office: "Công ty/Văn phòng",
      entertainment: "Khu vui chơi",
      school: "Trường học",
      hospital: "Bệnh viện",
      other: "Địa điểm",
    };

    const locationTypeLabel = locationTypeMap[location.type] || location.name;

    const userName = user.name || "Bạn";

    return `
Bạn là một hệ thống AI chuyên tạo cảnh báo ngập lụt CÁ NHÂN HÓA bằng tiếng Việt.

THÔNG TIN NGƯỜI DÙNG:
- Tên: ${userName}
- Email: ${user.email}
- Địa điểm quan tâm: ${locationTypeLabel} "${location.name}" (${
      location.icon || "📍"
    })
- Địa chỉ: ${location.address}
- Mức ưu tiên: ${location.priority}

THÔNG TIN SENSOR GẦN ĐÓ:
- Tên sensor: ${sensor.sensorName}
- Khoảng cách từ ${locationTypeLabel}: ${sensor.distance}m
- Mực nước: ${sensor.waterLevel}cm (${sensor.waterPercent}%)
- Trạng thái: ${sensor.floodStatus}
- Thời gian đo: ${new Date(parseInt(sensor.timestamp)).toLocaleString("vi-VN")}

YÊU CẦU TẠO EMAIL:
1. **Tiêu đề (subject):**
   - Có icon phù hợp (${location.icon || "📍"})
   - Có tên người dùng "${userName}"
   - Đề cập đến địa điểm "${location.name}"
   - Thể hiện mức độ khẩn cấp

2. **Nội dung (htmlBody):**
   - Chào hỏi cá nhân với tên "${userName}"
   - Nhấn mạnh địa điểm CỤ THỂ: "${locationTypeLabel} ${location.name}"
   - Nói rõ khoảng cách: "${sensor.distance}m từ ${locationTypeLabel}"
   - Mực nước HIỆN TẠI: ${sensor.waterLevel}cm (${sensor.waterPercent}%)
   - Dùng HTML đơn giản: <p>, <b>, <ul>, <li>, <br>
   - Dùng style inline cho màu:
     * Nguy hiểm cao: color:red
     * Trung bình: color:orange
     * Thấp: color:#ffa500
   - Đưa ra HÀNH ĐỘNG CỤ THỂ dựa trên loại địa điểm:
     * Nhà: di chuyển xe, đóng cửa, chuẩn bị đồ dùng
     * Công ty: thông báo nhân viên, lộ trình thay thế
     * Khu vui chơi: hoãn chuyến đi, chọn địa điểm khác
   - Dưới 150 từ
   - Ngôn ngữ khẩn cấp nhưng THÂN THIỆN

3. **Tone:**
   - Cá nhân hóa, gần gũi
   - Tiếng Việt chuẩn, dễ hiểu
   - Khẩn trương nếu mực nước cao (>70%)

FORMAT BẮT BUỘC: Trả về JSON thuần với 2 trường:
{
  "subject": "tiêu đề email có tên user và địa điểm",
  "htmlBody": "nội dung HTML cá nhân hóa"
}
`;
  }

  /**
   * Tạo prompt AI cho NHIỀU sensors (gom vào 1 email duy nhất)
   */
  createPersonalizedPromptMultipleSensors(user, location, sensors) {
    const locationTypeMap = {
      residential: "Nhà",
      office: "Công ty/Văn phòng",
      entertainment: "Khu vui chơi",
      school: "Trường học",
      hospital: "Bệnh viện",
      other: "Địa điểm",
    };

    const locationTypeLabel = locationTypeMap[location.type] || location.name;
    const userName = user.name || "Bạn";

    // Tạo danh sách sensors
    const sensorsList = sensors
      .map(
        (s) =>
          `- ${s.sensorName}: ${s.distance}m, mực nước ${s.waterLevel}cm (${s.waterPercent}%), trạng thái ${s.floodStatus}`
      )
      .join("\n");

    return `
Bạn là một hệ thống AI chuyên tạo cảnh báo ngập lụt CÁ NHÂN HÓA bằng tiếng Việt.

THÔNG TIN NGƯỜI DÙNG:
- Tên: ${userName}
- Email: ${user.email}
- Địa điểm quan tâm: ${locationTypeLabel} "${location.name}"
- Địa chỉ: ${location.address}

CÓ ${sensors.length} SENSORS GẦN ĐÓ ĐANG CẢNH BÁO:
${sensorsList}

YÊU CẦU TẠO EMAIL:
1. **Tiêu đề (subject):**
   - Có icon 📍
   - Có tên người dùng "${userName}"
   - Đề cập đến "${location.name}"
   - Nhấn mạnh có ${sensors.length} sensors đang cảnh báo

2. **Nội dung (htmlBody):**
   - Chào "${userName}"
   - Liệt kê TẤT CẢ ${sensors.length} sensors với khoảng cách và mực nước
   - Dùng HTML: <p>, <b>, <ul>, <li>, <br>
   - Màu đỏ cho nguy hiểm: <span style="color:red;">
   - Đề xuất biện pháp phòng ngừa
   - Ký tên: "Hệ thống Cảnh báo Ngập lụt AI"

Tạo email NGẮN GỌN, DỄ ĐỌC, CÓ ĐỦ ${sensors.length} SENSORS!
`;
  }
}

module.exports = new SensorBasedAlertService();
