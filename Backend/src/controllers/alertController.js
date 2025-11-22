const emailService = require("../email/emailService");
const geminiClient = require("../integrations/geminiClient");
const firebaseClient = require("../integrations/firebaseClient");

class AlertController {
  /**
   * POST /api/send-test-email
   * Gửi email test
   */
  async sendTestEmail(req, res) {
    try {
      const { to } = req.body;

      if (!to) {
        return res.status(400).json({
          success: false,
          message: "Missing required field: to",
        });
      }

      const result = await emailService.sendTestEmail(to);

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  /**
   * POST /api/send-email
   * Gửi email tùy chỉnh
   */
  async sendCustomEmail(req, res) {
    try {
      const { to, subject, html, text } = req.body;

      if (!to || !subject) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: to, subject",
        });
      }

      const result = await emailService.sendEmail(to, subject, html, text);

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  /**
   * POST /api/send-flood-alert
   * Gửi cảnh báo lũ lụt
   */
  async sendFloodAlert(req, res) {
    try {
      const { to, alertData } = req.body;

      if (!to) {
        return res.status(400).json({
          success: false,
          message: "Missing required field: to",
        });
      }

      const result = await emailService.sendFloodAlert(to, alertData || {});

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  /**
   * POST /api/send-weather-update
   * Gửi cập nhật thời tiết
   */
  async sendWeatherUpdate(req, res) {
    try {
      const { to, weatherData } = req.body;

      if (!to) {
        return res.status(400).json({
          success: false,
          message: "Missing required field: to",
        });
      }

      const result = await emailService.sendWeatherUpdate(
        to,
        weatherData || {}
      );

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  /**
   * POST /api/generate-flood-alert
   * Tạo cảnh báo ngập lụt bằng AI
   */
  async generateFloodAlert(req, res) {
    try {
      const { current_percent, previous_percent, location, timestamp, to } =
        req.body;

      if (!current_percent || !location) {
        return res.status(400).json({
          success: false,
          error: "Thiếu dữ liệu: current_percent hoặc location",
        });
      }

      // Tạo cảnh báo bằng Gemini AI
      const generatedAlert = await geminiClient.generateFloodAlert({
        current_percent,
        previous_percent,
        location,
        timestamp,
      });

      console.log("✅ Gemini AI generated alert:", generatedAlert.subject);

      // Nếu có email, gửi luôn
      if (to) {
        const emailResult = await emailService.sendAIFloodAlert(
          to,
          generatedAlert
        );

        if (emailResult.success) {
          return res.json({
            success: true,
            message: "AI alert generated and email sent successfully",
            alert: generatedAlert,
            emailResult: emailResult,
          });
        } else {
          return res.json({
            success: true,
            message: "AI alert generated but email failed",
            alert: generatedAlert,
            emailError: emailResult.error,
          });
        }
      }

      // Không có email, chỉ trả về nội dung AI đã tạo
      res.json({
        success: true,
        alert: generatedAlert,
      });
    } catch (error) {
      console.error("❌ Lỗi gọi Gemini API:", error);

      res.status(500).json({
        success: false,
        error: "Không thể tạo cảnh báo bằng AI",
        details: error.message,
        fallback: {
          subject: "⚠️ CẢNH BÁO NGẬP LỤT KHẨN CẤP",
          htmlBody: `<b>Cảnh báo ngập lụt tại ${
            req.body.location || "khu vực của bạn"
          }</b><br><br>Mức ngập: ${
            req.body.current_percent
          }%<br><br>Vui lòng theo dõi tình hình và giữ an toàn.`,
        },
      });
    }
  }

  /**
   * POST /api/check-firebase-and-alert
   * Đọc dữ liệu từ Firebase và gửi cảnh báo
   */
  async checkFirebaseAndAlert(req, res) {
    try {
      const { sensorId, to } = req.body;

      if (!sensorId) {
        return res.status(400).json({
          success: false,
          error: "Thiếu sensorId",
        });
      }

      // Đọc dữ liệu từ Firebase
      const sensorData = await firebaseClient.readData(
        `sensors/flood/${sensorId}`
      );

      if (!sensorData) {
        return res.status(404).json({
          success: false,
          error: "Sensor không tìm thấy trong Firebase",
        });
      }

      console.log(`📊 Dữ liệu từ Firebase sensor ${sensorId}:`, sensorData);

      // Kiểm tra ngưỡng nguy hiểm
      if (sensorData.current_percent >= 80) {
        console.log(
          `🚨 CẢNH BÁO: Ngập lụt nguy hiểm tại ${sensorData.location}!`
        );

        // Tạo cảnh báo bằng Gemini AI
        const generatedAlert = await geminiClient.generateFloodAlert(
          sensorData
        );

        // Gửi email
        const emailTo = to || process.env.ALERT_EMAIL_RECIPIENTS;
        if (emailTo) {
          const recipients =
            typeof emailTo === "string" ? emailTo.split(",") : [emailTo];

          for (const email of recipients) {
            const emailResult = await emailService.sendAIFloodAlert(
              email.trim(),
              generatedAlert
            );
            if (emailResult.success) {
              console.log(`✉️ Đã gửi email cảnh báo tới ${email.trim()}`);
            }
          }
        }

        // Lưu log vào Firebase
        await firebaseClient.writeData(`alerts/${sensorId}/${Date.now()}`, {
          ...generatedAlert,
          sensorData,
          sentAt: new Date().toISOString(),
        });

        return res.json({
          success: true,
          message: "Alert generated and email sent",
          alert: generatedAlert,
          sensorData,
        });
      } else {
        return res.json({
          success: true,
          message: "Water level is safe",
          sensorData,
        });
      }
    } catch (error) {
      console.error("❌ Lỗi:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/check-iot-data
   * Kiểm tra dữ liệu IoT
   */
  async checkIoTData(req, res) {
    try {
      const { sensorId } = req.body;

      if (!sensorId) {
        return res.status(400).json({
          success: false,
          error: "Thiếu sensorId (SENSOR_ROAD hoặc SENSOR_SEWER)",
        });
      }

      // Đọc dữ liệu từ iotData/SENSOR_ROAD hoặc iotData/SENSOR_SEWER
      const iotData = await firebaseClient.readData(`iotData/${sensorId}`);

      if (!iotData) {
        return res.status(404).json({
          success: false,
          error: "Không tìm thấy dữ liệu IoT trong Firebase",
        });
      }

      console.log("📊 Dữ liệu IoT từ Firebase:", iotData);

      // Chuyển đổi water_level_cm sang phần trăm
      const maxWaterLevel = 100;
      const currentPercent = Math.round(
        (iotData.water_level_cm / maxWaterLevel) * 100
      );

      // Kiểm tra ngưỡng nguy hiểm
      if (currentPercent >= 80 || iotData.flood_status === "DANGER") {
        console.log(
          `🚨 CẢNH BÁO: Mức nước ${iotData.water_level_cm}cm (${currentPercent}%)`
        );

        // Tạo cảnh báo bằng Gemini AI
        const generatedAlert = await geminiClient.generateFloodAlert({
          water_level_cm: iotData.water_level_cm,
          flood_status: iotData.flood_status,
          current_percent: currentPercent,
        });

        // Gửi email
        const emailRecipients = process.env.ALERT_EMAIL_RECIPIENTS.split(",");
        for (const email of emailRecipients) {
          const emailResult = await emailService.sendAIFloodAlert(
            email.trim(),
            generatedAlert
          );
          if (emailResult.success) {
            console.log(`✉️ Đã gửi email cảnh báo tới ${email.trim()}`);
          }
        }

        // Lưu log vào Firebase
        await firebaseClient.writeData(`alerts/iot_alert_${Date.now()}`, {
          ...generatedAlert,
          iotData,
          sentAt: new Date().toISOString(),
        });

        return res.json({
          success: true,
          message: "Alert generated and email sent",
          alert: generatedAlert,
          iotData: {
            ...iotData,
            current_percent: currentPercent,
          },
        });
      } else {
        return res.json({
          success: true,
          message: `Water level is safe: ${iotData.water_level_cm}cm (${currentPercent}%)`,
          iotData: {
            ...iotData,
            current_percent: currentPercent,
          },
        });
      }
    } catch (error) {
      console.error("❌ Lỗi:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new AlertController();
