/**
 * Firestore Data Management for Telegram Bot
 * Quản lý dữ liệu người dùng và khu vực ngập lụt
 */

const { getFirestore } = require('./telegramFirebaseConfig');

// Collection names
const COLLECTIONS = {
  TELEGRAM_USERS: 'telegram_users',
  FLOOD_ZONES: 'flood_zones'
};

/**
 * Lưu hoặc cập nhật thông tin người dùng Telegram
 * @param {string} chatId - Telegram Chat ID
 * @param {object} userData - Dữ liệu người dùng bổ sung
 */
async function saveTelegramUser(chatId, userData = {}) {
  try {
    const db = getFirestore();
    const userRef = db.collection(COLLECTIONS.TELEGRAM_USERS).doc(chatId.toString());
    
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      // Cập nhật người dùng hiện có
      await userRef.update({
        is_active: true,
        last_active: new Date(),
        ...userData
      });
      console.log(`✅ Đã cập nhật người dùng: ${chatId}`);
      return { isNew: false, chatId };
    } else {
      // Tạo người dùng mới
      await userRef.set({
        chat_id: chatId.toString(),
        is_active: true,
        registered_at: new Date(),
        last_active: new Date(),
        ...userData
      });
      console.log(`✅ Đã đăng ký người dùng mới: ${chatId}`);
      return { isNew: true, chatId };
    }
  } catch (error) {
    console.error(`❌ Lỗi lưu người dùng ${chatId}:`, error.message);
    throw error;
  }
}

/**
 * Lấy tất cả người dùng đang hoạt động
 * @returns {Array} Danh sách chat_id của người dùng đang hoạt động
 */
async function getActiveUsers() {
  try {
    const db = getFirestore();
    const snapshot = await db
      .collection(COLLECTIONS.TELEGRAM_USERS)
      .where('is_active', '==', true)
      .get();
    
    const activeUsers = [];
    snapshot.forEach(doc => {
      activeUsers.push(doc.id);
    });
    
    console.log(`📊 Tìm thấy ${activeUsers.length} người dùng đang hoạt động`);
    return activeUsers;
  } catch (error) {
    console.error('❌ Lỗi lấy danh sách người dùng:', error.message);
    throw error;
  }
}

/**
 * Vô hiệu hóa người dùng (khi họ dừng bot)
 * @param {string} chatId - Telegram Chat ID
 */
async function deactivateUser(chatId) {
  try {
    const db = getFirestore();
    await db.collection(COLLECTIONS.TELEGRAM_USERS).doc(chatId.toString()).update({
      is_active: false,
      deactivated_at: new Date()
    });
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
    const db = getFirestore();
    const zoneRef = db.collection(COLLECTIONS.FLOOD_ZONES).doc(zoneId);
    
    await zoneRef.set({
      zone_id: zoneId,
      current_level: zoneData.current_level || 0,
      threshold_level: zoneData.threshold_level || 100,
      alert_status: zoneData.alert_status || 'normal',
      last_updated: new Date(),
      ...zoneData
    }, { merge: true });
    
    console.log(`✅ Đã cập nhật khu vực ngập lụt: ${zoneId}`);
    return { zoneId, ...zoneData };
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
    const db = getFirestore();
    const doc = await db.collection(COLLECTIONS.FLOOD_ZONES).doc(zoneId).get();
    
    if (doc.exists) {
      return doc.data();
    }
    return null;
  } catch (error) {
    console.error(`❌ Lỗi lấy thông tin khu vực ${zoneId}:`, error.message);
    throw error;
  }
}

/**
 * Lấy tất cả khu vực đang có cảnh báo
 * @returns {Array} Danh sách khu vực đang có cảnh báo
 */
async function getAlertingZones() {
  try {
    const db = getFirestore();
    const snapshot = await db
      .collection(COLLECTIONS.FLOOD_ZONES)
      .where('alert_status', 'in', ['warning', 'danger', 'critical'])
      .get();
    
    const alertingZones = [];
    snapshot.forEach(doc => {
      alertingZones.push(doc.data());
    });
    
    console.log(`⚠️ Tìm thấy ${alertingZones.length} khu vực đang cảnh báo`);
    return alertingZones;
  } catch (error) {
    console.error('❌ Lỗi lấy danh sách khu vực cảnh báo:', error.message);
    throw error;
  }
}

module.exports = {
  saveTelegramUser,
  getActiveUsers,
  deactivateUser,
  saveFloodZone,
  getFloodZone,
  getAlertingZones,
  COLLECTIONS
};
