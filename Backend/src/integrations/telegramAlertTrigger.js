/**
 * Telegram Bot Alert Trigger Service
 * Dịch vụ gửi cảnh báo ngập lụt chủ động đến người dùng
 */

require('dotenv').config();
const axios = require('axios');
const { getActiveUsers, getAlertingZones, saveFloodZone } = require('./firebaseRealtimeManager');

// Cấu hình Bot
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

/**
 * Gửi tin nhắn tới người dùng Telegram
 * @param {string} chatId - Telegram Chat ID
 * @param {string} message - Nội dung tin nhắn
 * @param {object} options - Tùy chọn bổ sung
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
 * @param {object} zone - Thông tin khu vực ngập lụt
 * @returns {string} Tin nhắn cảnh báo
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
 * Lấy khuyến nghị an toàn dựa trên mức độ cảnh báo
 * @param {string} alertStatus - Trạng thái cảnh báo
 * @returns {string} Khuyến nghị
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
 * Gửi cảnh báo tới tất cả người dùng đang hoạt động
 * @param {object} zone - Thông tin khu vực ngập lụt
 * @returns {object} Kết quả gửi cảnh báo
 */
async function broadcastAlert(zone) {
  console.log(`\n📢 BẮT ĐẦU GỬI CẢNH BÁO: ${zone.zone_name || zone.zone_id}`);
  console.log(`⚠️ Mức độ: ${zone.alert_status.toUpperCase()}`);
  
  try {
    // Lấy danh sách người dùng đang hoạt động
    const activeUsers = await getActiveUsers();
    
    if (activeUsers.length === 0) {
      console.log('⚠️ Không có người dùng nào đang hoạt động');
      return { 
        totalUsers: 0, 
        successCount: 0, 
        failedCount: 0 
      };
    }
    
    console.log(`👥 Gửi tới ${activeUsers.length} người dùng...`);
    
    // Tạo tin nhắn cảnh báo
    const alertMessage = createAlertMessage(zone);
    
    // Gửi tin nhắn tới tất cả người dùng
    const results = [];
    let successCount = 0;
    let failedCount = 0;
    
    for (const chatId of activeUsers) {
      const result = await sendMessage(chatId, alertMessage, {
        disable_notification: false // Bật thông báo âm thanh
      });
      
      results.push(result);
      
      if (result.success) {
        successCount++;
        console.log(`✅ Đã gửi tới ${chatId}`);
      } else {
        failedCount++;
        console.log(`❌ Thất bại: ${chatId}`);
      }
      
      // Delay nhỏ để tránh bị giới hạn rate limit (30 msg/second)
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`\n📊 KẾT QUẢ GỬI CẢNH BÁO:`);
    console.log(`✅ Thành công: ${successCount}/${activeUsers.length}`);
    console.log(`❌ Thất bại: ${failedCount}/${activeUsers.length}`);
    
    return {
      totalUsers: activeUsers.length,
      successCount,
      failedCount,
      results
    };
  } catch (error) {
    console.error('❌ Lỗi broadcast cảnh báo:', error.message);
    throw error;
  }
}

/**
 * Kích hoạt cảnh báo dựa trên thay đổi mực nước
 * @param {string} zoneId - ID khu vực
 * @param {number} currentLevel - Mực nước hiện tại
 * @param {object} additionalData - Dữ liệu bổ sung
 */
