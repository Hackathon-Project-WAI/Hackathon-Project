/**
 * Setup Helper - Kiểm tra và hướng dẫn cấu hình
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('🔍 KIỂM TRA CẤU HÌNH HỆ THỐNG\n');
console.log('═'.repeat(60));

let hasErrors = false;
let hasWarnings = false;

// 1. Kiểm tra Telegram Bot Token
console.log('\n1️⃣ TELEGRAM BOT TOKEN');
if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN !== 'YOUR_BOT_TOKEN') {
  console.log('   ✅ Token đã được cấu hình');
  console.log(`   📝 Token: ${process.env.TELEGRAM_BOT_TOKEN.substring(0, 10)}...`);
} else {
  console.log('   ❌ Chưa cấu hình Bot Token');
  console.log('   📖 Hướng dẫn:');
  console.log('      - Mở Telegram, tìm @BotFather');
  console.log('      - Gửi /newbot và làm theo hướng dẫn');
  console.log('      - Copy token và thêm vào file .env:');
  console.log('        TELEGRAM_BOT_TOKEN=your_token_here');
  hasErrors = true;
}

// 2. Kiểm tra Firebase Configuration
console.log('\n2️⃣ FIREBASE CONFIGURATION');

// Kiểm tra Service Account JSON string
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    console.log('   ✅ Service Account JSON đã cấu hình trong .env');
    console.log(`   📝 Project ID: ${serviceAccount.project_id}`);
  } catch (error) {
    console.log('   ⚠️ FIREBASE_SERVICE_ACCOUNT_JSON không hợp lệ (JSON parse error)');
    hasErrors = true;
  }
} 
// Kiểm tra Service Account file
else if (fs.existsSync('./serviceAccountKey.json')) {
  try {
    const serviceAccount = require('./serviceAccountKey.json');
    console.log('   ✅ Service Account file đã tồn tại');
    console.log(`   📝 Project ID: ${serviceAccount.project_id}`);
    console.log(`   📝 File: serviceAccountKey.json`);
  } catch (error) {
    console.log('   ⚠️ serviceAccountKey.json không hợp lệ');
    hasErrors = true;
  }
}
// Kiểm tra Google Application Credentials
else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  if (fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    console.log('   ✅ Google Application Credentials đã cấu hình');
    console.log(`   📝 File: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
  } else {
    console.log('   ⚠️ GOOGLE_APPLICATION_CREDENTIALS file không tồn tại');
    hasErrors = true;
  }
} else {
  console.log('   ❌ Chưa cấu hình Firebase Service Account');
  console.log('   📖 Hướng dẫn:');
  console.log('      CÁCH 1 (Khuyến nghị): Sử dụng file JSON');
  console.log('      - Truy cập: https://console.firebase.google.com/');
  console.log('      - Vào Project Settings → Service Accounts');
  console.log('      - Click "Generate new private key"');
  console.log('      - Lưu file vào Backend/serviceAccountKey.json');
  console.log('');
  console.log('      CÁCH 2: Sử dụng environment variable');
  console.log('      - Thêm vào .env:');
  console.log('        FIREBASE_SERVICE_ACCOUNT_JSON=\'{"type":"service_account",...}\'');
  hasErrors = true;
}

// Kiểm tra Firebase Project ID
if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PROJECT_ID !== 'YOUR_FIREBASE_PROJECT_ID') {
  console.log(`   ℹ️ Project ID từ .env: ${process.env.FIREBASE_PROJECT_ID}`);
} else {
  console.log('   ⚠️ FIREBASE_PROJECT_ID chưa được set (sẽ lấy từ Service Account)');
  hasWarnings = true;
}

// 3. Kiểm tra Dependencies
console.log('\n3️⃣ NODE.JS DEPENDENCIES');
try {
  require('axios');
  console.log('   ✅ axios');
} catch {
  console.log('   ❌ axios chưa cài đặt');
  hasErrors = true;
}

try {
  require('firebase-admin');
  console.log('   ✅ firebase-admin');
} catch {
  console.log('   ❌ firebase-admin chưa cài đặt');
  hasErrors = true;
}

try {
  require('dotenv');
  console.log('   ✅ dotenv');
} catch {
  console.log('   ❌ dotenv chưa cài đặt');
  hasErrors = true;
}

// 4. Kiểm tra Files
console.log('\n4️⃣ REQUIRED FILES');
const requiredFiles = [
  'telegramFirebaseConfig.js',
  'firestoreManager.js',
  'telegramBotListener.js',
  'telegramAlertTrigger.js',
  '.env'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(`./${file}`)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} không tồn tại`);
    hasErrors = true;
  }
});

// 5. Firestore Collections Info
console.log('\n5️⃣ FIRESTORE COLLECTIONS (Sẽ tự động tạo khi chạy)');
console.log('   📦 telegram_users - Lưu thông tin người dùng');
console.log('   📦 flood_zones - Lưu thông tin khu vực ngập lụt');

// Tổng kết
console.log('\n' + '═'.repeat(60));
console.log('\n📊 KẾT QUẢ KIỂM TRA:');

if (!hasErrors && !hasWarnings) {
  console.log('   ✅ Tất cả cấu hình đã sẵn sàng!');
  console.log('\n🚀 CHẠY HỆ THỐNG:');
  console.log('   Terminal 1: npm run bot:listener');
  console.log('   Terminal 2: npm run bot:alert');
} else {
  if (hasErrors) {
    console.log('   ❌ Có lỗi cần khắc phục (xem danh sách ở trên)');
    console.log('\n📖 XEM HƯỚNG DẪN CHI TIẾT:');
    console.log('   cat TELEGRAM_BOT_DEPLOYMENT_GUIDE.md');
  }
  if (hasWarnings && !hasErrors) {
    console.log('   ⚠️ Có cảnh báo nhưng có thể chạy được');
    console.log('\n🚀 Thử chạy hệ thống:');
    console.log('   npm run bot:listener');
  }
}

console.log('\n' + '═'.repeat(60));
console.log();

// Exit code
process.exit(hasErrors ? 1 : 0);
