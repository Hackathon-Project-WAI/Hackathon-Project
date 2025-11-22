/**
 * Telegram Status Controller
 * Kiểm tra trạng thái liên kết Telegram của user
 */

const admin = require('firebase-admin');

/**
 * Kiểm tra user đã liên kết Telegram chưa
 * @route GET /api/telegram/status?userId=xxx
 */
async function checkTelegramStatus(req, res) {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing userId parameter',
      });
    }

    const db = admin.database();
    
    // Kiểm tra chat_id trong userProfile
    const chatIdRef = db.ref(`userProfiles/${userId}/telegramChatId`);
    const chatIdSnapshot = await chatIdRef.once('value');
    const chatId = chatIdSnapshot.val();
    
    // Kiểm tra có username không
    let telegramUsername = null;
    if (chatId) {
      const telegramUserRef = db.ref('telegram_users').orderByChild('chat_id').equalTo(chatId);
      const telegramSnapshot = await telegramUserRef.once('value');
      
      if (telegramSnapshot.exists()) {
        const users = telegramSnapshot.val();
        const userKey = Object.keys(users)[0];
        telegramUsername = users[userKey].username || users[userKey].first_name || 'User';
      }
    }

    const isLinked = !!chatId;

    return res.json({
      success: true,
      data: {
        isLinked: isLinked,
        chatId: chatId,
        username: telegramUsername,
        linkedAt: isLinked ? chatIdSnapshot.val() : null,
      },
    });
  } catch (error) {
    console.error('❌ Error checking Telegram status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
}

/**
 * Hủy liên kết Telegram
 * @route DELETE /api/telegram/unlink?userId=xxx
 */
async function unlinkTelegram(req, res) {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing userId parameter',
      });
    }

    const db = admin.database();
    
    // Lấy chat_id trước khi xóa
    const chatIdRef = db.ref(`userProfiles/${userId}/telegramChatId`);
    const chatIdSnapshot = await chatIdRef.once('value');
    const chatId = chatIdSnapshot.val();
    
    if (!chatId) {
      return res.json({
        success: true,
        message: 'User chưa liên kết Telegram',
      });
    }

    // Xóa chat_id khỏi userProfile
    await chatIdRef.remove();
    
    // Xóa firebase_user_id khỏi telegram_users (giữ lại record để có thể link lại)
    const telegramUserRef = db.ref('telegram_users').orderByChild('chat_id').equalTo(chatId);
    const telegramSnapshot = await telegramUserRef.once('value');
    
    if (telegramSnapshot.exists()) {
      const users = telegramSnapshot.val();
      const updates = {};
      
      Object.keys(users).forEach(key => {
        updates[`telegram_users/${key}/firebase_user_id`] = null;
        updates[`telegram_users/${key}/email`] = null;
      });
      
      await db.ref().update(updates);
    }

    console.log(`✅ User ${userId} đã hủy liên kết Telegram (chat_id: ${chatId})`);

    return res.json({
      success: true,
      message: 'Đã hủy liên kết Telegram thành công',
    });
  } catch (error) {
    console.error('❌ Error unlinking Telegram:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
}

module.exports = {
  checkTelegramStatus,
  unlinkTelegram,
};
