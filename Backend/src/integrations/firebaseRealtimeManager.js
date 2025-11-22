/**
 * Firebase Realtime Database Manager cho Telegram Bot
 * Sử dụng REST API - KHÔNG cần Service Account Key
 */

const axios = require('axios');

const DATABASE_URL = process.env.FIREBASE_DATABASE_URL || 'https://fir-hackathon-98bf5-default-rtdb.asia-southeast1.firebasedatabase.app';

/**
 * Lưu hoặc cập nhật thông tin người dùng Telegram
 * @param {string} chatId - Telegram Chat ID
 * @param {object} userData - Dữ liệu người dùng
 */
async function saveTelegramUser(chatId, userData = {}) {
  try {
    const url = `${DATABASE_URL}/telegram_users/${chatId}.json`;
    
    // Kiểm tra user đã tồn tại chưa
    const existingUser = await axios.get(url);
    const isNew = !existingUser.data;
    
    const userPayload = {
      chat_id: chatId.toString(),
      is_active: true,
      last_active: new Date().toISOString(),
      ...userData,
      ...(isNew ? { registered_at: new Date().toISOString() } : {})
    };
    
    await axios.put(url, userPayload);
    
    console.log(`✅ ${isNew ? 'Đăng ký người dùng mới' : 'Cập nhật người dùng'}: ${chatId}`);
    return { isNew, chatId };
  } catch (error) {
    console.error(`❌ Lỗi lưu người dùng ${chatId}:`, error.message);
    throw error;
  }
}

/**
 * Lấy tất cả người dùng đang hoạt động
 * @returns {Array} Danh sách chat_id
 */
async function getActiveUsers() {
  try {
    const url = `${DATABASE_URL}/telegram_users.json`;
    const response = await axios.get(url);
    
    if (!response.data) {
      console.log('📊 Chưa có người dùng nào đăng ký');
      return [];
    }
    
    const activeUsers = Object.entries(response.data)
      .filter(([_, user]) => user.is_active === true)
      .map(([chatId, _]) => chatId);
    
    console.log(`📊 Tìm thấy ${activeUsers.length} người dùng đang hoạt động`);
    return activeUsers;
  } catch (error) {
    console.error('❌ Lỗi lấy danh sách người dùng:', error.message);
    return [];
  }
}

/**
 * Vô hiệu hóa người dùng
 * @param {string} chatId - Telegram Chat ID
 */
async function deactivateUser(chatId) {
  try {
    const url = `${DATABASE_URL}/telegram_users/${chatId}.json`;
    
    // Get current user data
    const response = await axios.get(url);
    if (!response.data) {
      console.log(`⚠️ Người dùng ${chatId} không tồn tại`);
      return;
    }
    
    const updatedUser = {
      ...response.data,
      is_active: false,
      deactivated_at: new Date().toISOString()
    };
    
    await axios.put(url, updatedUser);
    console.log(`✅ Đã vô hiệu hóa người dùng: ${chatId}`);
  } catch (error) {
    console.error(`❌ Lỗi vô hiệu hóa người dùng ${chatId}:`, error.message);
    throw error;
  }
}

/**
 * Lưu hoặc cập nhật thông tin khu vực ngập lụt
 * @param {string} zoneId - ID khu vực
 * @param {object} zoneData - Dữ liệu khu vực
 */
async function saveFloodZone(zoneId, zoneData) {
  try {
    const url = `${DATABASE_URL}/flood_zones/${zoneId}.json`;
    
    const payload = {
      zone_id: zoneId,
      current_level: zoneData.current_level || 0,
      threshold_level: zoneData.threshold_level || 100,
      alert_status: zoneData.alert_status || 'normal',
      last_updated: new Date().toISOString(),
      ...zoneData
    };
    
    await axios.put(url, payload);
    console.log(`✅ Đã cập nhật khu vực ngập lụt: ${zoneId}`);
    return { zoneId, ...payload };
  } catch (error) {
    console.error(`❌ Lỗi lưu khu vực ${zoneId}:`, error.message);
    throw error;
  }
}

/**
 * Lấy thông tin khu vực ngập lụt
 * @param {string} zoneId - ID khu vực
 * @returns {object} Thông tin khu vực
 */
async function getFloodZone(zoneId) {
  try {
    const url = `${DATABASE_URL}/flood_zones/${zoneId}.json`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`❌ Lỗi lấy thông tin khu vực ${zoneId}:`, error.message);
    return null;
  }
}

/**
 * Lấy tất cả khu vực đang có cảnh báo
 * @returns {Array} Danh sách khu vực đang có cảnh báo
 */
async function getAlertingZones() {
  try {
    const url = `${DATABASE_URL}/flood_zones.json`;
    const response = await axios.get(url);
    
    if (!response.data) {
      console.log('⚠️ Chưa có khu vực nào');
      return [];
    }
    
    const alertingZones = Object.values(response.data)
      .filter(zone => ['warning', 'danger', 'critical'].includes(zone.alert_status));
    
    console.log(`⚠️ Tìm thấy ${alertingZones.length} khu vực đang cảnh báo`);
    return alertingZones;
  } catch (error) {
    console.error('❌ Lỗi lấy danh sách khu vực cảnh báo:', error.message);
    return [];
  }
}

/**
 * Xóa toàn bộ dữ liệu (cho test)
 */
async function clearAllData() {
  try {
    await axios.delete(`${DATABASE_URL}/telegram_users.json`);
    await axios.delete(`${DATABASE_URL}/flood_zones.json`);
    console.log('✅ Đã xóa toàn bộ dữ liệu');
  } catch (error) {
    console.error('❌ Lỗi xóa dữ liệu:', error.message);
  }
}

module.exports = {
  saveTelegramUser,
  getActiveUsers,
  deactivateUser,
  saveFloodZone,
  getFloodZone,
  getAlertingZones,
  clearAllData
};
