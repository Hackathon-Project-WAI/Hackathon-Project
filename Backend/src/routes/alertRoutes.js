const express = require("express");
const alertController = require("../controllers/alertController");
const personalizedAlertController = require("../controllers/personalizedAlertController");
const alertSettingsController = require("../controllers/alertSettingsController");

const router = express.Router();

// Email routes
router.post(
  "/send-email",
  alertController.sendCustomEmail.bind(alertController)
);
router.post(
  "/send-test-email",
  alertController.sendTestEmail.bind(alertController)
);
router.post(
  "/send-flood-alert",
  alertController.sendFloodAlert.bind(alertController)
);
router.post(
  "/send-weather-update",
  alertController.sendWeatherUpdate.bind(alertController)
);

// AI alert generation
router.post(
  "/generate-flood-alert",
  alertController.generateFloodAlert.bind(alertController)
);

// Firebase + Alert
router.post(
  "/check-firebase-and-alert",
  alertController.checkFirebaseAndAlert.bind(alertController)
);
router.post(
  "/check-iot-data",
  alertController.checkIoTData.bind(alertController)
);

// ==========================================
// 🎯 PERSONALIZED ALERTS - User Locations
// ==========================================
router.post(
  "/check-user-locations-alert",
  personalizedAlertController.checkUserLocationsAlert.bind(
    personalizedAlertController
  )
);

router.get(
  "/user-locations/:userId",
  personalizedAlertController.getUserLocations.bind(personalizedAlertController)
);

router.post(
  "/analyze-weather-alert",
  personalizedAlertController.analyzeWeatherAlert.bind(
    personalizedAlertController
  )
);

// ✅ SENSOR-BASED ALERTS - Kiểm tra dựa trên sensor data
router.post(
  "/check-sensor-based-alert",
  personalizedAlertController.checkSensorBasedAlert.bind(
    personalizedAlertController
  )
);

// ==========================================
// 📧 PREMIUM EMAIL TEMPLATE - Test endpoint
// ==========================================
router.post("/send-premium-alert", async (req, res) => {
  try {
    const { to, alertData } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        error: "Thiếu email nhận (to)",
      });
    }

    const emailService = require("../email/emailService");

    // Default data nếu không có alertData
    const defaultAlertData = {
      location: "Đà Nẵng",
      riskLevel: "CAO",
      alertLevel: "Mức báo động 3",
      waterLevel_cm: 120,
      maxWaterLevel: 150,
      threshold: "Vượt mức an toàn 30cm",
      rateOfChange: "Nhanh",
      rateDetail: "+10cm / 5 phút",
      description: "RẤT NGUY HIỂM",
    };

    const finalAlertData = alertData || defaultAlertData;

    console.log("📧 Gửi Premium Alert đến:", to);
    console.log("📊 Alert Data:", finalAlertData);

    const result = await emailService.sendPremiumFloodAlert(to, finalAlertData);

    if (result.success) {
      return res.json({
        success: true,
        message: "Premium alert email đã được gửi thành công!",
        messageId: result.messageId,
        alertData: finalAlertData,
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("❌ Lỗi gửi premium alert:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==========================================
// ⚙️ ALERT SETTINGS - User Configuration
// ==========================================
// Lấy cấu hình cảnh báo
router.get(
  "/alert-settings/:userId",
  alertSettingsController.getAlertSettings.bind(alertSettingsController)
);

// Cập nhật cấu hình cảnh báo
router.put(
  "/alert-settings/:userId",
  alertSettingsController.updateAlertSettings.bind(alertSettingsController)
);

// Bật/tắt cảnh báo tự động
router.post(
  "/alert-settings/:userId/toggle",
  alertSettingsController.toggleAlertSettings.bind(alertSettingsController)
);

// Xóa cấu hình cảnh báo
router.delete(
  "/alert-settings/:userId",
  alertSettingsController.deleteAlertSettings.bind(alertSettingsController)
);

// Lấy lịch sử cảnh báo
router.get(
  "/alert-settings/:userId/logs",
  alertSettingsController.getAlertLogs.bind(alertSettingsController)
);

// Test gửi cảnh báo ngay
router.post(
  "/alert-settings/:userId/test",
  alertSettingsController.testAlert.bind(alertSettingsController)
);

// Lấy trạng thái scheduler
router.get(
  "/scheduler/status",
  alertSettingsController.getSchedulerStatus.bind(alertSettingsController)
);

module.exports = router;
