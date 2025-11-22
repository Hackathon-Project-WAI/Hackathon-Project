const admin = require("firebase-admin");

/**
 * Service quản lý Alert Settings cho users
 * Lưu trữ cấu hình cảnh báo tự động trong Firebase Realtime Database
 */
class AlertSettingsService {
  /**
   * Lấy cấu hình cảnh báo của user
   * @param {string} userId - Firebase User ID
   * @returns {Promise<Object>} Settings object
   */
  async getAlertSettings(userId) {
    try {
      const db = admin.database();
      const settingsRef = db.ref(`userSettings/${userId}/alertSettings`);
      const snapshot = await settingsRef.once("value");

      if (!snapshot.exists()) {
        // Trả về default settings
        return this.getDefaultSettings();
      }

      const settings = snapshot.val();
      const mergedSettings = {
        ...this.getDefaultSettings(),
        ...settings,
      };

      // ⭐ QUAN TRỌNG: Đảm bảo checkInterval luôn là milliseconds
      if (mergedSettings.checkInterval !== undefined) {
        const rawCheckInterval = mergedSettings.checkInterval;
        // Nếu checkInterval < 1000, coi như là phút và convert sang milliseconds
        if (rawCheckInterval < 1000) {
          mergedSettings.checkInterval = rawCheckInterval * 60 * 1000; // Convert phút -> milliseconds
          console.log(
            `🔄 [${userId}] Convert checkInterval từ ${rawCheckInterval} phút → ${mergedSettings.checkInterval}ms khi get`
          );
        }
      }

      return mergedSettings;
    } catch (error) {
      console.error(`Lỗi lấy alert settings cho user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Cập nhật cấu hình cảnh báo
   * @param {string} userId - Firebase User ID
   * @param {Object} settings - Settings mới
   * @returns {Promise<Object>} Updated settings
   */
  async updateAlertSettings(userId, settings) {
    try {
      const db = admin.database();
      const settingsRef = db.ref(`userSettings/${userId}/alertSettings`);

      // Lấy settings hiện tại
      const currentSettings = await this.getAlertSettings(userId);

      // ⭐ QUAN TRỌNG: Convert checkInterval từ phút sang milliseconds nếu cần
      let processedSettings = { ...settings };
      if (settings.checkInterval !== undefined) {
        const rawCheckInterval = settings.checkInterval;
        // Nếu checkInterval < 1000, coi như là phút và convert sang milliseconds
        if (rawCheckInterval < 1000) {
          processedSettings.checkInterval = rawCheckInterval * 60 * 1000; // Convert phút -> milliseconds
          console.log(
            `🔄 [${userId}] Convert checkInterval từ ${rawCheckInterval} phút → ${processedSettings.checkInterval}ms khi update`
          );
        } else {
          // Nếu >= 1000, coi như đã là milliseconds
          processedSettings.checkInterval = rawCheckInterval;
        }
      }

      // Merge với settings hiện tại
      const updatedSettings = {
        ...currentSettings,
        ...processedSettings,
        updatedAt: Date.now(),
      };

      // Lưu vào Firebase
      await settingsRef.set(updatedSettings);

      console.log(
        `✅ [${userId}] Đã cập nhật alert settings - checkInterval: ${updatedSettings.checkInterval}ms (${updatedSettings.checkInterval / (60 * 1000)} phút)`
      );

      return {
        success: true,
        settings: updatedSettings,
      };
    } catch (error) {
      console.error(`Lỗi cập nhật alert settings cho user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Bật/tắt cảnh báo tự động
   * @param {string} userId - Firebase User ID
   * @param {boolean} enabled - true = bật, false = tắt
   */
  async toggleAlertSettings(userId, enabled) {
    try {
      const db = admin.database();
      const settingsRef = db.ref(`userSettings/${userId}/alertSettings`);

      await settingsRef.update({
        enabled: enabled,
        updatedAt: Date.now(),
      });

      console.log(
        `✅ User ${userId} đã ${enabled ? "BẬT" : "TẮT"} cảnh báo tự động`
      );
    } catch (error) {
      console.error(
        `Lỗi toggle alert settings cho user ${userId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Xóa cấu hình cảnh báo
   * @param {string} userId - Firebase User ID
   */
  async deleteAlertSettings(userId) {
    try {
      const db = admin.database();
      const settingsRef = db.ref(`userSettings/${userId}/alertSettings`);
      await settingsRef.remove();

      console.log(`✅ Đã xóa alert settings cho user ${userId}`);
    } catch (error) {
      console.error(`Lỗi xóa alert settings cho user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Cập nhật thời gian check cuối cùng
   * @param {string} userId - Firebase User ID
   */
  async updateLastChecked(userId) {
    try {
      const db = admin.database();
      const settingsRef = db.ref(`userSettings/${userId}/alertSettings`);

      await settingsRef.update({
        lastChecked: Date.now(),
      });
    } catch (error) {
      console.error(
        `Lỗi cập nhật lastChecked cho user ${userId}:`,
        error
      );
    }
  }

  /**
   * Cập nhật thời gian gửi cảnh báo cuối cùng
   * @param {string} userId - Firebase User ID
   */
  async updateLastAlertSent(userId) {
    try {
      const db = admin.database();
      const settingsRef = db.ref(`userSettings/${userId}/alertSettings`);

      await settingsRef.update({
        lastAlertSent: Date.now(),
      });
    } catch (error) {
      console.error(
        `Lỗi cập nhật lastAlertSent cho user ${userId}:`,
        error
      );
    }
  }

  /**
   * Lấy danh sách TẤT CẢ users có bật cảnh báo tự động
   * @returns {Promise<Array>} Danh sách users với settings
   */
  async getAllEnabledUsers() {
    try {
      const db = admin.database();
      const settingsRef = db.ref("userSettings");

      const snapshot = await settingsRef.once("value");

      if (!snapshot.exists()) {
        return [];
      }

      const allSettings = snapshot.val();
      const enabledUsers = [];

      for (const [userId, userData] of Object.entries(allSettings)) {
        const alertSettings = userData.alertSettings;

        // Chỉ lấy users có enabled = true
        if (alertSettings && alertSettings.enabled === true) {
          enabledUsers.push({
            userId: userId,
            settings: alertSettings,
          });
        }
      }

      console.log(
        `📊 Tìm thấy ${enabledUsers.length} users có bật cảnh báo tự động`
      );

      return enabledUsers;
    } catch (error) {
      console.error("Lỗi lấy danh sách enabled users:", error);
      return [];
    }
  }

  /**
   * Lấy cấu hình mặc định
   * @returns {Object} Default settings
   */
  getDefaultSettings() {
    return {
      enabled: false,
      weatherEnabled: true, // Bật cảnh báo thời tiết
      sensorEnabled: true, // Bật cảnh báo sensor
      checkInterval: 900000, // 15 phút (ms)
      waterLevelThreshold: 50, // 50cm
      riskLevelThreshold: 1, // 1 = warning, 2 = danger, 3 = critical
      threshold: 80, // 80% (legacy)
      sensorIds: [], // Danh sách sensor IDs cần theo dõi
      email: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastChecked: null,
      lastAlertSent: null,
    };
  }

  /**
   * Kiểm tra xem user có settings chưa
   * @param {string} userId - Firebase User ID
   * @returns {Promise<boolean>}
   */
  async hasSettings(userId) {
    try {
      const db = admin.database();
      const settingsRef = db.ref(`userSettings/${userId}/alertSettings`);
      const snapshot = await settingsRef.once("value");
      return snapshot.exists();
    } catch (error) {
      console.error(`Lỗi kiểm tra settings cho user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Khởi tạo settings mặc định cho user mới
   * @param {string} userId - Firebase User ID
   * @param {string} email - Email của user
   */
  async initializeSettings(userId, email) {
    try {
      const hasSettings = await this.hasSettings(userId);

      if (hasSettings) {
        console.log(`User ${userId} đã có settings, bỏ qua`);
        return;
      }

      const defaultSettings = this.getDefaultSettings();
      defaultSettings.email = email;

      await this.updateAlertSettings(userId, defaultSettings);

      console.log(`✅ Đã khởi tạo settings cho user ${userId}`);
    } catch (error) {
      console.error(`Lỗi khởi tạo settings cho user ${userId}:`, error);
      throw error;
    }
  }
}

module.exports = new AlertSettingsService();
