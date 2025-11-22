/**
 * Simple Firebase Integration - Chỉ dùng REST API
 * Không cần Service Account Key!
 */

const axios = require('axios');

/**
 * Đọc dữ liệu từ Firebase Realtime Database bằng REST API
 */
async function readFirebaseData(path) {
  const databaseURL = process.env.FIREBASE_DATABASE_URL;
  
  if (!databaseURL) {
    throw new Error('FIREBASE_DATABASE_URL chưa được cấu hình trong .env');
  }
  
  try {
    // Remove trailing slash from databaseURL if exists
    const baseURL = databaseURL.replace(/\/$/, '');
    
    // Firebase REST API: https://firebase.google.com/docs/database/rest/start
    const url = `${baseURL}/${path}.json`;
    console.log('📡 Firebase GET:', url);
    
    const response = await axios.get(url);
    console.log('✅ Firebase response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Lỗi đọc Firebase:', error.message);
    console.error('❌ URL:', `${databaseURL}/${path}.json`);
    throw error;
  }
}

/**
 * Ghi dữ liệu lên Firebase Realtime Database bằng REST API
 */
async function writeFirebaseData(path, data) {
  const databaseURL = process.env.FIREBASE_DATABASE_URL;
  
  if (!databaseURL) {
    throw new Error('FIREBASE_DATABASE_URL chưa được cấu hình trong .env');
  }
  
  try {
    // Remove trailing slash from databaseURL if exists
    const baseURL = databaseURL.replace(/\/$/, '');
    
    const url = `${baseURL}/${path}.json`;
    console.log('📡 Firebase PUT:', url);
    
    const response = await axios.put(url, data);
    console.log('✅ Firebase write success');
    return response.data;
  } catch (error) {
    console.error('❌ Lỗi ghi Firebase:', error.message);
    throw error;
  }
}

module.exports = {
  readFirebaseData,
  writeFirebaseData
};

