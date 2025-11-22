/**
 * Telegram QR Code Controller
 * Cung cấp thông tin để tạo QR code cho Telegram Bot
 */

require('dotenv').config();

const BOT_USERNAME = 'AquarouteAI_bot'; // Bot username của bạn
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Lấy thông tin QR code cho Telegram Bot
 * @route GET /api/telegram/qr-info?userId=xxx
 */
async function getTelegramQRInfo(req, res) {
  try {
    // Lấy userId từ query params (từ frontend)
    const userId = req.query.userId || 'guest';
    
    // Tạo deep link với userId để auto-link khi user START bot
    const deepLink = `https://t.me/${BOT_USERNAME}`;
    const startLink = `https://t.me/${BOT_USERNAME}?start=${userId}`;
    
    // Thông tin bot
    const botInfo = {
      username: BOT_USERNAME,
      deepLink: deepLink,
      startLink: startLink,
      qrData: startLink, // QR code chứa startLink với userId
      instructions: {
        vi: 'Quét mã QR để chat với bot ngay lập tức',
        en: 'Scan QR code to chat with bot instantly'
      },
      steps: {
        vi: [
          '1. Mở ứng dụng Telegram trên điện thoại',
          '2. Quét mã QR bằng camera Telegram',
          '3. Nhấn "Start" để bắt đầu nhận cảnh báo'
        ],
        en: [
          '1. Open Telegram app on your phone',
          '2. Scan QR code with Telegram camera',
          '3. Press "Start" to receive alerts'
        ]
      }
    };

    res.json({
      success: true,
      data: botInfo
    });
  } catch (error) {
    console.error('❌ Lỗi lấy thông tin QR:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin QR code',
      error: error.message
    });
  }
}

/**
 * Lấy thông tin chi tiết của bot (bao gồm user count)
 * @route GET /api/telegram/info
 */
async function getBotInfo(req, res) {
  try {
    const axios = require('axios');
    const { getActiveUsers } = require('../integrations/firebaseRealtimeManager');
    
    // Lấy thông tin bot từ Telegram API
    const response = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
    const botData = response.data.result;
    
    // Đếm số người dùng đã đăng ký
    const activeUsers = await getActiveUsers();
    const userCount = activeUsers.length;
    
    res.json({
      success: true,
      data: {
        id: botData.id,
        username: botData.username,
        firstName: botData.first_name,
        canJoinGroups: botData.can_join_groups,
        canReadAllGroupMessages: botData.can_read_all_group_messages,
        supportsInlineQueries: botData.supports_inline_queries,
        deepLink: `https://t.me/${botData.username}`,
        startLink: `https://t.me/${botData.username}?start=webapp`,
        qrData: `https://t.me/${botData.username}`,
        registeredUsers: userCount
      }
    });
  } catch (error) {
    console.error('❌ Lỗi lấy thông tin bot:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin bot',
      error: error.message
    });
  }
}

module.exports = {
  getTelegramQRInfo,
  getBotInfo
};
