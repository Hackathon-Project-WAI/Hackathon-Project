/**
 * Firebase Admin SDK Configuration for Telegram Bot
 * Khởi tạo Firebase Admin với Service Account
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let firebaseApp;
let firebaseInitialized = false;

/**
 * Khởi tạo Firebase Admin SDK
 * Hỗ trợ 3 phương thức:
 * 1. Service Account JSON file
 * 2. Service Account từ environment variable (JSON string)
 * 3. Application Default Credentials
 */
function initializeFirebase() {
  if (firebaseInitialized) {
    console.log('ℹ️ Firebase đã được khởi tạo trước đó');
    return firebaseApp;
  }

  try {
    // Kiểm tra xem Firebase đã được khởi tạo chưa
    if (admin.apps.length > 0) {
      firebaseApp = admin.apps[0];
      firebaseInitialized = true;
      console.log('✅ Sử dụng Firebase instance đã tồn tại');
      return firebaseApp;
    }

    // Phương thức 1: Sử dụng Service Account JSON từ environment variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      console.log('🔑 Khởi tạo Firebase từ FIREBASE_SERVICE_ACCOUNT_JSON...');
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
      
      firebaseInitialized = true;
      console.log('✅ Firebase Admin SDK đã được khởi tạo thành công (từ ENV JSON)');
      return firebaseApp;
    }

    // Phương thức 2: Sử dụng Service Account file path
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';
    
    if (fs.existsSync(serviceAccountPath)) {
      console.log(`🔑 Khởi tạo Firebase từ file: ${serviceAccountPath}...`);
      const serviceAccount = require(path.resolve(serviceAccountPath));
      
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID
      });
      
      firebaseInitialized = true;
      console.log('✅ Firebase Admin SDK đã được khởi tạo thành công (từ file)');
      return firebaseApp;
    }

    // Phương thức 3: Application Default Credentials (cho Google Cloud)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log('🔑 Khởi tạo Firebase từ GOOGLE_APPLICATION_CREDENTIALS...');
      firebaseApp = admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      
      firebaseInitialized = true;
      console.log('✅ Firebase Admin SDK đã được khởi tạo thành công (ADC)');
      return firebaseApp;
    }

    // Không tìm thấy credentials
    throw new Error(
      'Không tìm thấy Firebase credentials!\n\n' +
      '📋 Vui lòng cung cấp một trong các cách sau:\n' +
      '1. Đặt FIREBASE_SERVICE_ACCOUNT_JSON (JSON string) trong .env\n' +
      '2. Đặt file serviceAccountKey.json trong thư mục Backend/\n' +
      '3. Đặt GOOGLE_APPLICATION_CREDENTIALS trong .env\n\n' +
      '📖 Xem hướng dẫn chi tiết trong TELEGRAM_BOT_DEPLOYMENT_GUIDE.md'
    );
    
  } catch (error) {
    console.error('\n❌ LỖI KHỞI TẠO FIREBASE ADMIN SDK\n');
    console.error('Chi tiết lỗi:', error.message);
    console.error('\n📖 HƯỚNG DẪN KHẮC PHỤC:');
    console.error('1. Tải Service Account Key từ Firebase Console:');
    console.error('   https://console.firebase.google.com/ → Project Settings → Service Accounts');
    console.error('2. Lưu file JSON vào Backend/serviceAccountKey.json');
    console.error('3. Hoặc thêm JSON string vào .env:');
    console.error('   FIREBASE_SERVICE_ACCOUNT_JSON=\'{"type":"service_account",...}\'');
    console.error('\n');
    process.exit(1);
  }
}

/**
 * Lấy Firestore instance
 */
function getFirestore() {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.firestore();
}

module.exports = {
  initializeFirebase,
  getFirestore,
  admin
};
