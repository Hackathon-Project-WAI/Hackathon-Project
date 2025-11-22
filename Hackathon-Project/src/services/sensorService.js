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
   * Lấy tất cả sensors
   * @returns {Promise<Array>} Mảng sensors với tọa độ và trạng thái ngập
   */
  getAllSensors() {
    return new Promise((resolve, reject) => {
      const sensorsRef = ref(this.db, "sensors");

      onValue(
        sensorsRef,
        (snapshot) => {
          const data = snapshot.val();
          if (!data) {
            resolve([]);
            return;
          }

          // Convert object to array với flood zones
          const sensors = Object.entries(data).map(([id, sensor]) => ({
            id,
            ...sensor,
            // Chỉ tạo flood zone nếu có flood_status khác "NO_FLOOD"
            isFlooded:
              sensor.flood_status &&
              sensor.flood_status !== "NO_FLOOD" &&
              sensor.flood_status !== "SENSOR_ERROR",
          }));

          console.log("📡 Loaded sensors:", sensors.length);
          console.log(
            "🌊 Flooded sensors:",
            sensors.filter((s) => s.isFlooded).length
          );

          resolve(sensors);
        },
        (error) => {
          console.error("❌ Error loading sensors:", error);
          reject(error);
        }
      );
    });
  }

  /**
   * Lắng nghe realtime updates từ sensors
   * @param {Function} callback - Callback function nhận array sensors
   * @returns {Function} Unsubscribe function
   */
  subscribeSensors(callback) {
    const sensorsRef = ref(this.db, "sensors");
    const listenerId = Date.now().toString();

    const listener = onValue(sensorsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        console.log("⚠️ No sensor data in Firebase");
        callback([]);
        return;
      }

      const sensors = Object.entries(data).map(([id, sensor]) => {
        // Log tọa độ thô từ Firebase
        console.log(`📍 RAW COORDINATES from Firebase for sensor "${id}":`, {
          latitude: sensor.latitude,
          longitude: sensor.longitude,
          latitude_type: typeof sensor.latitude,
          longitude_type: typeof sensor.longitude,
        });

        // Sensor được coi là "ngập" nếu:
        // 1. Có water_level_cm > 0 (nước đang tăng)
        // 2. HOẶC flood_status khác "NO_FLOOD" (bao gồm cả SENSOR_ERROR với water_level > 0)
        const waterLevel = sensor.water_level_cm || 0;
        const hasWater = waterLevel > 0;
        const hasFloodStatus =
          sensor.flood_status && sensor.flood_status !== "NO_FLOOD";

        const isFlooded = hasWater || hasFloodStatus;

        console.log(`📡 Sensor ${id}:`, {
          flood_status: sensor.flood_status,
          water_level: sensor.water_level_cm,
          hasWater: hasWater,
          hasFloodStatus: hasFloodStatus,
          isFlooded: isFlooded,
          coords: { lat: sensor.latitude, lng: sensor.longitude },
        });

        return {
          id,
          ...sensor,
          isFlooded: isFlooded,
        };
      });

      console.log(
        `🌊 Total sensors: ${sensors.length}, Flooded: ${
          sensors.filter((s) => s.isFlooded).length
        }`
      );
      callback(sensors);
    });

    this.listeners.set(listenerId, { ref: sensorsRef, listener });

    // Return unsubscribe function
    return () => {
      off(sensorsRef, "value", listener);
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
    this.listeners.forEach(({ ref: dbRef, listener }) => {
      off(dbRef, "value", listener);
    });
    this.listeners.clear();
  }
}

const sensorService = new SensorService();
export default sensorService;
