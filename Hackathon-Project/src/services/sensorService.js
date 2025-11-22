/**
 * Sensor Service
 * Service để lấy dữ liệu sensor từ Firebase Realtime Database
 */
import { ref, onValue, off } from "firebase/database";
import { db } from "../configs/firebase";

class SensorService {
  constructor() {
    this.db = db;
    this.listeners = new Map();
  }

  /**
   * Lấy tất cả sensors từ CẢ 3 nguồn: sensors, iotData, và flood_zones (giống backend)
   * @returns {Promise<Array>} Mảng sensors với tọa độ và trạng thái ngập
   */
  getAllSensors() {
    return new Promise((resolve, reject) => {
      const allSensors = {};
      let loadedCount = 0;
      const totalSources = 3;
      let hasError = false;

      // Helper function để process sensor
      const processSensor = (id, sensor, source = "sensors") => {
        const waterLevel = sensor.water_level_cm || 0;
        const hasWater = waterLevel > 0;
        const hasFloodStatus =
          sensor.flood_status && sensor.flood_status !== "NO_FLOOD";

        return {
          id,
          ...sensor,
          isFlooded: hasWater || hasFloodStatus,
          source: source,
        };
      };

      // Helper function để check và resolve
      const checkAndResolve = () => {
        loadedCount++;
        if (loadedCount === totalSources && !hasError) {
          const sensorsArray = Object.entries(allSensors).map(
            ([id, sensor]) => sensor
          );
          console.log(
            `📡 Loaded ${sensorsArray.length} sensors from all sources`
          );
          console.log(
            "🌊 Flooded sensors:",
            sensorsArray.filter((s) => s.isFlooded).length
          );
          resolve(sensorsArray);
        }
      };

      // 1. Đọc từ /sensors
      const sensorsRef = ref(this.db, "sensors");
      onValue(
        sensorsRef,
        (snapshot) => {
          const data = snapshot.val();
          if (data) {
            Object.entries(data).forEach(([id, sensor]) => {
              allSensors[id] = processSensor(id, sensor, "sensors");
            });
            console.log(
              `📡 Loaded ${Object.keys(data).length} sensors from /sensors`
            );
          }
          checkAndResolve();
        },
        (error) => {
          console.error("❌ Error loading /sensors:", error);
          hasError = true;
          checkAndResolve();
        },
        { onlyOnce: true }
      );

      // 2. Đọc từ /iotData
      const iotDataRef = ref(this.db, "iotData");
      onValue(
        iotDataRef,
        (snapshot) => {
          const data = snapshot.val();
          if (data) {
            Object.entries(data).forEach(([id, sensor]) => {
              allSensors[`iot_${id}`] = processSensor(
                `iot_${id}`,
                sensor,
                "iotData"
              );
            });
            console.log(
              `📡 Loaded ${Object.keys(data).length} sensors from /iotData`
            );
          }
          checkAndResolve();
        },
        (error) => {
          console.error("❌ Error loading /iotData:", error);
          hasError = true;
          checkAndResolve();
        },
        { onlyOnce: true }
      );

      // 3. Đọc từ /flood_zones
      const floodZonesRef = ref(this.db, "flood_zones");
      onValue(
        floodZonesRef,
        (snapshot) => {
          const data = snapshot.val();
          if (data) {
            Object.entries(data).forEach(([zoneId, zoneData]) => {
              // Chỉ thêm nếu đang cảnh báo
              if (
                ["warning", "danger", "critical"].includes(
                  zoneData.alert_status?.toLowerCase()
                )
              ) {
                const sensor = {
                  device_id: zoneData.zone_name || zoneId,
                  latitude: zoneData.latitude || zoneData.lat,
                  longitude: zoneData.longitude || zoneData.lon,
                  water_level_cm: zoneData.current_level || 0,
                  flood_status:
                    zoneData.alert_status?.toUpperCase() || "WARNING",
                  timestamp: zoneData.last_updated || Date.now(),
                };
                allSensors[`zone_${zoneId}`] = processSensor(
                  `zone_${zoneId}`,
                  sensor,
                  "flood_zones"
                );
              }
            });
            console.log(
              `📡 Loaded ${
                Object.keys(data).length
              } flood zones from /flood_zones`
            );
          }
          checkAndResolve();
        },
        (error) => {
          console.error("❌ Error loading /flood_zones:", error);
          hasError = true;
          checkAndResolve();
        },
        { onlyOnce: true }
      );
    });
  }

