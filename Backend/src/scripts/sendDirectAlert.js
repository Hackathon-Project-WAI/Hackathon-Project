/**
 * Test gửi cảnh báo trực tiếp (Không cần Long Polling)
 */

require('dotenv').config();
const axios = require('axios');
const { saveFloodZone } = require('./firebaseRealtimeManager');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Lấy chat_id từ tham số command line
const chatId = process.argv[2];

if (!chatId) {
  console.log('❌ Thiếu chat_id!');
  console.log('\n📖 Cách sử dụng:');
  console.log('   1. Gửi /start cho bot @AquarouteAI_bot trên Telegram');
  console.log('   2. Chạy: node sendDirectAlert.js YOUR_CHAT_ID');
  console.log('\n💡 Hoặc lấy chat_id tự động:');
  console.log('   node sendDirectAlert.js auto\n');
  process.exit(1);
}

async function getLatestChatId() {
  try {
    const response = await axios.get(`${TELEGRAM_API_URL}/getUpdates`);
    if (response.data.result && response.data.result.length > 0) {
      const lastMessage = response.data.result[response.data.result.length - 1];
      return lastMessage.message?.chat?.id || lastMessage.message?.from?.id;
    }
    return null;
  } catch (error) {
    console.error('❌ Lỗi lấy chat_id:', error.message);
    return null;
  }
}

async function sendAlert(chatId, message) {
  try {
    const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown'
    });
    
    if (response.data.ok) {
      console.log(`✅ Đã gửi cảnh báo tới chat_id: ${chatId}`);
      return true;
    } else {
      console.error(`❌ Lỗi gửi: ${response.data.description}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Lỗi gửi tin nhắn:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚨 TEST GỬI CẢNH BÁO TRỰC TIẾP\n');
  
  let targetChatId = chatId;
  
  // Nếu là "auto", tự động lấy chat_id
  if (chatId === 'auto') {
    console.log('🔍 Đang tự động lấy chat_id...');
    targetChatId = await getLatestChatId();
    if (!targetChatId) {
      console.log('❌ Không tìm thấy chat_id. Hãy gửi /start cho bot trước!');
      process.exit(1);
    }
    console.log(`✅ Tìm thấy chat_id: ${targetChatId}\n`);
  }
  
  // Tạo tin nhắn cảnh báo test
  const alertMessage = `
🔴 *CẢNH BÁO NGẬP LỤT KHẨN CẤP* 🔴

🌊 *Khu vực:* Quận Hải Châu (Test)
📊 *Mực nước:* 150 cm
⚡ *Ngưỡng cảnh báo:* 100 cm
🔴 *Mức độ:* CỰC KỲ NGUY HIỂM

⏰ *Thời gian:* ${new Date().toLocaleString('vi-VN')}

⚠️ *KHUYẾN NGHỊ AN TOÀN:*
• ⛔ SƠ TÁN NGAY LẬP TỨC
• Di chuyển đến nơi cao
• Gọi 113/114/115 nếu cần hỗ trợ
• KHÔNG cố gắng đi qua vùng ngập
• Bảo vệ tính mạng là ưu tiên

🚨 _Đây là tin nhắn TEST từ Hệ thống Cảnh báo Ngập lụt_
  `.trim();
  
  // Gửi cảnh báo
  console.log('📤 Đang gửi cảnh báo...\n');
  const success = await sendAlert(targetChatId, alertMessage);
  
  if (success) {
    console.log('\n✅ TEST THÀNH CÔNG!');
    console.log('📱 Kiểm tra Telegram để xem tin nhắn cảnh báo\n');
    
    // Lưu vào Firebase (optional)
    try {
      await saveFloodZone('zone_test_direct', {
        zone_name: 'Quận Hải Châu (Test)',
        current_level: 150,
        threshold_level: 100,
        alert_status: 'critical'
      });
      console.log('💾 Đã lưu thông tin khu vực vào Firebase');
    } catch (e) {
      console.log('⚠️ Không lưu được vào Firebase:', e.message);
    }
  } else {
    console.log('\n❌ TEST THẤT BẠI!');
    console.log('Kiểm tra lại chat_id hoặc Bot Token\n');
  }
}

main().then(() => process.exit(0)).catch(error => {
  console.error('❌ Lỗi:', error.message);
  process.exit(1);
});
