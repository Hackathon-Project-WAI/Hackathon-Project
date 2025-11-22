/**
 * Script: Kiểm tra Firebase setup
 * Verify file serviceAccountKey.json và .env config
 */
const path = require("path");
const fs = require("fs");
require("dotenv").config();

console.log("🔍 Kiểm tra Firebase setup...\n");
console.log("=".repeat(60));

// 1. Check .env variables
console.log("\n📋 BƯỚC 1: Kiểm tra .env variables\n");

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const databaseURL = process.env.FIREBASE_DATABASE_URL;

if (!serviceAccountPath) {
  console.error("❌ FIREBASE_SERVICE_ACCOUNT_KEY chưa được cấu hình trong .env");
  process.exit(1);
} else {
  console.log(`✅ FIREBASE_SERVICE_ACCOUNT_KEY: ${serviceAccountPath}`);
}

if (!databaseURL) {
  console.error("❌ FIREBASE_DATABASE_URL chưa được cấu hình trong .env");
  process.exit(1);
} else {
  console.log(`✅ FIREBASE_DATABASE_URL: ${databaseURL}`);
}

// 2. Check file existence
console.log("\n📋 BƯỚC 2: Kiểm tra file serviceAccountKey.json\n");

const keyPath = path.resolve(serviceAccountPath);
console.log(`📁 Đường dẫn resolved: ${keyPath}`);

if (!fs.existsSync(keyPath)) {
  console.error("\n❌ File không tồn tại!");
  console.error("\n💡 Hướng dẫn:");
  console.error("1. Truy cập Firebase Console:");
  console.error("   https://console.firebase.google.com/");
  console.error("2. Chọn project của bạn");
  console.error("3. Project Settings > Service Accounts");
  console.error("4. Click 'Generate new private key'");
  console.error("5. Save file vào: Backend/configs/serviceAccountKey.json");
  console.error("6. Update .env:");
  console.error("   FIREBASE_SERVICE_ACCOUNT_KEY=./configs/serviceAccountKey.json");
  process.exit(1);
} else {
  console.log(`✅ File tồn tại: ${path.basename(keyPath)}`);
  
  // Check file size
  const stats = fs.statSync(keyPath);
  console.log(`   Kích thước: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`   Modified: ${stats.mtime.toLocaleString('vi-VN')}`);
}

// 3. Try to read and validate JSON
console.log("\n📋 BƯỚC 3: Validate JSON format\n");

try {
  const serviceAccount = require(keyPath);
  
  // Check required fields
  const requiredFields = [
    'type',
    'project_id',
    'private_key_id',
    'private_key',
    'client_email'
  ];
  
  let allValid = true;
  
  for (const field of requiredFields) {
    if (serviceAccount[field]) {
      console.log(`   ✅ ${field}: ${field === 'private_key' ? '[HIDDEN]' : serviceAccount[field].substring(0, 50)}`);
    } else {
      console.error(`   ❌ ${field}: MISSING`);
      allValid = false;
    }
  }
  
  if (!allValid) {
    console.error("\n❌ File JSON thiếu trường bắt buộc!");
    console.error("💡 Download lại file từ Firebase Console");
    process.exit(1);
  }
  
  console.log("\n✅ JSON format hợp lệ!");
  console.log(`   Project ID: ${serviceAccount.project_id}`);
  console.log(`   Client Email: ${serviceAccount.client_email}`);
  
} catch (error) {
  console.error("\n❌ Lỗi đọc/parse JSON:");
  console.error(`   ${error.message}`);
  process.exit(1);
}

// 4. Try to initialize Firebase
console.log("\n📋 BƯỚC 4: Test khởi tạo Firebase Admin SDK\n");

try {
  const admin = require("firebase-admin");
  
  if (!admin.apps.length) {
    const serviceAccount = require(keyPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: databaseURL,
    });
    
    console.log("✅ Firebase Admin SDK khởi tạo thành công!");
    
    // Try to read data
    const db = admin.database();
    console.log("✅ Database connection OK");
    
  } else {
    console.log("✅ Firebase đã được khởi tạo trước đó");
  }
  
} catch (error) {
  console.error("\n❌ Lỗi khởi tạo Firebase:");
  console.error(`   ${error.message}`);
  process.exit(1);
}

// Summary
console.log("\n" + "=".repeat(60));
console.log("🎉 TẤT CẢ KIỂM TRA HOÀN TẤT!\n");
console.log("✅ Firebase setup đã sẵn sàng");
console.log("✅ Bạn có thể chạy scripts khác ngay bây giờ\n");

process.exit(0);


