/**
 * Firebase Admin SDK - Lắng nghe dữ liệu IoT từ Firebase
 * Tự động gọi Gemini AI khi phát hiện ngập lụt nguy hiểm
 */

const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { sendAIFloodAlert } = require("./emailService");
require("dotenv").config();

// Khởi tạo Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Khởi tạo Firebase Admin (cần Service Account Key)
// Có 2 cách:
// 1. Dùng Service Account JSON file (khuyến nghị cho production)
// 2. Dùng credentials từ environment (đơn giản hơn cho development)

let firebaseInitialized = false;

function initializeFirebase() {
  if (firebaseInitialized) return;

  try {
    // Cách 1: Dùng Service Account JSON string từ environment variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_JSON
      );
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
      console.log(
        "✅ Firebase Admin initialized with Service Account (from .env)"
      );
    }
    // Cách 2: Dùng Service Account JSON file (nếu có file)
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
      console.log(
        "✅ Firebase Admin initialized with Service Account (from file)"
      );
    }
    // Cách 3: Dùng Application Default Credentials (cho local dev)
    else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
      console.log("✅ Firebase Admin initialized with Default Credentials");
    }

    firebaseInitialized = true;
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin:", error.message);
    console.log(
      "💡 Hint: Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_DATABASE_URL in .env"
    );
  }
}

/**
 * Tạo cảnh báo bằng Gemini AI
 */
async function generateAIAlert(sensorData) {
  const { current_percent, previous_percent, location, timestamp } = sensorData;

  const prompt = `
Bạn là một hệ thống Trí tuệ Nhân tạo chuyên biệt trong việc tạo ra các thông báo cảnh báo ngập lụt khẩn cấp, có tính hành động. Nhiệm vụ của bạn là phân tích dữ liệu cảm biến thô và tạo ra một EMAIL CẢNH BÁO.

Dữ liệu quan trắc mới nhất:
- Vị trí Trạm: ${location}
- Mức ngập HIỆN TẠI (So với ống cống/đường): ${current_percent}%
- Mức ngập trước đó: ${previous_percent || "Không có dữ liệu"}%
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

  try {
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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error("❌ Gemini AI Error:", error.message);
    // Fallback
    return {
      subject: `⚠️ CẢNH BÁO NGẬP LỤT: ${location}`,
      htmlBody: `<b>Phát hiện ngập lụt tại ${location}</b><br><br>Mức ngập: ${current_percent}%<br>Thời gian: ${
        timestamp || new Date().toLocaleString("vi-VN")
      }<br><br>Vui lòng cẩn thận và theo dõi tình hình!`,
    };
  }
}

/**
 * Lắng nghe dữ liệu IoT từ Firebase Realtime Database
 * Path mẫu: /sensors/flood/{sensorId}
 */
function listenToFloodSensors(emailRecipients = []) {
  if (!firebaseInitialized) {
    console.error(
      "❌ Firebase chưa được khởi tạo. Gọi initializeFirebase() trước."
    );
    return;
  }

  const db = admin.database();
  const sensorsRef = db.ref("sensors/flood"); // Đường dẫn tới cảm biến ngập lụt

  console.log("👂 Đang lắng nghe dữ liệu từ Firebase: sensors/flood");

  sensorsRef.on("child_changed", async (snapshot) => {
    const sensorId = snapshot.key;
    const data = snapshot.val();

    console.log(`📊 Dữ liệu mới từ sensor ${sensorId}:`, data);

    // Kiểm tra ngưỡng nguy hiểm (80%)
    if (data.current_percent >= 80) {
      console.log(`🚨 CẢNH BÁO: Ngập lụt nguy hiểm tại ${data.location}!`);

      // Tạo cảnh báo bằng AI
      const alertContent = await generateAIAlert({
        current_percent: data.current_percent,
        previous_percent: data.previous_percent,
        location: data.location || sensorId,
        timestamp: data.timestamp || new Date().toISOString(),
      });

      console.log("✅ AI đã tạo cảnh báo:", alertContent.subject);

      // Gửi email cho danh sách người dùng
      if (emailRecipients.length > 0) {
        for (const email of emailRecipients) {
          const result = await sendAIFloodAlert(email, alertContent);
          if (result.success) {
            console.log(`✉️ Đã gửi email cảnh báo tới ${email}`);
          } else {
            console.error(`❌ Lỗi gửi email tới ${email}:`, result.error);
          }
        }
      } else {
        console.log(
          "⚠️ Chưa có email nào để gửi. Thêm email vào .env (ALERT_EMAIL_RECIPIENTS)"
        );
      }

      // Lưu log vào Firebase (tùy chọn)
      db.ref(`alerts/${sensorId}/${Date.now()}`).set({
        ...alertContent,
        sensorData: data,
        sentAt: new Date().toISOString(),
      });
    }
  });

  // Lắng nghe cả khi có sensor mới
  sensorsRef.on("child_added", (snapshot) => {
    const sensorId = snapshot.key;
    const data = snapshot.val();
    console.log(`🆕 Sensor mới được thêm: ${sensorId}`, data);
  });
}

/**
 * Lắng nghe dữ liệu IoT từ Firestore (nếu dùng Firestore thay vì Realtime DB)
 */
function listenToFirestoreFloodSensors(emailRecipients = []) {
  if (!firebaseInitialized) {
    console.error(
      "❌ Firebase chưa được khởi tạo. Gọi initializeFirebase() trước."
    );
    return;
  }

  const db = admin.firestore();

  console.log(
    "👂 Đang lắng nghe dữ liệu từ Firestore: flood_sensors collection"
  );

  db.collection("flood_sensors")
    .where("current_percent", ">=", 80) // Chỉ lắng nghe ngưỡng nguy hiểm
    .onSnapshot(
      async (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === "added" || change.type === "modified") {
            const data = change.doc.data();
            const sensorId = change.doc.id;

            console.log(`📊 Dữ liệu Firestore từ ${sensorId}:`, data);
            console.log(
              `🚨 CẢNH BÁO: Ngập lụt nguy hiểm tại ${data.location}!`
            );

            // Tạo cảnh báo bằng AI
            const alertContent = await generateAIAlert({
              current_percent: data.current_percent,
              previous_percent: data.previous_percent,
              location: data.location || sensorId,
              timestamp: data.timestamp || new Date().toISOString(),
            });

            console.log("✅ AI đã tạo cảnh báo:", alertContent.subject);

            // Gửi email
            if (emailRecipients.length > 0) {
              for (const email of emailRecipients) {
                const result = await sendAIFloodAlert(email, alertContent);
                if (result.success) {
                  console.log(`✉️ Đã gửi email cảnh báo tới ${email}`);
                }
              }
            }

            // Lưu log vào Firestore
            await db.collection("alerts").add({
              ...alertContent,
              sensorId,
              sensorData: data,
              sentAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        });
      },
      (error) => {
        console.error("❌ Firestore Listener Error:", error);
      }
    );
}

module.exports = {
  initializeFirebase,
  listenToFloodSensors,
  listenToFirestoreFloodSensors,
  generateAIAlert,
};
