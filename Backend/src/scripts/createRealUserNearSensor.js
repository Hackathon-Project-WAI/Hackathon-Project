/**
 * Script: Tạo REAL user với Firebase Auth + Locations gần sensors
 * Email: tranviettai0852730323@gmail.com
 * Password: 20052004Loi
 */
const admin = require("firebase-admin");
const path = require("path");
require("dotenv").config();

// Khởi tạo Firebase
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const databaseURL = process.env.FIREBASE_DATABASE_URL;

if (!admin.apps.length) {
  const keyPath = path.resolve(serviceAccountPath);
  const serviceAccount = require(keyPath);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: databaseURL,
  });
}

const db = admin.database();
const auth = admin.auth();

// ========================================
// USER INFO
// ========================================
const USER_EMAIL = "tranviettai0852730323@gmail.com";
const USER_PASSWORD = "20052004Loi";
const USER_NAME = "Trần Viết Tài";

// ========================================
// TỌA ĐỘ SENSORS
// ========================================
const SENSOR_ROAD = {
  lat: 16.0125,
  lon: 108.2442,
  name: "SENSOR_ROAD"
};

const SENSOR_SEWER = {
  lat: 16.0543,
  lon: 108.2021,
  name: "SENSOR_SEWER"
};

// ========================================
// TÍNH TỌA ĐỘ CÁCH SENSOR X METERS
// ========================================
function calculateNearbyCoords(lat, lon, distanceMeters) {
  const latOffset = distanceMeters / 111111;
  const lonOffset = distanceMeters / (111111 * Math.cos(lat * Math.PI / 180));
  
  return {
    lat: lat + latOffset,
    lon: lon + lonOffset
  };
}

// ========================================
// TÍNH KHOẢNG CÁCH
// ========================================
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

