/**
 * Telegram Alert Service
 * Service để gửi cảnh báo qua Telegram
 */

const axios = require("axios");
const admin = require("firebase-admin");

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

class TelegramAlertService {
  /**
   * Gửi tin nhắn tới một user
   * @param {string} chatId - Telegram Chat ID
   * @param {string} message - Nội dung tin nhắn
   * @param {object} options - Tùy chọn (parse_mode, etc.)
   * @returns {Promise<object>} - Kết quả gửi
   */
  async sendMessage(chatId, message, options = {}) {
    try {
      const response = await axios.post(
        `${TELEGRAM_API_URL}/sendMessage`,
        {
          chat_id: chatId,
          text: message,
          parse_mode: options.parse_mode || "Markdown",
          ...options,
        },
        { timeout: 10000 } // 10s timeout
      );

      if (response.data.ok) {
        console.log(`✅ [Telegram] Đã gửi tin nhắn tới ${chatId}`);
        return {
          success: true,
          messageId: response.data.result.message_id,
          chatId: chatId,
        };
      } else {
        console.error(
          `❌ [Telegram] Lỗi gửi tới ${chatId}:`,
          response.data.description
        );
        return {
          success: false,
          error: response.data.description,
        };
      }
    } catch (error) {
      console.error(
        `❌ [Telegram] Lỗi gửi tin nhắn tới ${chatId}:`,
        error.message
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Lấy Telegram Chat ID từ Firebase user profile
   * @param {string} userId - Firebase User ID
   * @returns {Promise<string|null>} - Chat ID hoặc null
   */
  async getUserTelegramChatId(userId) {
    try {
      const db = admin.database();

      // Kiểm tra trong userProfiles/{userId}/telegramChatId
      const profileRef = db.ref(`userProfiles/${userId}/telegramChatId`);
      const profileSnapshot = await profileRef.once("value");

      if (profileSnapshot.exists()) {
        const chatId = profileSnapshot.val();
        console.log(
          `✅ [Telegram] Tìm thấy chat_id cho user ${userId}: ${chatId}`
        );
        return chatId;
      }

      // Nếu không có, kiểm tra trong telegram_users (reverse lookup by email)
      const userRef = db.ref(`userProfiles/${userId}/email`);
      const emailSnapshot = await userRef.once("value");

      if (emailSnapshot.exists()) {
        const email = emailSnapshot.val();

        // Tìm trong telegram_users
        const telegramUsersRef = db.ref("telegram_users");
        const telegramSnapshot = await telegramUsersRef.once("value");

        if (telegramSnapshot.exists()) {
          const users = telegramSnapshot.val();

          for (const [chatId, userData] of Object.entries(users)) {
            if (userData.email === email && userData.is_active) {
              console.log(
                `✅ [Telegram] Tìm thấy chat_id qua email ${email}: ${chatId}`
              );

              // Lưu vào profile để lần sau nhanh hơn
              await profileRef.set(chatId);

              return chatId;
            }
          }
        }
      }

      console.log(`⚠️ [Telegram] Không tìm thấy chat_id cho user ${userId}`);
      return null;
    } catch (error) {
      console.error(
        `❌ [Telegram] Lỗi lấy chat_id cho user ${userId}:`,
        error.message
      );
      return null;
    }
  }

  /**
   * Kiểm tra user có bật thông báo Telegram không
   * @param {string} userId - Firebase User ID
   * @returns {Promise<boolean>} - true nếu bật
   */
  async isUserTelegramNotificationEnabled(userId) {
    try {
      const db = admin.database();
      const settingsRef = db.ref(
        `userProfiles/${userId}/notificationSettings/telegram`
      );
      const snapshot = await settingsRef.once("value");

      if (snapshot.exists()) {
        const enabled = snapshot.val();
        console.log(
          `📋 [Telegram] User ${userId} notification: ${
            enabled ? "BẬT" : "TẮT"
          }`
        );
        return enabled === true;
      }

      // Mặc định là false nếu chưa cấu hình
      console.log(`📋 [Telegram] User ${userId} chưa cấu hình, mặc định TẮT`);
      return false;
    } catch (error) {
      console.error(
        `❌ [Telegram] Lỗi kiểm tra settings cho user ${userId}:`,
        error.message
      );
      return false;
    }
  }

  /**
   * Mô tả mực nước so với mặt đường
   * @param {number} waterLevelCm - Mực nước (cm)
   * @returns {string} - Mô tả
   */
  describeWaterLevel(waterLevelCm) {
    if (waterLevelCm <= 0) return "Không có nước";
    if (waterLevelCm < 10) return "Nước nhẹ, ướt mặt đường";
    if (waterLevelCm < 20) return "Nước ngập đến mắt cá chân (~10-20cm)";
    if (waterLevelCm < 40) return "Nước ngập đến bắp chân (~20-40cm)";
    if (waterLevelCm < 60) return "Nước ngập đến đầu gối (~40-60cm)";
    if (waterLevelCm < 80) return "Nước ngập đến đùi (~60-80cm)";
    if (waterLevelCm < 100) return "Nước ngập đến thắt lưng (~80-100cm)";
    return "Nước ngập rất sâu (>100cm), nguy hiểm!";
  }

  /**
   * Tạo giải pháp cụ thể dựa trên mực nước và khoảng cách
   * @param {object} sensor - Sensor data
   * @param {object} location - Location data
   * @returns {string} - Giải pháp
   */
  generateSolution(sensor, location) {
    const waterLevel = sensor.waterLevel || 0;
    const distance = sensor.distance || 0;
    const floodStatus = sensor.floodStatus || "NORMAL";
    const locationName = location.name || "địa điểm của bạn";

    let solutions = [];

    // Giải pháp dựa trên mực nước
    if (waterLevel >= 60) {
      solutions.push("🚗 *Di chuyển xe ngay*: Nước ngập sâu (>60cm), không nên đi xe qua khu vực này");
      solutions.push("📦 *Bảo vệ đồ đạc*: Di chuyển đồ dùng lên cao, đóng cửa chống nước");
      solutions.push("🚶 *Tránh đi bộ*: Nước ngập đến đùi, rất nguy hiểm");
    } else if (waterLevel >= 40) {
      solutions.push("🚗 *Cẩn thận khi lái xe*: Nước ngập đến đầu gối (~40-60cm), xe có thể bị hỏng");
      solutions.push("👟 *Mang ủng cao*: Nếu phải đi bộ, mang ủng cao để tránh nước");
      solutions.push("🔄 *Tìm đường khác*: Nên tìm tuyến đường tránh khu vực ngập");
    } else if (waterLevel >= 20) {
      solutions.push("🚶 *Cẩn thận khi đi bộ*: Nước ngập đến bắp chân (~20-40cm), tránh đi qua");
      solutions.push("👟 *Mang giày chống nước*: Nếu phải đi, mang giày chống nước");
    } else if (waterLevel >= 10) {
      solutions.push("⚠️ *Theo dõi tình hình*: Nước bắt đầu ngập, có thể tăng cao");
    }

    // Giải pháp dựa trên khoảng cách
    if (distance <= 100) {
      solutions.push(`📍 *Rất gần "${locationName}"*: Sensor cách chỉ ${distance}m, nguy cơ cao`);
      solutions.push("🚗 *Di chuyển xe đi xa*: Nếu có xe, nên di chuyển đến nơi cao hơn");
    } else if (distance <= 300) {
      solutions.push(`📍 *Gần "${locationName}"*: Sensor cách ${distance}m, cần theo dõi sát`);
    } else {
      solutions.push(`📍 *Trong phạm vi cảnh báo*: Sensor cách ${distance}m từ "${locationName}"`);
    }

    // Giải pháp dựa trên trạng thái
    if (floodStatus === "DANGER" || floodStatus === "CRITICAL") {
      solutions.push("⚠️ *Tránh khu vực này ngay*: Tìm tuyến đường khác an toàn hơn");
      solutions.push("📱 *Theo dõi cập nhật*: Tình hình có thể xấu đi nhanh");
    } else if (floodStatus === "WARNING") {
      solutions.push("⚠️ *Theo dõi tình hình*: Có thể ngập trong thời gian tới");
    }

    return solutions.join("\n");
  }

  /**
   * Tạo tin nhắn cảnh báo từ alert data
   * @param {object} alert - Alert data
   * @param {object} location - Location data
   * @param {object} user - User data
   * @returns {string} - Tin nhắn Telegram formatted
   */
  createAlertMessage(alert, location, user) {
    const userName = user.name || "Bạn";
    const locationName = location.name || "Địa điểm của bạn";
    const locationAddress = location.address || "";

    let message = `🚨 *CẢNH BÁO NGẬP LỤT* 🚨\n\n`;
    message += `Chào ${userName},\n\n`;
    message += `📍 *Địa điểm:* ${locationName}\n`;

    if (locationAddress) {
      message += `📫 ${locationAddress}\n`;
    }

    message += `\n`;

    // Nếu có sensor data
    if (alert.sensors && alert.sensors.length > 0) {
      message += `⚠️ *${alert.sensors.length} cảm biến gần đó đang cảnh báo:*\n\n`;

      for (const sensor of alert.sensors) {
        const sensorName = sensor.sensorName || "Cảm biến";
        const sensorAddress = sensor.address || sensor.coords?.address || "";
        const distance = sensor.distance || 0;
        const waterLevel = sensor.waterLevel || 0;
        const waterPercent = sensor.waterPercent || 0;
        const floodStatus = sensor.floodStatus || "WARNING";
        
        // Mô tả mực nước
        const waterDescription = this.describeWaterLevel(waterLevel);

        message += `• *${sensorName}*\n`;
        
        // Địa chỉ sensor nếu có
        if (sensorAddress) {
          message += `  📍 Địa chỉ sensor: ${sensorAddress}\n`;
        }
        
        message += `  └ Khoảng cách từ "${locationName}": *${distance}m*\n`;
        message += `  └ Mực nước: *${waterLevel}cm* (${waterPercent}%)\n`;
        message += `  └ Mô tả: ${waterDescription}\n`;
        message += `  └ Trạng thái: *${floodStatus}*\n\n`;
      }

      // Thêm giải pháp cho sensor đầu tiên (gần nhất)
      if (alert.sensors.length > 0) {
        const nearestSensor = alert.sensors[0];
        message += `💡 *GIẢI PHÁP:*\n`;
        message += this.generateSolution(nearestSensor, location);
        message += `\n\n`;
      }
    }

    message += `⏰ *Thời gian:* ${new Date().toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    })}\n\n`;

    message += `📞 *Liên hệ khẩn cấp:*\n`;
    message += `• Công an: *113*\n`;
    message += `• Cứu hỏa: *114*\n`;
    message += `• Cấp cứu: *115*\n\n`;

    message += `⚠️ _Vui lòng chú ý an toàn và theo dõi tình hình!_\n\n`;
    message += `🤖 _Tin nhắn từ Hệ thống Cảnh báo Ngập lụt AI_`;

    return message;
  }

  /**
   * Gửi cảnh báo qua Telegram cho user
   * @param {string} userId - Firebase User ID
   * @param {object} alert - Alert data
   * @param {object} location - Location data
   * @param {object} user - User data
   * @returns {Promise<object>} - Kết quả gửi
   */
  async sendAlertToUser(userId, alert, location, user) {
    try {
      // 1. Kiểm tra user có bật thông báo Telegram không
      const isEnabled = await this.isUserTelegramNotificationEnabled(userId);

      if (!isEnabled) {
        console.log(
          `⏭️ [Telegram] User ${userId} đã tắt thông báo Telegram, bỏ qua`
        );
        return {
          success: false,
          skipped: true,
          reason: "Telegram notification disabled",
        };
      }

      // 2. Lấy chat_id
      const chatId = await this.getUserTelegramChatId(userId);

      if (!chatId) {
        console.log(
          `⏭️ [Telegram] User ${userId} chưa liên kết Telegram, bỏ qua`
        );
        return {
          success: false,
          skipped: true,
          reason: "No Telegram chat_id found",
        };
      }

      // 3. Tạo tin nhắn
      const message = this.createAlertMessage(alert, location, user);

      // 4. Gửi tin nhắn
      const telegramStartTime = Date.now();
      console.log(
        `📱 [${new Date().toLocaleTimeString()}] Bắt đầu gửi Telegram...`
      );
      const result = await this.sendMessage(chatId, message);
      const telegramEndTime = Date.now();
      const telegramSendTime = telegramEndTime - telegramStartTime;
      console.log(
        `📱 [${new Date().toLocaleTimeString()}] Telegram hoàn thành trong ${telegramSendTime}ms`
      );

      // Thêm thời gian vào kết quả
      result.sendTime = telegramSendTime;

      // 5. Lưu log vào Firebase
      if (result.success) {
        const db = admin.database();
        const logRef = db.ref(`userProfiles/${userId}/telegramAlerts`).push();

        await logRef.set({
          locationId: location.id,
          locationName: location.name,
          chatId: chatId,
          messageId: result.messageId,
          sentAt: Date.now(),
          isRead: false,
        });
      }

      return result;
    } catch (error) {
      console.error(
        `❌ [Telegram] Lỗi gửi alert cho user ${userId}:`,
        error.message
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Gửi cảnh báo SONG SONG (parallel) với email
   * Dùng Promise.allSettled để không block nhau
   * @param {string} userId - Firebase User ID
   * @param {object} alert - Alert data
   * @param {object} location - Location data
   * @param {object} user - User data
   * @param {function} emailSendFunction - Function để gửi email
   * @returns {Promise<object>} - Kết quả gửi cả email và Telegram
   */
  async sendAlertWithEmail(userId, alert, location, user, emailSendFunction) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📤 [Alert] Bắt đầu gửi cảnh báo song song`);
    console.log(`👤 User: ${user?.email || userId}`);
    console.log(`⏰ Thời gian: ${new Date().toLocaleString("vi-VN")}`);
    console.log(`${"=".repeat(60)}\n`);

    const startTime = Date.now();

    // Gửi SONG SONG với Promise.allSettled (không block nhau)
    console.log(
      `🚀 [${new Date().toLocaleTimeString()}] Bắt đầu gửi Email + Telegram...`
    );

    const [emailResult, telegramResult] = await Promise.allSettled([
      emailSendFunction(), // Gọi function gửi email
      this.sendAlertToUser(userId, alert, location, user), // Gửi Telegram
    ]);

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    console.log(`\n${"=".repeat(60)}`);
    console.log(`✅ [Alert] KẾT QUẢ GỬI CẢNH BÁO`);
    console.log(`⏱️  Tổng thời gian: ${totalTime}ms`);
    console.log(
      `📧 Email: ${
        emailResult.status === "fulfilled" && emailResult.value?.success
          ? "✅ Thành công"
          : "❌ Thất bại"
      }`
    );
    if (emailResult.status === "fulfilled" && emailResult.value?.sendTime) {
      console.log(`   └─ Thời gian gửi: ${emailResult.value.sendTime}ms`);
    }
    console.log(
      `📱 Telegram: ${
        telegramResult.status === "fulfilled" && telegramResult.value?.success
          ? "✅ Thành công"
          : "❌ Thất bại"
      }`
    );
    if (
      telegramResult.status === "fulfilled" &&
      telegramResult.value?.sendTime
    ) {
      console.log(`   └─ Thời gian gửi: ${telegramResult.value.sendTime}ms`);
    }
    console.log(`${"=".repeat(60)}\n`);

    return {
      success: true,
      totalTime: totalTime,
      email: {
        success:
          emailResult.status === "fulfilled" && emailResult.value?.success,
        result:
          emailResult.status === "fulfilled"
            ? emailResult.value
            : { error: emailResult.reason },
      },
      telegram: {
        success:
          telegramResult.status === "fulfilled" &&
          telegramResult.value?.success,
        result:
          telegramResult.status === "fulfilled"
            ? telegramResult.value
            : { error: telegramResult.reason },
      },
    };
  }
}

module.exports = new TelegramAlertService();
