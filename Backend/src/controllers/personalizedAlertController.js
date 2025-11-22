const personalizedAlertService = require("../services/personalizedAlertService");
const sensorBasedAlertService = require("../services/sensorBasedAlertService");
const geminiClient = require("../integrations/geminiClient");
const emailService = require("../email/emailService");
const telegramAlertService = require("../services/telegramAlertService");

class PersonalizedAlertController {
  /**
   * POST /api/check-user-locations-alert
   * Kiểm tra tất cả địa điểm của user và gửi cảnh báo cá nhân hóa
   */
  async checkUserLocationsAlert(req, res) {
    try {
      const {
        userId,
        minRiskLevel = 1,
        sendEmail: shouldSendEmail = true,
      } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: "Thiếu userId",
        });
      }

      console.log(`🔍 Đang phân tích địa điểm cho user: ${userId}`);

      // 1. Phân tích tất cả địa điểm của user
      const analysis = await personalizedAlertService.analyzeUserLocations(
        userId,
        minRiskLevel
      );

      if (analysis.affectedLocations === 0) {
        return res.json({
          success: true,
          message: "Tất cả địa điểm của bạn đều an toàn",
          ...analysis,
        });
      }

      console.log(
        `⚠️ Phát hiện ${analysis.affectedLocations}/${analysis.totalLocations} địa điểm có nguy cơ ngập`
      );

      // 2. Tạo cảnh báo AI cho từng địa điểm
      const emailResults = [];

      for (const alert of analysis.alerts) {
        try {
          // Tạo prompt cá nhân hóa
          const aiPrompt =
            personalizedAlertService.createPersonalizedPrompt(
              analysis.user,
              alert
            );

          // Gọi Gemini AI
          const generatedAlert = await geminiClient.generateStructuredContent(
            aiPrompt,
            {
              type: "object",
              properties: {
                subject: { type: "string" },
                htmlBody: { type: "string" },
              },
              required: ["subject", "htmlBody"],
            }
          );

          console.log(
            `✅ AI tạo cảnh báo cho "${alert.location.name}":`,
            generatedAlert.subject
          );

          // Gửi email nếu được yêu cầu
          let emailResult = { success: false };
          if (shouldSendEmail && analysis.user.email) {
            emailResult = await emailService.sendAIFloodAlert(
              analysis.user.email,
              generatedAlert
            );
          }

          // Lưu log
          await personalizedAlertService.saveAlertLog(userId, alert, {
            ...emailResult,
            subject: generatedAlert.subject,
          });

          // Cập nhật status location
          const statusMap = {
            0: "safe",
            1: "warning",
            2: "danger",
            3: "critical",
          };
          await personalizedAlertService.updateLocationStatus(
            userId,
            alert.location.id,
            statusMap[alert.prediction.floodRisk] || "warning",
            new Date().toISOString()
          );

          emailResults.push({
            locationName: alert.location.name,
            alert: generatedAlert,
            emailSent: emailResult.success,
            distance: alert.distance,
            floodRisk: alert.prediction.floodRisk,
          });
        } catch (error) {
          console.error(
            `❌ Lỗi tạo cảnh báo cho ${alert.location.name}:`,
            error.message
          );
          emailResults.push({
            locationName: alert.location.name,
            error: error.message,
            emailSent: false,
          });
        }
      }

      return res.json({
        success: true,
        message: `Đã tạo ${emailResults.length} cảnh báo cá nhân hóa`,
        analysis: {
          userId: analysis.userId,
          user: analysis.user,
          totalLocations: analysis.totalLocations,
          affectedLocations: analysis.affectedLocations,
        },
        alerts: emailResults,
      });
    } catch (error) {
      console.error("❌ Lỗi check user locations:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/user-locations/:userId
   * Lấy danh sách địa điểm của user
   */
  async getUserLocations(req, res) {
    try {
      const { userId } = req.params;

      const locations =
        await personalizedAlertService.getUserLocations(userId);

      return res.json({
        success: true,
        userId: userId,
        count: locations.length,
        locations: locations,
      });
    } catch (error) {
      console.error("❌ Lỗi lấy user locations:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/analyze-weather-alert
   * Phân tích thời tiết theo LƯỢNG MƯA 24H + gửi cảnh báo AI
   */
  async analyzeWeatherAlert(req, res) {
    try {
      const {
        lat,
        lon,
        to,
        userId,
        locationName,
      } = req.body || {};

      const latitude =
        typeof lat === "string" ? Number.parseFloat(lat) : Number(lat);
      const longitude =
        typeof lon === "string" ? Number.parseFloat(lon) : Number(lon);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return res.status(400).json({
          success: false,
          error: "Thiếu hoặc sai định dạng lat/lon",
        });
      }

      const weatherService = require("../services/weatherService");
      const rainfallAnalysisService = require("../services/rainfallAnalysisService");

      // 1. Lấy dự báo thời tiết
      const hourlyForecast = await weatherService.getHourlyForecast(
        latitude,
        longitude
      );

      if (!hourlyForecast.length) {
        return res.status(502).json({
          success: false,
          error:
            "Không nhận được dữ liệu dự báo từ OpenWeather. Vui lòng thử lại sau.",
        });
      }

      // 2. Phân tích theo LƯỢNG MƯA 24H (Mưa vừa, Mưa to, Mưa rất to, Mưa đặc biệt to)
      const analysis = rainfallAnalysisService.analyzeWeatherForecast(
        hourlyForecast,
        {
          lat: latitude,
          lon: longitude,
          name: locationName || "Khu vực của bạn",
        }
      );

      console.log(`📊 Phân tích mưa 24h:`, {
        rainfall24h: analysis.rainfall.total24h + 'mm',
        level: analysis.classification.name,
        alertLevel: analysis.classification.alertLevel,
      });

      // 3. Kiểm tra có cần cảnh báo không (từ "Mưa to" trở lên)
      if (!analysis.alert.shouldAlert) {
        return res.json({
          success: true,
          message: `Lượng mưa dự báo (${analysis.rainfall.total24h}mm) trong ngưỡng an toàn. Không cần cảnh báo.`,
          analysis: {
            rainfall: analysis.rainfall,
            classification: analysis.classification,
            location: analysis.location,
          },
        });
      }

      console.log(`⚠️ Kích hoạt cảnh báo: ${analysis.classification.name}`);

      // 4. Lấy thông tin user (nếu có userId)
      let user = { name: "Bạn", email: to };
      
      if (userId) {
        try {
          const admin = require("firebase-admin");
          const authUser = await admin.auth().getUser(userId);
          user.name = authUser.displayName || authUser.email?.split('@')[0] || "Bạn";
          user.email = authUser.email || to;
        } catch (error) {
          console.log(`⚠️ Không lấy được user info: ${error.message}`);
        }
      }

      // 5. Tạo prompt AI theo phân loại mưa
      const aiPrompt = rainfallAnalysisService.createAIPrompt(analysis, user);

      const generatedAlert = await geminiClient.generateStructuredContent(
        aiPrompt,
        {
          type: "object",
          properties: {
            subject: { type: "string" },
            htmlBody: { type: "string" },
          },
          required: ["subject", "htmlBody"],
        }
      );

      console.log(
        `✅ Gemini AI tạo cảnh báo (${analysis.classification.name}):`,
        generatedAlert.subject || "(không có subject)"
      );

      console.log(
        `✅ Gemini AI tạo cảnh báo (${analysis.classification.name}):`,
        generatedAlert.subject || "(không có subject)"
      );

      // 6. Gửi email (nếu có địa chỉ)
      const recipientList = to
        ? Array.isArray(to)
          ? to
          : [to]
        : user.email
        ? [user.email]
        : [];

      const emailResults = [];
      for (const recipient of recipientList) {
        const trimmed = recipient.trim();
        if (!trimmed) continue;

        try {
          const emailResult = await emailService.sendAIFloodAlert(
            trimmed,
            generatedAlert
          );
          emailResults.push({ to: trimmed, ...emailResult });
        } catch (error) {
          emailResults.push({
            to: trimmed,
            success: false,
            error: error.message,
          });
        }
      }

      if (!recipientList.length) {
        console.warn(
          "⚠️ Không có email nhận cảnh báo. Truyền 'to' hoặc 'userId' trong request."
        );
      }

      return res.json({
        success: true,
        alert: generatedAlert,
        analysis: {
          location: analysis.location,
          rainfall: analysis.rainfall,
          classification: analysis.classification,
          alertInfo: analysis.alert,
        },
        emails: emailResults,
      });
    } catch (error) {
      console.error("❌ Lỗi phân tích thời tiết bằng AI:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
        fallback: {
          subject: "⚠️ CẢNH BÁO NGUY CƠ NGẬP LỤT",
          htmlBody: `<p>Không thể tạo email AI. Vui lòng theo dõi sát tình hình thời tiết tại khu vực của bạn.</p>`,
        },
      });
    }
  }

  /**
   * POST /api/check-sensor-based-alert
   * Kiểm tra cảnh báo dựa trên SENSOR DATA (không dùng weather forecast)
   */
  async checkSensorBasedAlert(req, res) {
    try {
      const {
        userId,
        sendEmail: shouldSendEmail = true,
      } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: "Thiếu userId",
        });
      }

      console.log(`🔍 [SENSOR-BASED] Đang phân tích cho user: ${userId}`);

      // 1. Phân tích với sensor data
      const analysis = await sensorBasedAlertService.analyzeUserLocations(userId);

      console.log(`📊 Kết quả: ${analysis.affectedLocations}/${analysis.totalLocations} locations bị ảnh hưởng`);

      if (analysis.affectedLocations === 0) {
        return res.json({
          success: true,
          message: "Tất cả địa điểm của bạn đều an toàn",
          ...analysis,
        });
      }

      console.log(
        `⚠️ Phát hiện ${analysis.affectedLocations} cảnh báo từ sensors!`
      );

      // 2. Gom alerts theo location (tránh spam nhiều emails cho cùng 1 location)
      const locationAlertsMap = {};
      
      for (const alert of analysis.alerts) {
        const locId = alert.location.id;
        if (!locationAlertsMap[locId]) {
          locationAlertsMap[locId] = {
            location: alert.location,
            sensors: []
          };
        }
        locationAlertsMap[locId].sensors.push(alert.sensor);
      }

      console.log(`📧 Sẽ gửi ${Object.keys(locationAlertsMap).length} email (1 email/location)`);

      // 3. Tạo cảnh báo AI cho từng location (gom tất cả sensors)
      const emailResults = [];

      for (const [locId, data] of Object.entries(locationAlertsMap)) {
        try {
          const { location, sensors } = data;
          
          // Tạo prompt với TẤT CẢ sensors của location này
          const aiPrompt = sensorBasedAlertService.createPersonalizedPromptMultipleSensors(
            analysis.user,
            location,
            sensors
          );

          console.log(`🤖 Đang tạo cảnh báo AI cho "${location.name}" (${sensors.length} sensors)...`);

          // Gọi Gemini AI
          const generatedAlert = await geminiClient.generateStructuredContent(
            aiPrompt,
            {
              type: "object",
              properties: {
                subject: { type: "string" },
                htmlBody: { type: "string" },
              },
              required: ["subject", "htmlBody"],
            }
          );

          console.log(
            `✅ AI tạo cảnh báo: ${generatedAlert.subject}`
          );

          // Gửi email + Telegram SONG SONG (parallel)
          let emailResult = { success: false };
          let telegramResult = { success: false, skipped: true };
          
          if (shouldSendEmail && analysis.user.email) {
            console.log(`📤 Đang gửi cảnh báo song song: Email + Telegram...`);
            
            // Gửi song song với Promise.allSettled
            const alertResult = await telegramAlertService.sendAlertWithEmail(
              userId,
              { sensors: sensors }, // Alert data
              location,
              analysis.user,
              async () => {
                // Email send function
                return await emailService.sendAIFloodAlert(
                  analysis.user.email,
                  generatedAlert
                );
              }
            );

            emailResult = alertResult.email.result;
            telegramResult = alertResult.telegram.result;

            console.log(`⏱️ Hoàn thành trong ${alertResult.totalTime}ms`);
            console.log(`📧 Email: ${emailResult.success ? '✅ Thành công' : '❌ Thất bại'}`);
            console.log(`📱 Telegram: ${telegramResult.success ? '✅ Thành công' : telegramResult.skipped ? '⏭️ Bỏ qua' : '❌ Thất bại'}`);
          }

          // Lưu log vào Firebase (1 record cho location, list tất cả sensors)
          const db = require("firebase-admin").database();
          const alertRef = db.ref(`userProfiles/${userId}/sensorAlerts`).push();
          
          await alertRef.set({
            locationId: location.id,
            locationName: location.name,
            sensorsCount: sensors.length,
            sensors: sensors.map(s => ({
              sensorId: s.sensorId,
              sensorName: s.sensorName,
              distance: s.distance,
              waterLevel: s.waterLevel,
              waterPercent: s.waterPercent,
              floodStatus: s.floodStatus,
            })),
            emailSent: emailResult.success,
            emailSubject: generatedAlert.subject || null,
            telegramSent: telegramResult.success || false,
            telegramSkipped: telegramResult.skipped || false,
            telegramChatId: telegramResult.chatId || null,
            telegramMessageId: telegramResult.messageId || null,
            createdAt: Date.now(),
            isRead: false,
          });

          emailResults.push({
            locationName: location.name,
            sensorsCount: sensors.length,
            sensors: sensors,
            alert: generatedAlert,
            emailSent: emailResult.success,
            telegramSent: telegramResult.success || false,
            telegramSkipped: telegramResult.skipped || false,
          });
        } catch (error) {
          console.error(
            `❌ Lỗi tạo cảnh báo cho ${data.location.name}:`,
            error.message
          );
          emailResults.push({
            locationName: alert.location.name,
            error: error.message,
            emailSent: false,
          });
        }
      }

      return res.json({
        success: true,
        message: `Đã tạo ${emailResults.length} cảnh báo từ sensor data`,
        analysis: {
          userId: analysis.userId,
          user: analysis.user,
          totalLocations: analysis.totalLocations,
          affectedLocations: analysis.affectedLocations,
        },
        alerts: emailResults,
      });
    } catch (error) {
      console.error("❌ Lỗi check sensor-based alert:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new PersonalizedAlertController();

