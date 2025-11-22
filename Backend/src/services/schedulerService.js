const alertSettingsService = require("./alertSettingsService");
const firebaseClient = require("../integrations/firebaseClient");
const emailService = require("../email/emailService");
const geminiClient = require("../integrations/geminiClient");
const sensorBasedAlertService = require("./sensorBasedAlertService");
const personalizedAlertController = require("../controllers/personalizedAlertController");

/**
 * Service tự động check dữ liệu sensor và gửi cảnh báo định kỳ
 */
class SchedulerService {
  constructor() {
    this.intervals = new Map(); // Map<userId, intervalId>
    this.isRunning = false;
  }

  /**
   * Khởi động scheduler cho TẤT CẢ users có bật cảnh báo
   */
  async start() {
    if (this.isRunning) {
      console.log("⚠️ Scheduler đã chạy rồi");
      return;
    }

    this.isRunning = true;
    console.log("🕐 Scheduler Service đang khởi động...");

    // Lấy danh sách users có bật cảnh báo
    const enabledUsers = await alertSettingsService.getAllEnabledUsers();

    if (enabledUsers.length === 0) {
      console.log("ℹ️ Chưa có user nào bật cảnh báo tự động");
      return;
    }

    // Tạo interval cho từng user
    for (const user of enabledUsers) {
      this.startUserScheduler(user.userId, user.settings);
    }

    console.log(`✅ Scheduler đã khởi động cho ${enabledUsers.length} users`);
  }

  /**
   * Dừng scheduler
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    // Clear tất cả intervals
    for (const [userId, intervalId] of this.intervals.entries()) {
      clearInterval(intervalId);
      console.log(`⏹️ Đã dừng scheduler cho user ${userId}`);
    }

    this.intervals.clear();
    this.isRunning = false;
    console.log("⏹️ Scheduler Service đã dừng");
  }

  /**
   * Khởi động scheduler cho 1 user
   * @param {string} userId - ID của user
   * @param {Object} settings - Cấu hình cảnh báo
   */
  startUserScheduler(userId, settings) {
    // Nếu đã có interval, clear nó trước
    if (this.intervals.has(userId)) {
      clearInterval(this.intervals.get(userId));
    }

    const {
      checkInterval: rawCheckInterval,
      sensorIds,
      threshold,
      email,
    } = settings;

    // ⭐ QUAN TRỌNG: Convert checkInterval từ phút sang milliseconds nếu cần
    // Frontend lưu checkInterval dưới dạng phút (ví dụ: 15), backend cần milliseconds (ví dụ: 900000)
    // Nếu checkInterval < 1000, coi như là phút và convert sang milliseconds
    let checkInterval;
    if (rawCheckInterval < 1000) {
      // Nếu < 1000, coi như là phút
      checkInterval = rawCheckInterval * 60 * 1000; // Convert phút -> milliseconds
      console.log(
        `🔄 [${userId}] Convert checkInterval từ ${rawCheckInterval} phút → ${checkInterval}ms`
      );
    } else {
      // Nếu >= 1000, coi như đã là milliseconds
      checkInterval = rawCheckInterval;
    }

    const intervalMinutes = checkInterval / (60 * 1000);
    console.log(
      `⏰ Khởi động scheduler cho user ${userId} - Check mỗi ${intervalMinutes} phút (${checkInterval}ms)`
    );

    // Tạo interval mới - ✅ DÙNG SENSOR-BASED ALERT (check locations)
    const intervalId = setInterval(async () => {
      try {
        // ✅ Dùng sensor-based alert service để check TẤT CẢ locations của user
        await this.checkAndAlertLocations(userId, email);
      } catch (error) {
        console.error(`❌ Lỗi khi check cho user ${userId}:`, error);
      }
    }, checkInterval);

    this.intervals.set(userId, intervalId);

    // Chạy check ngay lần đầu
    this.checkAndAlertLocations(userId, email);
  }

  /**
   * Dừng scheduler cho 1 user
   * @param {string} userId - ID của user
   */
  stopUserScheduler(userId) {
    if (this.intervals.has(userId)) {
      clearInterval(this.intervals.get(userId));
      this.intervals.delete(userId);
      console.log(`⏹️ Đã dừng scheduler cho user ${userId}`);
      return true;
    }
    return false;
  }