async function triggerAlerts(zoneId, currentLevel, additionalData = {}) {
  console.log(`\n🔍 Kiểm tra cảnh báo cho khu vực: ${zoneId}`);
  console.log(`🌊 Mực nước: ${currentLevel} cm`);
  
  try {
    // Xác định mức độ cảnh báo
    const thresholdLevel = additionalData.threshold_level || 100;
    let alertStatus = 'normal';
    
    if (currentLevel >= thresholdLevel * 1.5) {
      alertStatus = 'critical'; // >= 150% ngưỡng
    } else if (currentLevel >= thresholdLevel * 1.2) {
      alertStatus = 'danger'; // >= 120% ngưỡng
    } else if (currentLevel >= thresholdLevel) {
      alertStatus = 'warning'; // >= 100% ngưỡng
    }
    
    console.log(`📊 Trạng thái: ${alertStatus}`);
    
    // Cập nhật thông tin khu vực trong Firestore
    const zoneData = {
      current_level: currentLevel,
      threshold_level: thresholdLevel,
      alert_status: alertStatus,
      zone_name: additionalData.zone_name || zoneId,
      ...additionalData
    };
    
    await saveFloodZone(zoneId, zoneData);
    
    // Gửi cảnh báo nếu có nguy hiểm
    if (['warning', 'danger', 'critical'].includes(alertStatus)) {
      console.log(`🚨 PHÁT HIỆN NGUY CƠ NGẬP LỤT - Bắt đầu gửi cảnh báo...`);
      const result = await broadcastAlert(zoneData);
      return {
        triggered: true,
        alertStatus,
        zoneData,
        broadcastResult: result
      };
    } else {
      console.log(`✅ Mực nước bình thường - Không cần cảnh báo`);
      return {
        triggered: false,
        alertStatus,
        zoneData
      };
    }
  } catch (error) {
    console.error(`❌ Lỗi kích hoạt cảnh báo:`, error.message);
    throw error;
  }
}

/**
 * Kiểm tra và gửi cảnh báo cho tất cả khu vực đang có nguy cơ
 */
async function checkAllZonesAndAlert() {
  console.log('\n🔍 KIỂM TRA TẤT CẢ KHU VỰC...\n');
  
  try {
    const alertingZones = await getAlertingZones();
    
    if (alertingZones.length === 0) {
      console.log('✅ Không có khu vực nào đang cảnh báo');
      return;
    }
    
    console.log(`⚠️ Tìm thấy ${alertingZones.length} khu vực đang cảnh báo\n`);
    
    for (const zone of alertingZones) {
      await broadcastAlert(zone);
      // Delay giữa các khu vực
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error('❌ Lỗi kiểm tra khu vực:', error.message);
  }
}

/**
 * Chạy service monitoring định kỳ (Demo - có thể tích hợp với IoT)
 */
async function startMonitoring(intervalMinutes = 10) {
  console.log('🔄 Khởi động dịch vụ giám sát...');
  console.log('🔥 Sử dụng Firebase Realtime Database (REST API)');
  console.log(`⏰ Chu kỳ kiểm tra: ${intervalMinutes} phút\n`);
  
  // Kiểm tra định kỳ
  setInterval(async () => {
    await checkAllZonesAndAlert();
  }, intervalMinutes * 60 * 1000);
  
  console.log('✅ Dịch vụ giám sát đang chạy...\n');
}

// Xử lý tắt ứng dụng gracefully
process.on('SIGINT', () => {
  console.log('\n👋 Đang dừng dịch vụ cảnh báo...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Đang dừng dịch vụ cảnh báo...');
  process.exit(0);
});

// Export các hàm
module.exports = {
  sendMessage,
  broadcastAlert,
  triggerAlerts,
  checkAllZonesAndAlert,
  startMonitoring
};

// Chạy standalone nếu gọi trực tiếp
if (require.main === module) {
  console.log('🚨 Telegram Bot Alert Trigger Service 🚨\n');
  
  // Ví dụ: Kích hoạt cảnh báo thủ công
  // Uncomment để test
  /*
  initializeFirebase();
  triggerAlerts('zone_001', 150, {
    zone_name: 'Quận Hải Châu',
    threshold_level: 100
  }).then(() => {
    console.log('\n✅ Hoàn tất test cảnh báo');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  });
  */
  
  // Hoặc chạy monitoring mode
  startMonitoring(10); // Kiểm tra mỗi 10 phút
}
