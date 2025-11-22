const firebaseClient = require("../integrations/firebaseClient");
const emailService = require("../email/emailService");
const geminiClient = require("../integrations/geminiClient");

class IoTListener {
  constructor() {
    this.emailRecipients = [];
  }

  /**
   * Khởi tạo listener
   */
  start(recipients = []) {
    this.emailRecipients = recipients;

    if (this.emailRecipients.length === 0) {
      console.log("⚠️ Chưa cấu hình ALERT_EMAIL_RECIPIENTS trong .env");
    } else {
      console.log(`📧 Email recipients: ${this.emailRecipients.join(", ")}`);
    }

    // Chọn loại database
    if (process.env.FIREBASE_DB_TYPE === "firestore") {
      this.listenToFirestore();
    } else {
      this.listenToRealtimeDB();
    }
  }

  /**
   * Lắng nghe Realtime Database
   */
  listenToRealtimeDB() {
    console.log("👂 Lắng nghe Realtime Database...");

    firebaseClient.listenToPath("sensors/flood", async (data, key) => {
      console.log(`📊 Dữ liệu mới từ sensor ${key}:`, data);

      if (data && data.current_percent >= 80) {
        await this.sendAlert(data);
      }
    });
  }

  /**
   * Lắng nghe Firestore
   */
  listenToFirestore() {
    console.log("👂 Lắng nghe Firestore...");

    firebaseClient.listenToCollection(
      "flood_sensors",
      async (type, docId, data) => {
        if (type === "modified" || type === "added") {
          console.log(`📊 Dữ liệu mới từ Firestore sensor ${docId}:`, data);

          if (data && data.current_percent >= 80) {
            await this.sendAlert(data);
          }
        }
      }
    );
  }

  /**
   * Gửi cảnh báo
   */
  async sendAlert(sensorData) {
    try {
      console.log(
        `🚨 CẢNH BÁO: Ngập lụt nguy hiểm tại ${sensorData.location}!`
      );

      // Tạo cảnh báo bằng AI
      const generatedAlert = await geminiClient.generateFloodAlert(sensorData);

      // Gửi email cho tất cả người nhận
      for (const email of this.emailRecipients) {
        const emailResult = await emailService.sendAIFloodAlert(
          email.trim(),
          generatedAlert
        );
        if (emailResult.success) {
          console.log(`✉️ Đã gửi email cảnh báo tới ${email.trim()}`);
        }
      }

      // Lưu log vào Firebase
      await firebaseClient.writeData(`alerts/${Date.now()}`, {
        ...generatedAlert,
        sensorData,
        sentAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Lỗi gửi cảnh báo:", error.message);
    }
  }
}

module.exports = new IoTListener();
