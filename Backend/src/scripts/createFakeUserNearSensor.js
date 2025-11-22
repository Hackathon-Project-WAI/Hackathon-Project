/**
 * Script: Tạo fake user có địa điểm GẦN sensors
 * Để test personalized alert với bán kính 20-30m
 */
const admin = require("firebase-admin");
const path = require("path");
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

const db = admin.database();

// ========================================
// TỌA ĐỘ SENSORS (từ Firebase)
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
/**
 * Tính tọa độ mới cách tọa độ gốc N meters
 * @param {number} lat - Latitude gốc
 * @param {number} lon - Longitude gốc
 * @param {number} distanceMeters - Khoảng cách (meters)
 * @returns {Object} - {lat, lon} mới
 */
function calculateNearbyCoords(lat, lon, distanceMeters) {
  // 1 degree latitude ~ 111,111 meters
  // 1 degree longitude ~ 111,111 * cos(latitude) meters
  
  const latOffset = distanceMeters / 111111; // offset theo latitude
  const lonOffset = distanceMeters / (111111 * Math.cos(lat * Math.PI / 180)); // offset theo longitude
  
  return {
    lat: lat + latOffset,
    lon: lon + lonOffset
  };
}

// ========================================
// FAKE USER DATA
// ========================================
const FAKE_USER = {
  userId: "fake_user_test_001",
  name: "Nguyễn Văn Test",
  email: "test.user.near.sensor@example.com",
  locations: [
    {
      id: "loc_001",
      name: "Nhà",
      type: "residential",
      icon: "🏠",
      address: "Gần SENSOR_ROAD, Đà Nẵng",
      coords: calculateNearbyCoords(SENSOR_ROAD.lat, SENSOR_ROAD.lon, 25), // Cách 25m
      alertRadius: 50, // Bán kính cảnh báo 50m
      priority: "high",
      status: "active",
      createdAt: Date.now(),
    },
    {
      id: "loc_002",
      name: "Công ty",
      type: "office",
      icon: "🏢",
      address: "Gần SENSOR_SEWER, Đà Nẵng",
      coords: calculateNearbyCoords(SENSOR_SEWER.lat, SENSOR_SEWER.lon, 20), // Cách 20m
      alertRadius: 30, // Bán kính cảnh báo 30m
      priority: "high",
      status: "active",
      createdAt: Date.now(),
    },
  ],
};

// ========================================
// TẠO USER TRONG FIREBASE
// ========================================
async function createFakeUser() {
  try {
    console.log("🚀 Bắt đầu tạo fake user...\n");

    const userId = FAKE_USER.userId;
    const userRef = db.ref(`userProfiles/${userId}`);

    // User profile data
    const userData = {
      name: FAKE_USER.name,
      email: FAKE_USER.email,
      displayName: FAKE_USER.name,
      createdAt: Date.now(),
      stats: {
        alertsReceived: 0,
        locationsTracked: FAKE_USER.locations.length,
      },
    };

    // Lưu user profile
    await userRef.set(userData);
    console.log(`✅ Đã tạo user profile: ${userId}`);
    console.log(`   Tên: ${FAKE_USER.name}`);
    console.log(`   Email: ${FAKE_USER.email}\n`);

    // Lưu locations
    const locationsRef = db.ref(`userProfiles/${userId}/locations`);
    
    for (const location of FAKE_USER.locations) {
      await locationsRef.child(location.id).set(location);
      
      console.log(`📍 Đã tạo location: ${location.name}`);
      console.log(`   Type: ${location.type} ${location.icon}`);
      console.log(`   Address: ${location.address}`);
      console.log(`   Coords: ${location.coords.lat.toFixed(6)}, ${location.coords.lon.toFixed(6)}`);
      console.log(`   Alert Radius: ${location.alertRadius}m`);
      console.log(`   Priority: ${location.priority}\n`);
    }

    // ========================================
    // HIỂN thị khoảng cách THỰC TẾ
    // ========================================
    console.log("📏 KHOẢNG CÁCH THỰC TẾ:\n");
    
    const loc1 = FAKE_USER.locations[0];
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

    const loc2 = FAKE_USER.locations[1];
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

    console.log("🎉 Hoàn thành! Fake user đã được tạo trong Firebase.\n");
    console.log("📝 User ID:", userId);
    console.log("📧 Email:", FAKE_USER.email);
    console.log("\n💡 Test alert:");
    console.log(`   node src/scripts/testPersonalizedAlertForUser.js ${userId}\n`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  }
}

// ========================================
// HELPER: Tính khoảng cách giữa 2 điểm
// ========================================
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // km
}

// Run
createFakeUser();

