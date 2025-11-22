/**
 * Telegram Alert Trigger - Simple Version
 * Không cần Firebase - Lấy users từ listener service
 */

require('dotenv').config();
const axios = require('axios');

// Cấu hình Bot
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

/**
 * Gửi tin nhắn tới người dùng Telegram
 */
async function sendMessage(chatId, message, options = {}) {
  try {
    const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: options.parse_mode || 'Markdown',
      disable_notification: options.disable_notification || false,
      ...options
    });
    
    if (response.data.ok) {
      return { success: true, chatId };
    } else {
      console.error(`❌ Lỗi gửi tin nhắn tới ${chatId}:`, response.data.description);
      return { success: false, chatId, error: response.data.description };
    }
  } catch (error) {
    console.error(`❌ Lỗi gửi tin nhắn tới ${chatId}:`, error.message);
    return { success: false, chatId, error: error.message };
  }
}

/**
 * Tạo tin nhắn cảnh báo dựa trên mức độ nguy hiểm
 */
function createAlertMessage(zone) {
  const { zone_id, current_level, threshold_level, alert_status, zone_name } = zone;
  
  let emoji = '⚠️';
  let statusText = 'CẢNH BÁO';
  let urgency = 'Cần chú ý';
  
  switch (alert_status) {
    case 'warning':
      emoji = '⚠️';
      statusText = 'CẢNH BÁO';
      urgency = 'Cần chú ý';
      break;
    case 'danger':
      emoji = '🚨';
      statusText = 'NGUY HIỂM';
      urgency = 'Rất nghiêm trọng';
      break;
    case 'critical':
      emoji = '🔴';
      statusText = 'KHẨN CẤP';
      urgency = 'CỰC KỲ NGUY HIỂM';
      break;
  }
  
  const message = `
${emoji} *${statusText}: NGẬP LỤT* ${emoji}

🌊 *Khu vực:* ${zone_name || zone_id}
📊 *Mực nước hiện tại:* ${current_level} cm
⚡ *Ngưỡng cảnh báo:* ${threshold_level} cm
🔴 *Mức độ:* ${urgency}

⏰ *Thời gian:* ${new Date().toLocaleString('vi-VN')}

⚠️ *KHUYẾN NGHỊ AN TOÀN:*
${getRecommendations(alert_status)}

🚨 Hãy theo dõi thông tin cập nhật và thực hiện biện pháp an toàn!

_Tin nhắn từ Hệ thống Cảnh báo Ngập lụt Đà Nẵng_
  `.trim();
  
  return message;
}

/**
 * Lấy khuyến nghị an toàn
 */
function getRecommendations(alertStatus) {
  const recommendations = {
    warning: `
• Theo dõi tình hình thời tiết
• Chuẩn bị đồ dùng cần thiết
• Tránh di chuyển không cần thiết
    `,
    danger: `
• KHÔNG đi qua khu vực ngập nước
• Di chuyển đến nơi an toàn
• Chuẩn bị sẵn sàng sơ tán nếu cần
• Ngắt điện, khóa van gas
    `,
    critical: `
• ⛔ SƠ TÁN NGAY LẬP TỨC
• Di chuyển đến nơi cao
• Gọi 113/114/115 nếu cần hỗ trợ
• KHÔNG cố gắng đi qua vùng ngập
• Bảo vệ tính mạng là ưu tiên
    `
  };
  
  return recommendations[alertStatus] || recommendations.warning;
}

/**
 * Gửi cảnh báo test (không cần Firebase)
 */
async function sendTestAlert(chatIds, zoneData) {
  console.log(`\n📢 GỬI CẢNH BÁO TEST`);
  console.log(`⚠️ Khu vực: ${zoneData.zone_name || zoneData.zone_id}`);
  console.log(`👥 Số người nhận: ${chatIds.length}`);
  
  if (chatIds.length === 0) {
    console.log('⚠️ Không có người dùng nào để gửi');
    return { totalUsers: 0, successCount: 0, failedCount: 0 };
  }
  
  const alertMessage = createAlertMessage(zoneData);
  
  let successCount = 0;
  let failedCount = 0;
  
  for (const chatId of chatIds) {
    const result = await sendMessage(chatId, alertMessage, {
      disable_notification: false
    });
    
    if (result.success) {
      successCount++;
      console.log(`✅ Đã gửi tới ${chatId}`);
    } else {
      failedCount++;
      console.log(`❌ Thất bại: ${chatId}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  console.log(`\n📊 KẾT QUẢ:`);
  console.log(`✅ Thành công: ${successCount}/${chatIds.length}`);
  console.log(`❌ Thất bại: ${failedCount}/${chatIds.length}`);
  
  return { totalUsers: chatIds.length, successCount, failedCount };
}

/**
 * Demo function - Gửi cảnh báo test
 */
async function runDemo() {
  console.log('🚨 TELEGRAM ALERT DEMO (Simple Mode)\n');
  console.log('⚠️  Chế độ demo - Cần nhập chat_id thủ công\n');
  
  // Demo data
  const demoZone = {
    zone_id: 'zone_demo',
    zone_name: 'Quận Hải Châu (Demo)',
    current_level: 150,
    threshold_level: 100,
    alert_status: 'danger'
  };
  
  console.log('📋 Để gửi cảnh báo test:');
  console.log('1. Mở Telegram và gửi /start cho bot');
  console.log('2. Copy chat_id từ log của bot listener');
  console.log('3. Chạy: node telegramAlertTriggerSimple.js <chat_id>');
  console.log('\nVí dụ: node telegramAlertTriggerSimple.js 123456789\n');
  
  // Kiểm tra argument
  const chatId = process.argv[2];
  
  if (chatId) {
    console.log(`🎯 Gửi cảnh báo test tới chat_id: ${chatId}\n`);
    await sendTestAlert([chatId], demoZone);
  } else {
    console.log('💡 Để test, chạy với chat_id:\n');
    console.log('   node telegramAlertTriggerSimple.js YOUR_CHAT_ID\n');
  }
  
  process.exit(0);
}

// Export functions
module.exports = {
  sendMessage,
  sendTestAlert,
  createAlertMessage
};

// Chạy demo nếu gọi trực tiếp
if (require.main === module) {
  runDemo();
}