// ========================================
// MAIN
// ========================================
async function createRealUser() {
  try {
    console.log("🚀 Bắt đầu tạo REAL user...\n");
    console.log("=" .repeat(60));

    // ========================================
    // 1. TẠO FIREBASE AUTH USER
    // ========================================
    console.log("\n📋 BƯỚC 1: Tạo Firebase Authentication user...\n");

    let userId;
    let isNewUser = false;

    try {
      // Check xem user đã tồn tại chưa
      const existingUser = await auth.getUserByEmail(USER_EMAIL);
      userId = existingUser.uid;
      console.log(`ℹ️  User đã tồn tại với UID: ${userId}`);
      console.log(`   Email: ${USER_EMAIL}`);
      
      // Update password
      await auth.updateUser(userId, {
        password: USER_PASSWORD,
        displayName: USER_NAME,
      });
      console.log(`✅ Đã cập nhật password mới`);
      
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Tạo user mới
        const newUser = await auth.createUser({
          email: USER_EMAIL,
          password: USER_PASSWORD,
          displayName: USER_NAME,
          emailVerified: true,
        });
        
        userId = newUser.uid;
        isNewUser = true;
        
        console.log(`✅ Đã tạo Firebase Auth user mới!`);
        console.log(`   UID: ${userId}`);
        console.log(`   Email: ${USER_EMAIL}`);
        console.log(`   Name: ${USER_NAME}`);
      } else {
        throw error;
      }
    }

    // ========================================
    // 2. TẠO USER PROFILE
    // ========================================
    console.log("\n📋 BƯỚC 2: Tạo user profile trong Database...\n");

    const userRef = db.ref(`userProfiles/${userId}`);
    
    const userData = {
      name: USER_NAME,
      email: USER_EMAIL,
      displayName: USER_NAME,
      createdAt: isNewUser ? Date.now() : (await userRef.once("value")).val()?.createdAt || Date.now(),
      updatedAt: Date.now(),
      stats: {
        alertsReceived: 0,
        locationsTracked: 2,
      },
    };

    await userRef.set(userData);
    console.log(`✅ Đã ${isNewUser ? 'tạo' : 'cập nhật'} user profile`);

    // ========================================
    // 3. TẠO LOCATIONS GẦN SENSORS
    // ========================================
    console.log("\n📋 BƯỚC 3: Tạo locations gần sensors...\n");

    const locations = [
      {
        id: "loc_home",
        name: "Nhà",
        type: "residential",
        icon: "🏠",
        address: "Gần SENSOR_ROAD, Đà Nẵng",
        coords: calculateNearbyCoords(SENSOR_ROAD.lat, SENSOR_ROAD.lon, 25),
        alertRadius: 50,
        priority: "high",
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: "loc_office",
        name: "Công ty",
        type: "office",
        icon: "🏢",
        address: "Gần SENSOR_SEWER, Đà Nẵng",
        coords: calculateNearbyCoords(SENSOR_SEWER.lat, SENSOR_SEWER.lon, 20),
        alertRadius: 30,
        priority: "high",
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const locationsRef = db.ref(`userProfiles/${userId}/locations`);
    
    for (const location of locations) {
      await locationsRef.child(location.id).set(location);
      
      console.log(`📍 Đã tạo location: ${location.name}`);
      console.log(`   Type: ${location.type} ${location.icon}`);
      console.log(`   Address: ${location.address}`);
      console.log(`   Coords: ${location.coords.lat.toFixed(6)}, ${location.coords.lon.toFixed(6)}`);
      console.log(`   Alert Radius: ${location.alertRadius}m`);
      console.log(`   Priority: ${location.priority}\n`);
    }

    // ========================================
    // 4. HIỂN THỊ KHOẢNG CÁCH
    // ========================================
    console.log("📏 KHOẢNG CÁCH THỰC TẾ:\n");
    
    const loc1 = locations[0];
    const distance1 = calculateDistance(
      SENSOR_ROAD.lat,
      SENSOR_ROAD.lon,
      loc1.coords.lat,
      loc1.coords.lon
    );
    console.log(`🏠 "${loc1.name}" → ${SENSOR_ROAD.name}:`);
    console.log(`   Khoảng cách: ${(distance1 * 1000).toFixed(2)}m`);
    console.log(`   Alert radius: ${loc1.alertRadius}m`);
    console.log(`   → ${(distance1 * 1000) <= loc1.alertRadius ? '✅ SẼ CẢNH BÁO' : '❌ KHÔNG CẢNH BÁO'}\n`);

    const loc2 = locations[1];
    const distance2 = calculateDistance(
      SENSOR_SEWER.lat,
      SENSOR_SEWER.lon,
      loc2.coords.lat,
      loc2.coords.lon
    );
    console.log(`🏢 "${loc2.name}" → ${SENSOR_SEWER.name}:`);
    console.log(`   Khoảng cách: ${(distance2 * 1000).toFixed(2)}m`);
    console.log(`   Alert radius: ${loc2.alertRadius}m`);
    console.log(`   → ${(distance2 * 1000) <= loc2.alertRadius ? '✅ SẼ CẢNH BÁO' : '❌ KHÔNG CẢNH BÁO'}\n`);

    // ========================================
    // 5. TẠO ALERT SETTINGS (OPTIONAL)
    // ========================================
    console.log("📋 BƯỚC 4: Tạo alert settings (tự động check)...\n");

    const alertSettings = {
      enabled: false, // Tắt mặc định, user có thể bật sau
      threshold: 75,
      checkInterval: 300000, // 5 phút
      email: USER_EMAIL,
      sensorIds: ["SENSOR_ROAD", "SENSOR_SEWER"],
      lastChecked: null,
      lastAlertSent: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.ref(`userSettings/${userId}/alertSettings`).set(alertSettings);
    console.log(`✅ Đã tạo alert settings (enabled: false)`);
    console.log(`   Email: ${USER_EMAIL}`);
    console.log(`   Threshold: ${alertSettings.threshold}%`);
    console.log(`   Check interval: ${alertSettings.checkInterval / 1000}s`);

    // ========================================
    // SUMMARY
    // ========================================
    console.log("\n" + "=".repeat(60));
    console.log("🎉 HOÀN TẤT!\n");
    console.log("📧 THÔNG TIN ĐĂNG NHẬP:");
    console.log(`   Email: ${USER_EMAIL}`);
    console.log(`   Password: ${USER_PASSWORD}`);
    console.log(`   UID: ${userId}\n`);
    
    console.log("📍 LOCATIONS:");
    console.log(`   - 🏠 Nhà (cách SENSOR_ROAD ~25m)`);
    console.log(`   - 🏢 Công ty (cách SENSOR_SEWER ~20m)\n`);
    
    console.log("💡 HƯỚNG DẪN:");
    console.log(`   1. Đăng nhập web: http://localhost:3000/login`);
    console.log(`      Email: ${USER_EMAIL}`);
    console.log(`      Password: ${USER_PASSWORD}`);
    console.log(`   2. Test alert:`);
    console.log(`      node src/scripts/testPersonalizedAlertForUser.js ${userId}`);
    console.log(`   3. Gửi email thật:`);
    console.log(`      node src/scripts/testPersonalizedAlertForUser.js ${userId} --send-email\n`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi:", error);
    console.error("\nChi tiết:", error.message);
    process.exit(1);
  }
}

// Run
createRealUser();


