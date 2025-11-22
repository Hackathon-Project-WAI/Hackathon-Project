const express = require("express");
const {
  sendEmail,
  sendFloodAlert,
  sendWeatherUpdate,
  sendAIFloodAlert,
} = require("./emailService");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const {
  initializeFirebase,
  listenToFloodSensors,
  listenToFirestoreFloodSensors,
} = require("./firebaseAdmin");
const weatherService = require("./services/weatherService");
const floodPredictionService = require("./services/floodPredictionService");
const personalizedAlertService = require("./services/personalizedAlertService");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Khởi tạo Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ==========================================
// 🔥 FIREBASE IOT LISTENER - Tự động gửi cảnh báo
// ==========================================
if (process.env.ENABLE_FIREBASE_LISTENER === "true") {
  try {
    initializeFirebase();

    // Lấy danh sách email nhận cảnh báo từ .env
    const emailRecipients = process.env.ALERT_EMAIL_RECIPIENTS
      ? process.env.ALERT_EMAIL_RECIPIENTS.split(",").map((e) => e.trim())
      : [];

    if (emailRecipients.length > 0) {
      console.log(`📧 Email recipients: ${emailRecipients.join(", ")}`);
    } else {
      console.log("⚠️ Chưa cấu hình ALERT_EMAIL_RECIPIENTS trong .env");
    }

    // Chọn loại database: Realtime Database hoặc Firestore
    if (process.env.FIREBASE_DB_TYPE === "firestore") {
      listenToFirestoreFloodSensors(emailRecipients);
    } else {
      listenToFloodSensors(emailRecipients);
    }
  } catch (error) {
    console.error("❌ Firebase Listener failed:", error.message);
    console.log(
      "💡 Tip: Tắt Firebase Listener bằng ENABLE_FIREBASE_LISTENER=false nếu không cần"
    );
  }
} else {
  console.log(
    "ℹ️ Firebase Listener tắt. IoT device có thể POST trực tiếp lên /api/generate-flood-alert"
  );
}

// Middleware
app.use(express.json());

// CORS middleware (cho phép frontend gọi API)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Route test
app.get("/", (req, res) => {
  res.json({ message: "Email Service API is running!" });
});

// Route gửi email thông thường (có thể custom)
app.post("/api/send-email", async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;

    if (!to || !subject) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: to, subject",
      });
    }

    const result = await sendEmail(to, subject, html, text);

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
});

// Route gửi email test nhanh (chỉ cần email)
app.post("/api/send-test-email", async (req, res) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: to",
      });
    }

    const subject = "🌤️ Test Email từ Hệ thống Cảnh báo Thời tiết";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">🌤️ Email Test Thành Công!</h1>
        </div>
        <div style="background-color: white; padding: 20px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
          <p style="font-size: 16px; color: #333;">Xin chào!</p>
          <p style="color: #666;">Đây là email test từ hệ thống cảnh báo thời tiết Đà Nẵng.</p>
          <p style="color: #666;">Thời gian: ${new Date().toLocaleString(
            "vi-VN"
          )}</p>
          <div style="background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #1565c0;">✅ Hệ thống email đang hoạt động bình thường!</p>
          </div>
        </div>
      </div>
    `;

    const result = await sendEmail(to, subject, html);

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
});

// Route gửi cảnh báo lũ lụt
app.post("/api/send-flood-alert", async (req, res) => {
  try {
    const { to, alertData } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: to",
      });
    }

    const result = await sendFloodAlert(to, alertData || {});

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
});

// Route gửi cập nhật thời tiết
app.post("/api/send-weather-update", async (req, res) => {
  try {
    const { to, weatherData } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: to",
      });
    }

    const result = await sendWeatherUpdate(to, weatherData || {});

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
});

// ==========================================
// 📊 ĐỌC DỮ LIỆU TỪ FIREBASE - Simple REST API
// ==========================================
const { readFirebaseData, writeFirebaseData } = require("./simpleFirebase");

// Endpoint để đọc tất cả sensors từ Firebase
app.get("/api/firebase/sensors", async (req, res) => {
  try {
    const data = await readFirebaseData("sensors/flood");
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint để đọc 1 sensor cụ thể từ Firebase
app.get("/api/firebase/sensors/:sensorId", async (req, res) => {
  try {
    const { sensorId } = req.params;
    const data = await readFirebaseData(`sensors/flood/${sensorId}`);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: IoT device gọi API này, Backend sẽ đọc Firebase và gửi email
app.post("/api/check-firebase-and-alert", async (req, res) => {
  try {
    const { sensorId, to } = req.body;

    if (!sensorId) {
      return res.status(400).json({
        success: false,
        error: "Thiếu sensorId",
      });
    }

    // Đọc dữ liệu từ Firebase
    const sensorData = await readFirebaseData(`sensors/flood/${sensorId}`);

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
      const floodAlertPrompt = `
