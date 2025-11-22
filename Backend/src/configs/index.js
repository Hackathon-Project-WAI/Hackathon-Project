require("dotenv").config();

/**
 * Kiểm tra các biến môi trường bắt buộc
 */
function validateEnv() {
  const required = ["PORT", "EMAIL_USER", "EMAIL_PASS"];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.warn(`⚠️ Thiếu các biến môi trường: ${missing.join(", ")}`);
  }

  // Optional
  const optional = [
    "GEMINI_API_KEY",
    "OPENWEATHER_API_KEY",
    "FIREBASE_SERVICE_ACCOUNT_KEY",
    "FIREBASE_DATABASE_URL",
    "TELEGRAM_BOT_TOKEN",
  ];

  const missingOptional = optional.filter((key) => !process.env[key]);

  if (missingOptional.length > 0) {
    console.log(
      `ℹ️ Các tính năng sẽ bị giới hạn do thiếu: ${missingOptional.join(", ")}`
    );
  }
}

module.exports = {
  port: process.env.PORT || 4000,
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  emailFrom: process.env.EMAIL_FROM,
  geminiApiKey: process.env.GEMINI_API_KEY,
  openWeatherApiKey: process.env.OPENWEATHER_API_KEY,
  firebaseServiceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
  firebaseDatabaseURL: process.env.FIREBASE_DATABASE_URL,
  firebaseDbType: process.env.FIREBASE_DB_TYPE || "realtime",
  enableFirebaseListener: process.env.ENABLE_FIREBASE_LISTENER === "true",
  alertEmailRecipients: process.env.ALERT_EMAIL_RECIPIENTS
    ? process.env.ALERT_EMAIL_RECIPIENTS.split(",").map((e) => e.trim())
    : [],
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  validateEnv,
};
