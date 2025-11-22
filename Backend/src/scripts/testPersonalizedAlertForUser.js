/**
 * Script: Test personalized alert cho fake user
 * Phân tích xem user có nhận cảnh báo không khi gần sensor
 */
const admin = require("firebase-admin");
const path = require("path");
const personalizedAlertService = require("../services/personalizedAlertService");
const geminiClient = require("../integrations/geminiClient");
const emailService = require("../email/emailService");
require("dotenv").config();

// Khởi tạo Firebase
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const databaseURL = process.env.FIREBASE_DATABASE_URL;

if (!admin.apps.length) {
  // Resolve path tương đối từ root project
  const keyPath = path.resolve(serviceAccountPath);
  const serviceAccount = require(keyPath);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: databaseURL,
  });
}

// ========================================
// MAIN TEST FUNCTION
// ========================================
async function testPersonalizedAlert() {
  try {
    // Lấy userId từ command line hoặc dùng default
    const userId = process.argv[2] || "fake_user_test_001";

    console.log("🧪 TEST PERSONALIZED ALERT\n");
    console.log("=" .repeat(60));
    console.log(`User ID: ${userId}\n`);

    // ========================================
    // 1. LẤY THÔNG TIN USER
    // ========================================
    console.log("📋 BƯỚC 1: Lấy thông tin user...\n");
    
    const user = await personalizedAlertService.getUser(userId);
    if (!user) {
      console.error("❌ Không tìm thấy user!");
      process.exit(1);
    }

    console.log(`✅ User: ${user.name} (${user.email})`);

    // ========================================
    // 2. LẤY DANH SÁCH LOCATIONS
    // ========================================
    console.log("\n📋 BƯỚC 2: Lấy danh sách locations...\n");
    
    const locations = await personalizedAlertService.getUserLocations(userId);
    console.log(`✅ Tìm thấy ${locations.length} locations:\n`);

    locations.forEach((loc, index) => {
      console.log(`   ${index + 1}. ${loc.icon} ${loc.name}`);
      console.log(`      📍 ${loc.coords.lat.toFixed(6)}, ${loc.coords.lon.toFixed(6)}`);
      console.log(`      📏 Alert radius: ${loc.alertRadius}m`);
      console.log(`      ⚡ Priority: ${loc.priority}\n`);
    });

    // ========================================
    // 3. PHÂN TÍCH NGUY CƠ NGẬP
    // ========================================
    console.log("📋 BƯỚC 3: Phân tích nguy cơ ngập cho từng location...\n");
    console.log("=" .repeat(60) + "\n");

    // Fake sensor data với mực nước cao để trigger alert
    const fakeSensorData = await createFakeSensorData();
    
    for (const location of locations) {
      console.log(`🔍 Checking: ${location.icon} ${location.name}`);
      console.log(`   Tọa độ: ${location.coords.lat.toFixed(6)}, ${location.coords.lon.toFixed(6)}`);
      console.log(`   Bán kính cảnh báo: ${location.alertRadius}m\n`);

      // Check khoảng cách đến sensors
      const nearbyFloods = await checkNearbyFloods(location, fakeSensorData);

      if (nearbyFloods.length > 0) {
        console.log(`   ✅ CÓ NGUY CƠ NGẬP!\n`);
        
        nearbyFloods.forEach((flood, index) => {
          console.log(`   Khu vực ngập #${index + 1}:`);
          console.log(`      📍 ${flood.sensorId}`);
          console.log(`      📏 Khoảng cách: ${flood.distance}m`);
          console.log(`      💧 Mực nước: ${flood.waterLevel}cm`);
          console.log(`      🚨 Trạng thái: ${flood.status}\n`);
        });

        // ========================================
        // 4. TẠO CẢNH BÁO BẰNG AI
        // ========================================
        console.log("📋 BƯỚC 4: Tạo cảnh báo bằng AI...\n");
        
        const alert = nearbyFloods[0];
        const prompt = createAlertPrompt(user, location, alert);
        
        console.log("📝 Prompt gửi cho AI:");
        console.log("-".repeat(60));
        console.log(prompt.substring(0, 500) + "...\n");

        try {
          const generatedAlert = await generateAlert(user, location, alert);
          
          console.log("✅ AI đã tạo cảnh báo:\n");
          console.log(`   📧 Subject: ${generatedAlert.subject}\n`);
          console.log("   📄 Body:");
          console.log("-".repeat(60));
          console.log(generatedAlert.htmlBody.substring(0, 800) + "...\n");
          console.log("-".repeat(60) + "\n");

          // ========================================
          // 5. GỬI EMAIL (OPTIONAL)
          // ========================================
          const sendEmail = process.argv[3] === "--send-email";
          
          if (sendEmail && user.email) {
            console.log("📋 BƯỚC 5: Gửi email cảnh báo...\n");
            
            const emailResult = await emailService.sendAIFloodAlert(
              user.email,
              generatedAlert
            );

            if (emailResult.success) {
              console.log(`✅ Email đã được gửi tới: ${user.email}\n`);
            } else {
              console.error(`❌ Lỗi gửi email: ${emailResult.error}\n`);
            }
          } else {
            console.log("ℹ️  Không gửi email. Dùng --send-email để gửi thật.\n");
          }

          // ========================================
          // 6. LƯU LOG
          // ========================================
          await personalizedAlertService.saveAlertLog(userId, {
            location: location,
            floodArea: {
              id: alert.sensorId,
              name: alert.sensorId,
              district: "Đà Nẵng"
            },
            prediction: {
              floodRisk: alert.status === "DANGER" ? 2 : 1,
              riskScore: 75,
              details: {
                rainfall3h: 50,
                predictedDepth: alert.waterLevel,
                intensity: 2
              }
            },
            distance: alert.distance
          }, { success: true, subject: generatedAlert.subject });

          console.log("💾 Đã lưu log cảnh báo vào Firebase\n");

        } catch (error) {
          console.error("❌ Lỗi tạo cảnh báo:", error.message);
        }

      } else {
        console.log(`   ℹ️  Không có nguy cơ ngập trong bán kính ${location.alertRadius}m\n`);
      }

      console.log("─".repeat(60) + "\n");
    }

    console.log("=" .repeat(60));
    console.log("🎉 Test hoàn tất!\n");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  }
}