Bạn là một hệ thống Trí tuệ Nhân tạo chuyên biệt trong việc tạo ra các thông báo cảnh báo ngập lụt khẩn cấp, có tính hành động. Nhiệm vụ của bạn là phân tích dữ liệu cảm biến thô và tạo ra một EMAIL CẢNH BÁO.

Dữ liệu quan trắc mới nhất:
- Vị trí Trạm: ${sensorData.location}
- Mức ngập HIỆN TẠI (So với ống cống/đường): ${sensorData.current_percent}%
- Mức ngập trước đó 5 phút: ${
        sensorData.previous_percent || "Không có dữ liệu"
      }%
- Ngưỡng Nguy hiểm Cao (Đỏ): 80%
- Ngưỡng Cảnh báo Trung bình (Vàng): 60%
- Thời điểm đo: ${sensorData.timestamp || new Date().toLocaleString("vi-VN")}

YÊU CẦU ĐẦU RA:
1. Xác định CẤP ĐỘ NGUY HIỂM (Thấp/Trung bình/Cao) và TỐC ĐỘ Nước TĂNG (Nhanh/Chậm/Ổn định).
2. Nội dung Email (Body): Dưới 150 từ, sử dụng ngôn ngữ khẩn cấp, có cấu trúc **HTML đơn giản** (dùng <b>, <br>, <ul>, <li>), và **KHÔNG DÙNG Markdown**.
3. Đưa ra **HÀNH ĐỘNG CỤ THỂ** theo cấp độ nguy hiểm (ví dụ: Di dời tài sản, Tránh tuyến đường).
4. Hãy sử dụng tiếng Việt chuẩn.