  /**
   * Restart scheduler cho 1 user (sau khi update settings)
   * @param {string} userId - ID của user
   */
  async restartUserScheduler(userId) {
    // Dừng scheduler hiện tại
    this.stopUserScheduler(userId);

    // Lấy settings mới
    const settings = await alertSettingsService.getAlertSettings(userId);

    // Nếu enabled, start lại
    if (settings.enabled) {
      this.startUserScheduler(userId, settings);
    }
  }

  /**
   * ✅ MỚI: Check TẤT CẢ locations của user với sensor data và gửi cảnh báo
   * @param {string} userId - ID của user
   * @param {string} email - Email nhận cảnh báo
   */
  async checkAndAlertLocations(userId, email) {
    try {
      console.log(`🔍 [SCHEDULER] Checking locations cho user ${userId}...`);

      // Cập nhật lastChecked
      await alertSettingsService.updateLastChecked(userId);

      // ✅ Dùng sensor-based alert service để check TẤT CẢ locations
      const analysis = await sensorBasedAlertService.analyzeUserLocations(
        userId
      );

      console.log(
        `📊 [SCHEDULER] Kết quả: ${analysis.affectedLocations}/${analysis.totalLocations} locations bị ảnh hưởng`
      );

      if (analysis.affectedLocations === 0) {
        console.log(
          `✅ [SCHEDULER] Tất cả địa điểm của user ${userId} đều an toàn`
        );
        return;
      }

      console.log(
        `⚠️ [SCHEDULER] Phát hiện ${analysis.affectedLocations} cảnh báo từ sensors!`
      );

      // Gom alerts theo location (tránh spam nhiều emails cho cùng 1 location)
      const locationAlertsMap = {};

      for (const alert of analysis.alerts) {
        const locId = alert.location.id;
        if (!locationAlertsMap[locId]) {
          locationAlertsMap[locId] = {
            location: alert.location,
            sensors: [],
          };
        }
        locationAlertsMap[locId].sensors.push(alert.sensor);
      }

      console.log(
        `📧 [SCHEDULER] Sẽ gửi ${
          Object.keys(locationAlertsMap).length
        } email (1 email/location)`
      );

      // Gửi cảnh báo cho từng location
      for (const [locId, data] of Object.entries(locationAlertsMap)) {
        try {
          // Tạo prompt AI cho nhiều sensors
          const prompt =
            sensorBasedAlertService.createPersonalizedPromptMultipleSensors(
              analysis.user,
              data.location,
              data.sensors
            );

          // Generate email với Gemini
          const geminiResponse = await geminiClient.generateContent(prompt);
          const emailContent = JSON.parse(geminiResponse.text);

          // Gửi email
          if (email && analysis.user.email) {
            await emailService.sendEmail({
              to: analysis.user.email,
              subject: emailContent.subject,
              htmlBody: emailContent.htmlBody,
            });

            console.log(
              `✅ [SCHEDULER] Đã gửi email cảnh báo cho location "${data.location.name}"`
            );
          }
        } catch (error) {
          console.error(
            `❌ [SCHEDULER] Lỗi gửi cảnh báo cho location ${locId}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error(
        `❌ [SCHEDULER] Lỗi check and alert cho user ${userId}:`,
        error
      );
    }
  }

  /**
   * ⚠️ DEPRECATED: Check dữ liệu sensor và gửi cảnh báo nếu cần (method cũ)
   * @param {string} userId - ID của user
   * @param {Array} sensorIds - Danh sách sensor IDs
   * @param {number} threshold - Ngưỡng cảnh báo (%)
   * @param {string} email - Email nhận cảnh báo
   */
  async checkAndAlert(userId, sensorIds, threshold, email) {
    try {
      console.log(`🔍 Checking sensors cho user ${userId}...`);

      // Cập nhật lastChecked
      await alertSettingsService.updateLastChecked(userId);

      // Nếu không có sensor IDs, bỏ qua
      if (!sensorIds || sensorIds.length === 0) {
        console.log(`⚠️ User ${userId} chưa cấu hình sensor IDs`);
        return;
      }

      // Check từng sensor
      for (const sensorId of sensorIds) {
        const sensorData = await this.getSensorData(sensorId);

        if (!sensorData) {
          console.log(`⚠️ Không tìm thấy dữ liệu cho sensor ${sensorId}`);
          continue;
        }

        // Tính current_percent
        const currentPercent = this.calculatePercent(sensorData);

        console.log(
          `📊 Sensor ${sensorId}: ${currentPercent}% (ngưỡng: ${threshold}%)`
        );

        // Nếu vượt ngưỡng, gửi cảnh báo
        if (currentPercent >= threshold) {
          console.log(
            `🚨 CẢNH BÁO: Sensor ${sensorId} vượt ngưỡng! (${currentPercent}% >= ${threshold}%)`
          );

          await this.sendAlert(
            userId,
            sensorId,
            sensorData,
            currentPercent,
            email
          );
        }
      }
    } catch (error) {
      console.error(`❌ Lỗi check and alert cho user ${userId}:`, error);
    }
  }

  /**
   * Lấy dữ liệu sensor từ Firebase
   * @param {string} sensorId - ID của sensor
   * @returns {Promise<Object|null>} Dữ liệu sensor
   */
  async getSensorData(sensorId) {
    try {
      // Thử lấy từ iotData trước
      let data = await firebaseClient.readData(`iotData/${sensorId}`);

      if (data) {
        return {
          source: "iotData",
          ...data,
        };
      }

      // Nếu không có, thử sensors/flood
      data = await firebaseClient.readData(`sensors/flood/${sensorId}`);

      if (data) {
        return {
          source: "sensors/flood",
          ...data,
        };
      }

      return null;
    } catch (error) {
      console.error(`Lỗi lấy dữ liệu sensor ${sensorId}:`, error);
      return null;
    }
  }

  /**
   * Tính phần trăm mực nước từ dữ liệu sensor
   * @param {Object} sensorData - Dữ liệu sensor
   * @returns {number} Phần trăm (0-100)
   */
  calculatePercent(sensorData) {
    // Nếu có sẵn current_percent
    if (sensorData.current_percent !== undefined) {
      return sensorData.current_percent;
    }

    // Nếu có water_level_cm, tính từ đó
    if (sensorData.water_level_cm !== undefined) {
      const maxWaterLevel = 100; // cm
      return Math.round((sensorData.water_level_cm / maxWaterLevel) * 100);
    }

    // Mặc định
    return 0;
  }

  /**
   * Gửi email cảnh báo
   * @param {string} userId - ID của user
   * @param {string} sensorId - ID của sensor
   * @param {Object} sensorData - Dữ liệu sensor
   * @param {number} currentPercent - Phần trăm hiện tại
   * @param {string} email - Email nhận
   */
  async sendAlert(userId, sensorId, sensorData, currentPercent, email) {
    try {
      // Tạo cảnh báo bằng AI
      const alertData = {
        ...sensorData,
        current_percent: currentPercent,
        sensorId: sensorId,
        location: sensorData.location || `Sensor ${sensorId}`,
      };

      const generatedAlert = await geminiClient.generateFloodAlert(alertData);

      // Gửi email
      if (email) {
        const emailResult = await emailService.sendAIFloodAlert(
          email,
          generatedAlert
        );

        if (emailResult.success) {
          console.log(`✉️ Đã gửi email cảnh báo tới ${email}`);

          // Cập nhật lastAlertSent
          await alertSettingsService.updateLastAlertSent(userId);

          // Lưu log vào Firebase
          await this.saveAlertLog(userId, sensorId, alertData, generatedAlert);
        } else {
          console.error(`❌ Lỗi gửi email tới ${email}:`, emailResult.error);
        }
      } else {
        console.log(`⚠️ User ${userId} chưa cấu hình email`);
      }
    } catch (error) {
      console.error(`❌ Lỗi gửi alert cho user ${userId}:`, error);
    }
  }

  /**
   * Lưu log cảnh báo vào Firebase
   * @param {string} userId - ID của user
   * @param {string} sensorId - ID của sensor
   * @param {Object} sensorData - Dữ liệu sensor
   * @param {Object} generatedAlert - Cảnh báo đã tạo
   */
  async saveAlertLog(userId, sensorId, sensorData, generatedAlert) {
    try {
      const db = require("firebase-admin").database();
      const alertRef = db.ref(`userSettings/${userId}/alertLogs`).push();

      await alertRef.set({
        sensorId: sensorId,
        sensorData: sensorData,
        alert: generatedAlert,
        sentAt: Date.now(),
        createdAt: Date.now(),
      });

      console.log(`💾 Đã lưu alert log cho user ${userId}`);
    } catch (error) {
      console.error(`❌ Lỗi lưu alert log:`, error);
    }
  }

  /**
   * Lấy trạng thái scheduler
   * @returns {Object} Trạng thái
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      totalUsers: this.intervals.size,
      users: Array.from(this.intervals.keys()),
    };
  }
}

module.exports = new SchedulerService();
