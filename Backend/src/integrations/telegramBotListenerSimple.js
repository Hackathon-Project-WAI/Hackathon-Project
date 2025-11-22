/**
 * Telegram Bot Listener - Simple Version
 * Sử dụng Firebase Web SDK thay vì Admin SDK
 * KHÔNG cần Service Account Key
 */

require('dotenv').config();
const axios = require('axios');

// Cấu hình Bot
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
const POLLING_TIMEOUT = 60;

// Lưu users vào memory (tạm thời, sẽ mất khi restart)
const activeUsers = new Map();

let updateOffset = 0;

/**
 * Gửi tin nhắn tới người dùng Telegram
 */
async function sendMessage(chatId, message, options = {}) {
  try {
    const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: options.parse_mode || 'Markdown',
      ...options
    });
    
    if (response.data.ok) {
      console.log(`✉️ Đã gửi tin nhắn tới ${chatId}`);
      return response.data.result;
    } else {
      console.error(`❌ Lỗi gửi tin nhắn tới ${chatId}:`, response.data.description);
      return null;
    }
  } catch (error) {
    console.error(`❌ Lỗi gửi tin nhắn tới ${chatId}:`, error.message);
    return null;
  }
}

/**
 * Xử lý lệnh /start
 */
async function handleStartCommand(message) {
  const chatId = message.chat.id;
  const username = message.from.username || 'Unknown';
  const firstName = message.from.first_name || '';
  
  // Lưu user vào memory
  activeUsers.set(chatId.toString(), {
    chat_id: chatId,
    username,
    first_name: firstName,
    is_active: true,
    registered_at: new Date()
  });
  
  const welcomeMessage = `
🌊 *Chào mừng đến với Hệ thống Cảnh báo Ngập lụt Đà Nẵng!* 🌧️

Xin chào *${firstName}*! 👋

✅ Bạn đã đăng ký thành công nhận cảnh báo ngập lụt.

📍 *Những gì bạn sẽ nhận được:*
🔔 Cảnh báo ngập lụt khẩn cấp theo thời gian thực
🌊 Thông tin mực nước và khu vực nguy hiểm
⚠️ Khuyến nghị an toàn khi có ngập lụt

📱 Bạn sẽ nhận được thông báo tự động khi có cảnh báo ngập lụt trong khu vực.

🛡️ Hãy luôn cảnh giác và an toàn!

💡 *Số người dùng đang hoạt động:* ${activeUsers.size}
  `.trim();
  
  await sendMessage(chatId, welcomeMessage);
  console.log(`✅ Người dùng ${chatId} (${username}) đã đăng ký - Tổng: ${activeUsers.size} users`);
}

/**
 * Xử lý lệnh /stop
 */
async function handleStopCommand(message) {
  const chatId = message.chat.id;
  
  activeUsers.delete(chatId.toString());
  
  const goodbyeMessage = `
👋 *Tạm biệt!*

Bạn đã hủy đăng ký nhận cảnh báo ngập lụt.

Để đăng ký lại, sử dụng lệnh /start bất kỳ lúc nào.

🙏 Cảm ơn bạn đã sử dụng dịch vụ!
  `.trim();
  
  await sendMessage(chatId, goodbyeMessage);
  console.log(`✅ Người dùng ${chatId} đã hủy đăng ký - Còn: ${activeUsers.size} users`);
}

/**
 * Xử lý lệnh /status
 */
async function handleStatusCommand(message) {
  const chatId = message.chat.id;
  
  const statusMessage = `
📊 *Trạng thái Hệ thống*

✅ Bot đang hoạt động bình thường
🔔 Bạn đang nhận cảnh báo
� Tổng người dùng: ${activeUsers.size}
🕐 Cập nhật: ${new Date().toLocaleString('vi-VN')}

📱 Sử dụng /help để xem danh sách lệnh
  `.trim();
  
  await sendMessage(chatId, statusMessage);
}

/**
 * Xử lý lệnh /help
 */
async function handleHelpCommand(message) {
  const chatId = message.chat.id;
  
  const helpMessage = `
📖 *Hướng dẫn Sử dụng*

*Các lệnh có sẵn:*
/start - Đăng ký nhận cảnh báo
/stop - Hủy đăng ký
/status - Kiểm tra trạng thái
/help - Hiển thị hướng dẫn
/users - Số người dùng đang hoạt động

⚡ *Cảnh báo tự động:*
Bot sẽ tự động gửi cảnh báo khi phát hiện nguy cơ ngập lụt.

💡 *Mẹo:* Bật thông báo để không bỏ lỡ cảnh báo khẩn cấp!
  `.trim();
  
  await sendMessage(chatId, helpMessage);
}

