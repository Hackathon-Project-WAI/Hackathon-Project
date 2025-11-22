const express = require("express");
const config = require("./configs");
const routes = require("./routes");
const {
  corsMiddleware,
  errorHandler,
  requestLogger,
} = require("./utils/middleware");
const firebaseClient = require("./integrations/firebaseClient");
const iotListener = require("./iot/iotListener");
const schedulerService = require("./services/schedulerService");
const telegramBot = require("./integrations/telegramBotListener");

// Validate environment variables
config.validateEnv();

const app = express();

// Middleware
app.use(express.json());
app.use(corsMiddleware);
app.use(requestLogger);

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "🌊 Flood Alert API is running!",
    version: "2.1.0",
    endpoints: {
      health: "GET /",
      testEmail: "POST /api/send-test-email",
      floodAlert: "POST /api/send-flood-alert",
      generateAIAlert: "POST /api/generate-flood-alert",
      checkFirebase: "POST /api/check-firebase-and-alert",
      checkIoT: "POST /api/check-iot-data",
      sensors: "GET /api/firebase/sensors",
      // Personalized Alerts
      checkUserLocations: "POST /api/check-user-locations-alert",
      getUserLocations: "GET /api/user-locations/:userId",
      analyzeWeather: "POST /api/analyze-weather-alert",
      // Alert Settings
      getAlertSettings: "GET /api/alert-settings/:userId",
      updateAlertSettings: "PUT /api/alert-settings/:userId",
      toggleAlertSettings: "POST /api/alert-settings/:userId/toggle",
      deleteAlertSettings: "DELETE /api/alert-settings/:userId",
      getAlertLogs: "GET /api/alert-settings/:userId/logs",
      testAlert: "POST /api/alert-settings/:userId/test",
      schedulerStatus: "GET /api/scheduler/status",
    },
  });
});

// Mount API routes
app.use(routes);

// Error handler
app.use(errorHandler);

// ==========================================
// 🔥 FIREBASE INITIALIZATION
// ==========================================
// Luôn khởi tạo Firebase nếu có cấu hình (cho API endpoints)
if (config.firebaseServiceAccountKey && config.firebaseDatabaseURL) {
  try {
    firebaseClient.initialize();

    // Nếu bật listener, start listening
    if (config.enableFirebaseListener) {
      iotListener.start(config.alertEmailRecipients);
      console.log("🔥 Firebase IoT Listener đã bật");
    }

    // ==========================================
    // ⏰ SCHEDULER SERVICE - Auto Alert
    // ==========================================
    // Khởi động scheduler service để tự động check và gửi cảnh báo
    schedulerService.start().catch((error) => {
      console.error("❌ Lỗi khởi động Scheduler Service:", error);
    });

    // ==========================================
    // 📱 TELEGRAM BOT LISTENER
    // ==========================================
    // Khởi động Telegram bot để lắng nghe người dùng đăng ký
    if (config.telegramBotToken) {
      console.log("📱 Đang khởi động Telegram Bot Listener...");
      telegramBot.start(config.telegramBotToken).catch((error) => {
        console.error("❌ Lỗi khởi động Telegram Bot:", error.message);
      });
    } else {
      console.log("⚠️ Telegram Bot chưa cấu hình (thiếu TELEGRAM_BOT_TOKEN)");
    }
  } catch (error) {
    console.error("❌ Firebase initialization failed:", error.message);
    console.log(
      "💡 Tip: Kiểm tra FIREBASE_SERVICE_ACCOUNT_KEY và FIREBASE_DATABASE_URL trong .env"
    );
  }
} else {
  console.log(
    "ℹ️ Firebase chưa cấu hình. Các API Firebase sẽ không hoạt động."
  );
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n👋 SIGTERM received. Shutting down gracefully...");
  schedulerService.stop();
  telegramBot.stop();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n👋 SIGINT received. Shutting down gracefully...");
  schedulerService.stop();
  telegramBot.stop();
  process.exit(0);
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`\n🚀 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/\n`);
});

module.exports = app;