  /**
   * Lắng nghe realtime updates từ sensors
   * Đọc từ CẢ 3 nguồn: sensors, iotData, và flood_zones (giống backend)
   * @param {Function} callback - Callback function nhận array sensors
   * @returns {Function} Unsubscribe function
   */
  subscribeSensors(callback) {
    const listenerId = Date.now().toString();
    const allSensors = {};
    let sensorsLoaded = 0;
    const totalSources = 3; // sensors, iotData, flood_zones

    // Helper function để process sensor data
    const processSensor = (id, sensor, source = "sensors") => {
      const waterLevel = sensor.water_level_cm || 0;
      const hasWater = waterLevel > 0;
      const hasFloodStatus =
        sensor.flood_status && sensor.flood_status !== "NO_FLOOD";

      const isFlooded = hasWater || hasFloodStatus;

      return {
        id,
        ...sensor,
        isFlooded: isFlooded,
        source: source, // Đánh dấu nguồn dữ liệu
      };
    };

    // Helper function để merge và callback
    const mergeAndCallback = () => {
      sensorsLoaded++;
      if (sensorsLoaded === totalSources) {
        // Convert object to array
        const sensorsArray = Object.entries(allSensors).map(
          ([id, sensor]) => sensor
        );

        console.log(
          `🌊 Total sensors from all sources: ${
            sensorsArray.length
          }, Flooded: ${sensorsArray.filter((s) => s.isFlooded).length}`
        );
        callback(sensorsArray);
      }
    };

    // 1. Đọc từ /sensors (sensor data chính)
    const sensorsRef = ref(this.db, "sensors");
    const sensorsListener = onValue(sensorsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        Object.entries(data).forEach(([id, sensor]) => {
          allSensors[id] = processSensor(id, sensor, "sensors");
        });
        console.log(
          `📡 Loaded ${Object.keys(data).length} sensors from /sensors`
        );
      }
      mergeAndCallback();
    });

    // 2. Đọc từ /iotData (IoT sensor data)
    const iotDataRef = ref(this.db, "iotData");
    const iotListener = onValue(iotDataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        Object.entries(data).forEach(([id, sensor]) => {
          // Prefix với "iot_" để tránh conflict
          allSensors[`iot_${id}`] = processSensor(
            `iot_${id}`,
            sensor,
            "iotData"
          );
        });
        console.log(
          `📡 Loaded ${Object.keys(data).length} sensors from /iotData`
        );
      }
      mergeAndCallback();
    });

    // 3. Đọc từ /flood_zones (mock data từ Firebase - vùng ngập cố định)
    const floodZonesRef = ref(this.db, "flood_zones");
    const floodZonesListener = onValue(floodZonesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        Object.entries(data).forEach(([zoneId, zoneData]) => {
          // Chỉ thêm nếu đang cảnh báo
          if (
            ["warning", "danger", "critical"].includes(
              zoneData.alert_status?.toLowerCase()
            )
          ) {
            // Convert flood zone thành sensor format
            const sensor = {
              device_id: zoneData.zone_name || zoneId,
              latitude: zoneData.latitude || zoneData.lat,
              longitude: zoneData.longitude || zoneData.lon,
              water_level_cm: zoneData.current_level || 0,
              flood_status: zoneData.alert_status?.toUpperCase() || "WARNING",
              timestamp: zoneData.last_updated || Date.now(),
            };
            allSensors[`zone_${zoneId}`] = processSensor(
              `zone_${zoneId}`,
              sensor,
              "flood_zones"
            );
          }
        });
        console.log(
          `📡 Loaded ${Object.keys(data).length} flood zones from /flood_zones`
        );
      }
      mergeAndCallback();
    });

    // Lưu tất cả listeners để cleanup
    this.listeners.set(listenerId, {
      refs: [sensorsRef, iotDataRef, floodZonesRef],
      listeners: [sensorsListener, iotListener, floodZonesListener],
    });

    // Return unsubscribe function
    return () => {
      off(sensorsRef, "value", sensorsListener);
      off(iotDataRef, "value", iotListener);
      off(floodZonesRef, "value", floodZonesListener);
      this.listeners.delete(listenerId);
    };
  }

  /**
   * Lấy sensor theo ID
   * @param {string} sensorId
   * @returns {Promise<Object>}
   */
  getSensorById(sensorId) {
    return new Promise((resolve, reject) => {
      const sensorRef = ref(this.db, `sensors/${sensorId}`);

      onValue(
        sensorRef,
        (snapshot) => {
          const data = snapshot.val();
          if (!data) {
            resolve(null);
            return;
          }

          resolve({
            id: sensorId,
            ...data,
            isFlooded:
              data.flood_status &&
              data.flood_status !== "NO_FLOOD" &&
              data.flood_status !== "SENSOR_ERROR",
          });
        },
        { onlyOnce: true }
      );
    });
  }

  /**
   * Convert sensors thành flood zones format cho map
   * @param {Array} sensors - Array sensors từ Firebase
   * @param {number} radius - Bán kính vùng ngập (mét), mặc định 20m
   * @returns {Array} Array flood zones
   */
  sensorsToFloodZones(sensors, radius = 20) {
    console.log(`🔄 Converting ${sensors.length} sensors to flood zones...`);

    const floodedSensors = sensors.filter((sensor) => sensor.isFlooded);
    console.log(`✅ Found ${floodedSensors.length} flooded sensors`);

    const zones = floodedSensors.map((sensor) => {
      const zone = {
        id: sensor.id,
        name: `Sensor ${sensor.device_id || sensor.id}`,
        district: "Đà Nẵng",
        coords: {
          lat: sensor.latitude,
          lng: sensor.longitude,
        },
        radius: radius, // 20 mét
        riskLevel: this.getFloodRiskLevel(
          sensor.flood_status,
          sensor.water_level_cm
        ),
        waterLevel: sensor.water_level_cm || 0,
        floodStatus: sensor.flood_status,
        timestamp: sensor.timestamp,
        type: "sensor", // Đánh dấu đây là flood zone từ sensor
      };

      console.log(`🔵 Created flood zone:`, {
        id: zone.id,
        name: zone.name,
        coords: zone.coords,
        radius: zone.radius,
        riskLevel: zone.riskLevel,
        waterLevel: zone.waterLevel,
        floodStatus: zone.floodStatus,
      });

      return zone;
    });

    return zones;
  }

  /**
   * Xác định mức độ nguy hiểm dựa trên flood_status VÀ water_level
   * @param {string} floodStatus
   * @param {number} waterLevel - Mực nước tính bằng cm
   * @returns {string} 'high' | 'medium' | 'low'
   */
  getFloodRiskLevel(floodStatus, waterLevel = 0) {
    // Nếu mực nước > 50cm → nguy hiểm cao (MÀU ĐỎ)
    if (waterLevel > 50) {
      console.log(`🔴 High risk: water level ${waterLevel}cm > 50cm`);
      return "high";
    }

    // Nếu mực nước 30-50cm → nguy hiểm trung bình (MÀU VÀNG)
    if (waterLevel > 30) {
      console.log(`🟡 Medium risk: water level ${waterLevel}cm (30-50cm)`);
      return "medium";
    }

    // Nếu mực nước 10-30cm → nguy hiểm thấp (MÀU XANH)
    if (waterLevel > 10) {
      console.log(`🟢 Low risk: water level ${waterLevel}cm (10-30cm)`);
      return "low";
    }

    // Nếu không có water_level, dựa vào flood_status
    if (!floodStatus || floodStatus === "NO_FLOOD") return "low";

    if (
      floodStatus.includes("CRITICAL") ||
      floodStatus.includes("SEVERE") ||
      floodStatus.includes("DANGER")
    ) {
      console.log(`🔴 High risk: flood status = ${floodStatus}`);
      return "high";
    }
    if (floodStatus.includes("WARNING") || floodStatus.includes("MODERATE")) {
      console.log(`🟡 Medium risk: flood status = ${floodStatus}`);
      return "medium";
    }

    return "medium"; // Mặc định
  }

  /**
   * Cleanup tất cả listeners
   */
  cleanup() {
    this.listeners.forEach(({ refs, listeners }) => {
      if (refs && listeners) {
        // Multiple listeners (new format)
        refs.forEach((dbRef, index) => {
          if (listeners[index]) {
            off(dbRef, "value", listeners[index]);
          }
        });
      } else {
        // Single listener (old format for backward compatibility)
        const dbRef = refs || this.listeners.get("ref");
        const listener = listeners || this.listeners.get("listener");
        if (dbRef && listener) {
          off(dbRef, "value", listener);
        }
      }
    });
    this.listeners.clear();
  }
}

const sensorService = new SensorService();
export default sensorService;