/**
 * Xử lý lệnh /users (admin)
 */
async function handleUsersCommand(message) {
  const chatId = message.chat.id;
  
  const usersMessage = `
� *Thống kê Người dùng*

� Tổng số người dùng đang hoạt động: *${activeUsers.size}*

${Array.from(activeUsers.values()).slice(0, 10).map((user, i) => 
  `${i + 1}. ${user.first_name || 'Unknown'} (@${user.username || 'N/A'})`
).join('\n')}

${activeUsers.size > 10 ? `\n... và ${activeUsers.size - 10} người khác` : ''}
  `.trim();
  
  await sendMessage(chatId, usersMessage);
}

/**
 * Xử lý tin nhắn từ người dùng
 */
async function handleMessage(message) {
  const text = message.text || '';
  
  if (text.startsWith('/start')) {
    await handleStartCommand(message);
  } else if (text.startsWith('/stop')) {
    await handleStopCommand(message);
  } else if (text.startsWith('/status')) {
    await handleStatusCommand(message);
  } else if (text.startsWith('/help')) {
    await handleHelpCommand(message);
  } else if (text.startsWith('/users')) {
    await handleUsersCommand(message);
  } else {
    const chatId = message.chat.id;
    await sendMessage(
      chatId,
      '👋 Xin chào! Sử dụng /help để xem danh sách lệnh.'
    );
  }
}

/**
 * Xử lý các updates từ Telegram
 */
async function processUpdates(updates) {
  for (const update of updates) {
    try {
      updateOffset = Math.max(updateOffset, update.update_id + 1);
      
      if (update.message) {
        await handleMessage(update.message);
      }
    } catch (error) {
      console.error('❌ Lỗi xử lý update:', error.message);
    }
  }
}

/**
 * Lấy updates từ Telegram sử dụng Long Polling
 */
async function getUpdates() {
  try {
    const response = await axios.get(`${TELEGRAM_API_URL}/getUpdates`, {
      params: {
        offset: updateOffset,
        timeout: POLLING_TIMEOUT,
        allowed_updates: ['message']
      },
      timeout: (POLLING_TIMEOUT + 5) * 1000
    });
    
    if (response.data.ok && response.data.result.length > 0) {
      console.log(`📨 Nhận được ${response.data.result.length} updates mới`);
      await processUpdates(response.data.result);
    }
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      return;
    }
    console.error('❌ Lỗi lấy updates:', error.message);
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

/**
 * Khởi động Bot với Long Polling
 */
async function startBot() {
  console.log('🤖 Khởi động Telegram Bot (Simple Mode - No Firebase)...');
  
  // Kiểm tra Bot Token
  try {
    const response = await axios.get(`${TELEGRAM_API_URL}/getMe`);
    if (response.data.ok) {
      console.log(`✅ Bot đã kết nối: @${response.data.result.username}`);
      console.log(`⚠️  Chế độ: In-Memory (users sẽ mất khi restart)`);
    } else {
      console.error('❌ Bot Token không hợp lệ');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Không thể kết nối với Telegram API:', error.message);
    process.exit(1);
  }
  
  console.log('🔄 Bắt đầu Long Polling...');
  console.log('📡 Đang lắng nghe tin nhắn từ người dùng...\n');
  
  // Vòng lặp Long Polling vô tận
  while (true) {
    await getUpdates();
  }
}

// Xử lý tắt ứng dụng gracefully
process.on('SIGINT', () => {
  console.log(`\n👋 Đang dừng Bot... (Đã phục vụ ${activeUsers.size} users)`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(`\n👋 Đang dừng Bot... (Đã phục vụ ${activeUsers.size} users)`);
  process.exit(0);
});

// Export để sử dụng từ alert trigger
module.exports = {
  sendMessage,
  startBot,
  getActiveUsers: () => Array.from(activeUsers.keys())
};

// Khởi động Bot
if (require.main === module) {
  startBot().catch(error => {
    console.error('❌ Lỗi nghiêm trọng:', error);
    process.exit(1);
  });
}
