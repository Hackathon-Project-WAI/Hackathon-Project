/**
 * Flood Zone Service
 * Service để lấy và merge vùng ngập từ:
 * 1. Mock data (vùng ngập cố định)
 * 2. Sensor data (vùng ngập real-time từ Firebase)
 */

import { ref, onValue, off } from "firebase/database";
import { db } from "../configs/firebase";

class FloodZoneService {
  constructor() {
    this.sensorFloodZones = [];
    this.mockFloodZones = [];
    this.listeners = [];
    this.sensorListener = null;
  }

  /**
   * Khởi tạo mock flood zones (vùng ngập cố định)
   * @param {Array} mockZones - Danh sách mock zones
   */
  setMockFloodZones(mockZones) {
    this.mockFloodZones = mockZones || [];
    this.notifyListeners();
  }

  /**
   * Lắng nghe sensor data từ Firebase Realtime
   * Tự động cập nhật khi có thay đổi
   */
  startListeningSensors() {
    if (this.sensorListener) {
      console.log("⚠️ Sensor listener already running");
      return;
    }

    const sensorsRef = ref(db, "sensors");
    
    this.sensorListener = onValue(
      sensorsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const sensorsData = snapshot.val();
          this.sensorFloodZones = this.convertSensorsToFloodZones(sensorsData);
          
          console.log(
            `🌊 [FloodZoneService] Cập nhật sensors: ${this.sensorFloodZones.length} vùng ngập từ IoT`
          );
          
          this.notifyListeners();
        } else {
          this.sensorFloodZones = [];
          this.notifyListeners();
        }
      },
      (error) => {
        console.error("❌ Lỗi lắng nghe sensor data:", error);
      }
    );

    console.log("✅ Bắt đầu lắng nghe sensor data từ Firebase");
  }

  /**
   * Dừng lắng nghe sensors
   */
  stopListeningSensors() {
    if (this.sensorListener) {
      const sensorsRef = ref(db, "sensors");
      off(sensorsRef, "value", this.sensorListener);
      this.sensorListener = null;
      console.log("⏹️ Đã dừng lắng nghe sensor data");
    }
  }

  /**
   * Chuyển đổi sensor data thành flood zones
   * @param {Object} sensorsData - Dữ liệu sensors từ Firebase
   * @returns {Array} Danh sách flood zones
   */
  convertSensorsToFloodZones(sensorsData) {
    const zones = [];

    for (const [sensorId, sensorData] of Object.entries(sensorsData)) {
      // Kiểm tra sensor có lat/lng không
      if (!sensorData.latitude || !sensorData.longitude) {
        continue;
      }

      // Tính phần trăm mực nước
      const waterPercent =
        sensorData.current_percent ||
        Math.round((sensorData.water_level_cm / 100) * 100);

      // Chỉ tạo flood zone nếu mực nước >= 30% (có nguy cơ ngập)
      if (waterPercent < 30) {
        continue;
      }

      // Xác định risk level dựa vào mực nước
      let riskLevel = "low";
      let radius = 100; // Bán kính ảnh hưởng (meters)
      let description = "";

      if (waterPercent >= 80) {
        riskLevel = "high";
        radius = 300;
        description = `Sensor ${sensorId}: Mực nước rất cao (${waterPercent}%) - NGUY HIỂM`;
      } else if (waterPercent >= 50) {
        riskLevel = "medium";
        radius = 200;
        description = `Sensor ${sensorId}: Mực nước cao (${waterPercent}%) - CẢNH BÁO`;
      } else {
        riskLevel = "low";
        radius = 100;
        description = `Sensor ${sensorId}: Mực nước trung bình (${waterPercent}%)`;
      }

      zones.push({
        id: `sensor-${sensorId}`,
        name: sensorData.device_id || `Sensor ${sensorId}`,
        district: "Real-time IoT",
        coords: {
          lat: sensorData.latitude,
          lng: sensorData.longitude,
        },
        lat: sensorData.latitude,
        lng: sensorData.longitude,
        radius: radius,
        riskLevel: riskLevel,
        description: description,
        source: "sensor", // Đánh dấu nguồn là sensor
        sensorId: sensorId,
        waterLevel: sensorData.water_level_cm,
        waterPercent: waterPercent,
        floodStatus: sensorData.flood_status || "WARNING",
        timestamp: sensorData.timestamp,
      });
    }

    return zones;
  }

  /**
   * Lấy TẤT CẢ flood zones (mock + sensor)
   * @returns {Array} Danh sách tất cả flood zones
   */
  getAllFloodZones() {
    // Merge cả mock zones và sensor zones
    const allZones = [...this.mockFloodZones, ...this.sensorFloodZones];
    
    console.log(
      `🗺️ [FloodZoneService] Total zones: ${allZones.length} (${this.mockFloodZones.length} mock + ${this.sensorFloodZones.length} sensors)`
    );
    
    return allZones;
  }

  /**
   * Lấy chỉ sensor flood zones
   * @returns {Array} Danh sách sensor zones
   */
  getSensorFloodZones() {
    return this.sensorFloodZones;
  }

  /**
   * Lấy chỉ mock flood zones
   * @returns {Array} Danh sách mock zones
   */
  getMockFloodZones() {
    return this.mockFloodZones;
  }

  /**
   * Đăng ký listener để nhận cập nhật khi flood zones thay đổi
   * @param {Function} callback - Function được gọi khi có thay đổi
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.push(callback);
    
    // Gọi callback ngay với dữ liệu hiện tại
    callback(this.getAllFloodZones());
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Thông báo cho tất cả listeners về thay đổi
   */
  notifyListeners() {
    const allZones = this.getAllFloodZones();
    this.listeners.forEach((callback) => {
      try {
        callback(allZones);
      } catch (error) {
        console.error("❌ Lỗi khi notify listener:", error);
      }
    });
  }

  /**
   * Lấy số lượng zones
   * @returns {Object} Thống kê
   */
  getStats() {
    return {
      total: this.getAllFloodZones().length,
      mock: this.mockFloodZones.length,
      sensor: this.sensorFloodZones.length,
      sensorListening: !!this.sensorListener,
    };
  }

  /**
   * Cleanup - dừng tất cả listeners
   */
  cleanup() {
    this.stopListeningSensors();
    this.listeners = [];
    console.log("🧹 FloodZoneService cleaned up");
  }
}

// Singleton instance
const floodZoneService = new FloodZoneService();

export default floodZoneService;