FORMAT BẮT BUỘC: Trả về **DUY NHẤT** một đối tượng JSON với 2 trường: subject và htmlBody.
`;

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
      });

      // Cập nhật prompt để yêu cầu JSON format rõ ràng hơn
      const jsonPrompt =
        floodAlertPrompt +
        `\n\nTrả về ĐÚNG format JSON này (không có markdown, không có \`\`\`json):\n{\n  "subject": "tiêu đề email",\n  "htmlBody": "nội dung HTML"\n}`;

      const result = await model.generateContent(jsonPrompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON từ response (bỏ markdown code block nếu có)
      let generatedAlert;
      try {
        // Thử parse trực tiếp
        generatedAlert = JSON.parse(text);
      } catch (e) {
        // Nếu có ```json wrapper, bỏ nó đi
        const jsonMatch =
          text.match(/```json\n?([\s\S]*?)\n?```/) ||
          text.match(/```\n?([\s\S]*?)\n?```/);
        if (jsonMatch) {
          generatedAlert = JSON.parse(jsonMatch[1]);
        } else {
          throw new Error("Không thể parse JSON từ Gemini response");
        }
      }

      console.log("✅ Gemini AI generated alert:", generatedAlert.subject);

      // Gửi email
      const emailTo = to || process.env.ALERT_EMAIL_RECIPIENTS;
      if (emailTo) {
        const recipients =
          typeof emailTo === "string" ? emailTo.split(",") : [emailTo];

        for (const email of recipients) {
          const emailResult = await sendAIFloodAlert(
            email.trim(),
            generatedAlert
          );
          if (emailResult.success) {
            console.log(`✉️ Đã gửi email cảnh báo tới ${email.trim()}`);
          }
        }
      }

      // Lưu log vào Firebase
      await writeFirebaseData(`alerts/${sensorId}/${Date.now()}`, {
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
});

// ==========================================
// 🔧 ĐỌC CẤU TRÚC IOT (iotData/SENSOR_ROAD hoặc SENSOR_SEWER)
// ==========================================
app.post("/api/check-iot-data", async (req, res) => {
  try {
    const { sensorId } = req.body; // "SENSOR_ROAD" hoặc "SENSOR_SEWER"

    if (!sensorId) {
      return res.status(400).json({
        success: false,
        error: "Thiếu sensorId (SENSOR_ROAD hoặc SENSOR_SEWER)",
      });
    }

    console.log("🔍 FIREBASE_DATABASE_URL:", process.env.FIREBASE_DATABASE_URL);
    console.log("🔍 Sensor ID:", sensorId);
    console.log("🔍 Path:", `iotData/${sensorId}`);

    // Đọc dữ liệu từ iotData/SENSOR_ROAD hoặc iotData/SENSOR_SEWER
    const iotData = await readFirebaseData(`iotData/${sensorId}`);

    if (!iotData) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy dữ liệu IoT trong Firebase",
      });
    }

    console.log("📊 Dữ liệu IoT từ Firebase:", iotData);

    // Chuyển đổi water_level_cm sang phần trăm (giả sử max = 100cm)
    const maxWaterLevel = 100; // cm
    const currentPercent = Math.round(
      (iotData.water_level_cm / maxWaterLevel) * 100
    );

    // Kiểm tra ngưỡng nguy hiểm
    if (currentPercent >= 80 || iotData.flood_status === "DANGER") {
      console.log(
        `🚨 CẢNH BÁO: Mức nước ${iotData.water_level_cm}cm (${currentPercent}%)`
      );

      // Tạo cảnh báo bằng Gemini AI
      const floodAlertPrompt = `
Bạn là một hệ thống Trí tuệ Nhân tạo chuyên biệt trong việc tạo ra các thông báo cảnh báo ngập lụt khẩn cấp, có tính hành động.

Dữ liệu quan trắc mới nhất:
- Trạng thái: ${iotData.flood_status}
- Mức nước hiện tại: ${iotData.water_level_cm} cm (${currentPercent}%)
- Ngưỡng Nguy hiểm Cao: 80cm
- Thời điểm đo: ${new Date().toLocaleString("vi-VN")}

YÊU CẦU ĐẦU RA:
1. Xác định CẤP ĐỘ NGUY HIỂM (Thấp/Trung bình/Cao).
2. Nội dung Email (Body): Dưới 150 từ, sử dụng ngôn ngữ khẩn cấp, có cấu trúc **HTML đơn giản** (dùng <b>, <br>, <ul>, <li>), và **KHÔNG DÙNG Markdown**.
3. Đưa ra **HÀNH ĐỘNG CỤ THỂ** theo cấp độ nguy hiểm.
4. Hãy sử dụng tiếng Việt chuẩn.

FORMAT BẮT BUỘC: Trả về **DUY NHẤT** một đối tượng JSON với 2 trường: subject và htmlBody.
`;

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
      });

      // Cập nhật prompt để yêu cầu JSON format rõ ràng hơn
      const jsonPrompt =
        floodAlertPrompt +
        `\n\nTrả về ĐÚNG format JSON này (không có markdown, không có \`\`\`json):\n{\n  "subject": "tiêu đề email",\n  "htmlBody": "nội dung HTML"\n}`;

      const result = await model.generateContent(jsonPrompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON từ response (bỏ markdown code block nếu có)
      let generatedAlert;
      try {
        // Thử parse trực tiếp
        generatedAlert = JSON.parse(text);
      } catch (e) {
        // Nếu có ```json wrapper, bỏ nó đi
        const jsonMatch =
          text.match(/```json\n?([\s\S]*?)\n?```/) ||
          text.match(/```\n?([\s\S]*?)\n?```/);
        if (jsonMatch) {
          generatedAlert = JSON.parse(jsonMatch[1]);
        } else {
          throw new Error("Không thể parse JSON từ Gemini response");
        }
      }

      console.log("✅ Gemini AI generated alert:", generatedAlert.subject);

      // Gửi email
      const emailRecipients = process.env.ALERT_EMAIL_RECIPIENTS.split(",");
      for (const email of emailRecipients) {
        const emailResult = await sendAIFloodAlert(
          email.trim(),
          generatedAlert
        );
        if (emailResult.success) {
          console.log(`✉️ Đã gửi email cảnh báo tới ${email.trim()}`);
        }
      }

      // Lưu log vào Firebase
      await writeFirebaseData(`alerts/iot_alert_${Date.now()}`, {
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
});

// ==========================================
// 🌧️ PHÂN TÍCH DỮ LIỆU THỜI TIẾT + AI
// ==========================================
app.post("/api/analyze-weather-alert", async (req, res) => {
  try {
    const {
      lat,
      lon,
      areaId,
      to,
      minRiskLevel = 1,
      includeAllAreas = false,
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

    const predictions = floodPredictionService.analyzeForecast(hourlyForecast, {
      maxAreas: includeAllAreas
        ? floodPredictionService.getAllFloodProneAreas().length
        : 5,
    });

    if (!predictions.length) {
      return res.json({
        success: true,
        message: "Không phát hiện nguy cơ ngập dựa trên dữ liệu hiện tại",
        analysis: {
          forecastSamples: hourlyForecast.length,
          predictions: [],
          input: { lat: latitude, lon: longitude },
        },
      });
    }

    let selectedArea = floodPredictionService.getAreaById(areaId);
    const nearestInfo = floodPredictionService.findNearestArea(
      latitude,
      longitude
    );

    if (!selectedArea && nearestInfo) {
      selectedArea = nearestInfo.area;
    }

    if (!selectedArea) {
      selectedArea = predictions[0].area;
    }

    const selectedPrediction =
      predictions.find((entry) => entry.area.id === selectedArea.id) ||
      predictions[0];

    const riskThreshold = Number.isFinite(Number(minRiskLevel))
      ? Number(minRiskLevel)
      : 1;

    const analysis = {
      area: selectedPrediction.area,
      prediction: selectedPrediction.prediction,
      nearestArea: nearestInfo,
      forecastSamples: hourlyForecast.length,
      input: {
        lat: latitude,
        lon: longitude,
        riskThreshold,
      },
    };

    if (includeAllAreas) {
      analysis.topPredictions = predictions;
    }

    const shouldTriggerAlert =
      selectedPrediction.prediction.floodRisk >= riskThreshold;

    if (!shouldTriggerAlert) {
      return res.json({
        success: true,
        message:
          "Không kích hoạt cảnh báo vì cấp độ nguy cơ thấp hơn ngưỡng yêu cầu",
        analysis,
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "GEMINI_API_KEY chưa được cấu hình trong backend",
      });
    }

    const severityLabels = ["AN TOÀN", "CẢNH BÁO", "NGUY HIỂM", "NGHIÊM TRỌNG"];
    const intensityLabels = ["nhẹ", "trung bình", "nặng", "rất nặng"];

    const { area, prediction } = selectedPrediction;
    const intensityLabel =
      intensityLabels[prediction.details.intensity] || "không xác định";

    const aiPrompt = `
Bạn là một hệ thống AI chuyên tạo cảnh báo ngập lụt khẩn cấp bằng tiếng Việt.

THÔNG TIN KHU VỰC:
- Tên khu vực: ${area.name} (${area.district})
- Tọa độ: ${area.coords.lat}, ${area.coords.lon}
- Độ cao địa hình: ${area.elevation} m
- Khả năng thoát nước: ${area.drainageCapacity} mm/h
- Ngưỡng cảnh báo (mm/3h): vàng=${area.threshold.warning}, cam=${
      area.threshold.danger
    }, đỏ=${area.threshold.critical}

DỮ LIỆU DỰ BÁO MƯA:
- Tổng lượng mưa 3 giờ tới: ${prediction.details.rainfall3h} mm
- Tổng lượng mưa 6 giờ tới: ${prediction.details.rainfall6h} mm
- Tổng lượng mưa 12 giờ tới: ${prediction.details.rainfall12h} mm
- Cường độ mưa: ${intensityLabel}
- Điểm rủi ro tổng hợp: ${prediction.riskScore}/100
- Cấp độ nguy hiểm hệ thống: ${severityLabels[prediction.floodRisk]}
- Dự báo độ sâu ngập: ${prediction.details.predictedDepth} cm
- Ước tính thời gian ngập: ${prediction.details.estimatedDuration} phút

KHYẾN NGHỊ HỆ THỐNG: ${prediction.recommendation}

YÊU CẦU ĐẦU RA:
1. Xác định cấp độ nguy hiểm (thấp/trung bình/cao) và tốc độ nước dâng (nhanh/chậm/ổn định) dựa trên dữ liệu.
2. Soạn nội dung email dưới 150 từ, định dạng HTML đơn giản (dùng <p>, <ul>, <li>, <b>, <br>, KHÔNG dùng Markdown).
3. Đưa ra hành động cụ thể cho người dân và chính quyền.
4. Ngôn ngữ khẩn cấp, rõ ràng, bằng tiếng Việt chuẩn.

TRẢ VỀ JSON THUẦN: {"subject": "...", "htmlBody": "..."}
`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            subject: {
              type: "string",
              description:
                "Tiêu đề email cảnh báo ví dụ: 'CẢNH BÁO NGẬP LỤT - Đường 2/9'",
            },
            htmlBody: {
              type: "string",
              description: "Nội dung email đã định dạng HTML đơn giản",
            },
          },
          required: ["subject", "htmlBody"],
        },
      },
    });

    const result = await model.generateContent(aiPrompt);
    const response = await result.response;

    let generatedAlert;
    const rawText = response.text();
    try {
      generatedAlert = JSON.parse(rawText);
    } catch (error) {
      const jsonMatch =
        rawText.match(/```json\n?([\s\S]*?)\n?```/) ||
        rawText.match(/```\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        generatedAlert = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error("Không thể phân tích JSON từ phản hồi Gemini");
      }
    }

    console.log(
      "✅ Gemini AI tạo cảnh báo thời tiết:",
      generatedAlert.subject || "(không có subject)"
    );

    const recipientList = to
      ? Array.isArray(to)
        ? to
        : [to]
      : process.env.ALERT_EMAIL_RECIPIENTS
      ? process.env.ALERT_EMAIL_RECIPIENTS.split(",")
      : [];

    const emailResults = [];
    for (const recipient of recipientList) {
      const trimmed = recipient.trim();
      if (!trimmed) continue;

      try {
        const emailResult = await sendAIFloodAlert(trimmed, generatedAlert);
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
        "⚠️ Không có email nhận cảnh báo. Cấu hình ALERT_EMAIL_RECIPIENTS hoặc truyền 'to' trong request."
      );
    }

    return res.json({
      success: true,
      alert: generatedAlert,
      analysis,
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
});

// ==========================================
// 🤖 GEMINI AI - Tạo cảnh báo ngập lụt thông minh
// ==========================================
app.post("/api/generate-flood-alert", async (req, res) => {
  try {
    // Dữ liệu từ cảm biến
    // Example: { "current_percent": 85, "previous_percent": 50, "location": "Cống Phan Đình Phùng", "timestamp": "2025-11-19T01:42:00", "to": "user@example.com" }
    const { current_percent, previous_percent, location, timestamp, to } =
      req.body;

    // Validate dữ liệu đầu vào
    if (!current_percent || !location) {
      return res.status(400).json({
        success: false,
        error: "Thiếu dữ liệu: current_percent hoặc location",
      });
    }

    // Kiểm tra Gemini API Key
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "GEMINI_API_KEY chưa được cấu hình trong .env",
      });
    }

    // Tạo prompt cho Gemini AI
    const floodAlertPrompt = `
Bạn là một hệ thống Trí tuệ Nhân tạo chuyên biệt trong việc tạo ra các thông báo cảnh báo ngập lụt khẩn cấp, có tính hành động. Nhiệm vụ của bạn là phân tích dữ liệu cảm biến thô và tạo ra một EMAIL CẢNH BÁO.

Dữ liệu quan trắc mới nhất:
- Vị trí Trạm: ${location}
- Mức ngập HIỆN TẠI (So với ống cống/đường): ${current_percent}%
- Mức ngập trước đó 5 phút: ${previous_percent || "Không có dữ liệu"}%
- Ngưỡng Nguy hiểm Cao (Đỏ): 80%
- Ngưỡng Cảnh báo Trung bình (Vàng): 60%
- Thời điểm đo: ${timestamp || new Date().toLocaleString("vi-VN")}

YÊU CẦU ĐẦU RA:
1. Xác định CẤP ĐỘ NGUY HIỂM (Thấp/Trung bình/Cao) và TỐC ĐỘ Nước TĂNG (Nhanh/Chậm/Ổn định).
2. Nội dung Email (Body): Dưới 150 từ, sử dụng ngôn ngữ khẩn cấp, có cấu trúc **HTML đơn giản** (dùng <b>, <br>, <ul>, <li>), và **KHÔNG DÙNG Markdown**.
3. Đưa ra **HÀNH ĐỘNG CỤ THỂ** theo cấp độ nguy hiểm (ví dụ: Di dời tài sản, Tránh tuyến đường).
4. Hãy sử dụng tiếng Việt chuẩn.

FORMAT BẮT BUỘC: Trả về **DUY NHẤT** một đối tượng JSON với 2 trường: subject và htmlBody.
`;

    // Gọi Gemini AI
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            subject: {
              type: "string",
              description:
                "Tiêu đề email cảnh báo, ví dụ: 'CẢNH BÁO KHẨN CẤP: LŨ TẠI Cống A'",
            },
            htmlBody: {
              type: "string",
              description: "Nội dung email đã được định dạng HTML",
            },
          },
          required: ["subject", "htmlBody"],
        },
      },
    });

    const result = await model.generateContent(floodAlertPrompt);
    const response = await result.response;
    const generatedAlert = JSON.parse(response.text());

    console.log("✅ Gemini AI generated alert:", generatedAlert.subject);

    // Nếu có email, gửi luôn
    if (to) {
      const emailResult = await sendAIFloodAlert(to, generatedAlert);

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

    // Trả về cảnh báo dự phòng nếu AI lỗi
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
});

// ==========================================
// 🎯 CẢNH BÁO CÁ NHÂN HÓA - Theo Địa Điểm User
// ==========================================
app.post("/api/check-user-locations-alert", async (req, res) => {
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
        const aiPrompt = personalizedAlertService.createPersonalizedPrompt(
          analysis.user,
          alert
        );

        // Gọi Gemini AI
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "object",
              properties: {
                subject: { type: "string" },
                htmlBody: { type: "string" },
              },
              required: ["subject", "htmlBody"],
            },
          },
        });

        const result = await model.generateContent(aiPrompt);
        const generatedAlert = JSON.parse(result.response.text());

        console.log(
          `✅ AI tạo cảnh báo cho "${alert.location.name}":`,
          generatedAlert.subject
        );

        // Gửi email nếu được yêu cầu
        let emailResult = { success: false };
        if (shouldSendEmail && analysis.user.email) {
          emailResult = await sendAIFloodAlert(
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
});

// ==========================================
// 📍 API Lấy Thông Tin User Locations
// ==========================================
app.get("/api/user-locations/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const locations = await personalizedAlertService.getUserLocations(userId);

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
});

// Start server
app.listen(PORT, () => {
  console.log(`Email service is running on port ${PORT}`);
  console.log(`Test the API at http://localhost:${PORT}`);
});