// ========================================
// HELPERS
// ========================================

/**
 * Tạo fake sensor data với mực nước cao
 */
async function createFakeSensorData() {
  const db = admin.database();
  
  // Đọc sensors thực từ Firebase
  const sensorsData = await db.ref("iotData").once("value");
  const sensors = sensorsData.val() || {};

  return {
    SENSOR_ROAD: sensors.SENSOR_ROAD || {
      device_id: "SENSOR_ROAD",
      water_level_cm: 85, // High water level để trigger alert
      flood_status: "DANGER",
      latitude: 16.0125,
      longitude: 108.2442,
      timestamp: Date.now()
    },
    SENSOR_SEWER: sensors.SENSOR_SEWER || {
      device_id: "SENSOR_SEWER",
      water_level_cm: 72,
      flood_status: "WARNING",
      latitude: 16.0543,
      longitude: 108.2021,
      timestamp: Date.now()
    }
  };
}

/**
 * Check nearby floods cho 1 location
 */
async function checkNearbyFloods(location, sensorData) {
  const nearbyFloods = [];

  for (const [sensorId, sensor] of Object.entries(sensorData)) {
    const distance = calculateDistance(
      location.coords.lat,
      location.coords.lon,
      sensor.latitude,
      sensor.longitude
    );

    const distanceMeters = Math.round(distance * 1000);

    // Nếu trong bán kính cảnh báo
    if (distanceMeters <= location.alertRadius) {
      nearbyFloods.push({
        sensorId: sensorId,
        distance: distanceMeters,
        waterLevel: sensor.water_level_cm,
        status: sensor.flood_status,
        coords: {
          lat: sensor.latitude,
          lon: sensor.longitude
        }
      });
    }
  }

  return nearbyFloods.sort((a, b) => a.distance - b.distance);
}

/**
 * Tính khoảng cách giữa 2 điểm (km)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Tạo prompt cho AI
 */
function createAlertPrompt(user, location, alert) {
  return `
Bạn là hệ thống AI cảnh báo ngập lụt cá nhân hóa.

USER:
- Tên: ${user.name}
- Email: ${user.email}

LOCATION:
- Tên: ${location.name} (${location.icon})
- Loại: ${location.type}
- Địa chỉ: ${location.address}

CẢNH BÁO:
- Sensor: ${alert.sensorId}
- Khoảng cách: ${alert.distance}m từ ${location.name}
- Mực nước: ${alert.waterLevel}cm
- Trạng thái: ${alert.status}

YÊU CẦU:
Tạo email cảnh báo CÁ NHÂN HÓA cho ${user.name}, đề cập đến:
- Địa điểm cụ thể: "${location.name}"
- Khoảng cách: ${alert.distance}m
- Mực nước: ${alert.waterLevel}cm
- Khuyến nghị hành động cụ thể

Format JSON:
{
  "subject": "tiêu đề có tên user và địa điểm",
  "htmlBody": "nội dung HTML cá nhân hóa"
}
`;
}

/**
 * Generate alert bằng AI
 */
async function generateAlert(user, location, alert) {
  const sensorData = {
    water_level_cm: alert.waterLevel,
    flood_status: alert.status,
    device_id: alert.sensorId,
    location: location.name,
    distance: alert.distance
  };

  return await geminiClient.generateFloodAlert(sensorData);
}

// Run
testPersonalizedAlert();

