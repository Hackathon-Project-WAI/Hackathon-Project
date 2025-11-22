/**
 * Mock Flood Data và Trigger Alert Tự động
 * Script này sẽ:
 * 1. Tạo dữ liệu ngập lụt giả lập
 * 2. Lưu vào Firebase
 * 3. Tự động gửi cảnh báo tới tất cả users đã đăng ký
 */

require('dotenv').config();
const axios = require('axios');
const { saveFloodZone, getActiveUsers } = require('./firebaseRealtimeManager');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Danh sách khu vực tại Đà Nẵng
const DA_NANG_ZONES = [
  { id: 'hai_chau', name: 'Quận Hải Châu', threshold: 100 },
  { id: 'thanh_khe', name: 'Quận Thanh Khê', threshold: 100 },
  { id: 'son_tra', name: 'Quận Sơn Trà', threshold: 120 },
  { id: 'ngu_hanh_son', name: 'Quận Ngũ Hành Sơn', threshold: 80 },
  { id: 'lien_chieu', name: 'Quận Liên Chiểu', threshold: 90 },
  { id: 'cam_le', name: 'Quận Cẩm Lệ', threshold: 100 },
  { id: 'hoa_vang', name: 'Huyện Hòa Vang', threshold: 110 }
];

/**
 * Tạo tin nhắn cảnh báo chi tiết
 */
function createDetailedAlert(zone, waterLevel) {
  const { name, threshold } = zone;
  const percentage = Math.round((waterLevel / threshold) * 100);
  
  let emoji = '⚠️';
  let statusText = 'CẢNH BÁO';
  let urgencyLevel = 'Cần chú ý';
  let recommendations = '';
  
  if (waterLevel >= threshold * 1.5) {
    emoji = '🔴';
    statusText = 'KHẨN CẤP';
    urgencyLevel = 'CỰC KỲ NGUY HIỂM';
    recommendations = `
⛔ *SƠ TÁN NGAY LẬP TỨC*
• Di chuyển đến nơi cao hơn
• Gọi 113/114/115 nếu cần hỗ trợ
• KHÔNG đi qua vùng ngập sâu
• Ngắt điện, khóa van gas
• Bảo vệ tính mạng là ưu tiên số 1`;
  } else if (waterLevel >= threshold * 1.2) {
    emoji = '🚨';
    statusText = 'NGUY HIỂM';
    urgencyLevel = 'Rất nghiêm trọng';
    recommendations = `
🚨 *HÀNH ĐỘNG NGAY*
• KHÔNG đi qua khu vực ngập nước
• Di chuyển đến nơi an toàn
• Chuẩn bị sẵn sàng sơ tán
• Ngắt điện, khóa van gas
• Theo dõi thông tin liên tục`;
  } else {
    emoji = '⚠️';
    statusText = 'CẢNH BÁO';
    urgencyLevel = 'Cần cảnh giác';
    recommendations = `
⚠️ *CHUẨN BỊ*
• Theo dõi tình hình thời tiết
• Chuẩn bị đồ dùng cần thiết
• Tránh di chuyển không cần thiết
• Kiểm tra tài sản, tài liệu quan trọng`;
  }
  
  const message = `
${emoji} *${statusText}: NGẬP LỤT ĐÀ NẴNG* ${emoji}

📍 *Khu vực:* ${name}
🌊 *Mực nước hiện tại:* ${waterLevel} cm
📊 *Ngưỡng cảnh báo:* ${threshold} cm
📈 *Tỷ lệ:* ${percentage}% ngưỡng
🔴 *Mức độ:* ${urgencyLevel}

⏰ *Thời gian:* ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}

${recommendations}

📞 *SỐ ĐIỆN THOẠI KHẨN CẤP:*
• Công an: 113
• Cứu hỏa: 114
• Cấp cứu: 115
• Trung tâm chỉ huy Phòng chống lụt bão: 0236.3822.166

🔔 _Tin nhắn từ Hệ thống Cảnh báo Ngập lụt Đà Nẵng_
  `.trim();
  
  return message;
}

/**
 * Gửi tin nhắn tới một user
 */
async function sendMessage(chatId, message) {
  try {
    const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown'
    });
    return response.data.ok;
  } catch (error) {
    console.error(`❌ Lỗi gửi tới ${chatId}:`, error.message);
    return false;
  }
}

/**
 * Broadcast cảnh báo tới tất cả users
 */
async function broadcastAlert(zone, waterLevel) {
  console.log(`\n📢 BROADCAST CẢNH BÁO: ${zone.name}`);
  console.log(`🌊 Mực nước: ${waterLevel} cm (Ngưỡng: ${zone.threshold} cm)\n`);
  
  // Lấy danh sách users
  const activeUsers = await getActiveUsers();
  
  if (activeUsers.length === 0) {
    console.log('⚠️ Không có người dùng nào đăng ký!');
    return { total: 0, success: 0, failed: 0 };
  }
  
  console.log(`👥 Đang gửi tới ${activeUsers.length} người dùng...`);
  
  // Tạo tin nhắn
  const message = createDetailedAlert(zone, waterLevel);
  
  // Gửi tới từng user
  let successCount = 0;
  let failedCount = 0;
  
  for (const chatId of activeUsers) {
    const success = await sendMessage(chatId, message);
    if (success) {
      successCount++;
      console.log(`  ✅ Đã gửi tới ${chatId}`);
    } else {
      failedCount++;
      console.log(`  ❌ Thất bại: ${chatId}`);
    }
    
    // Delay để tránh rate limit
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n📊 KẾT QUẢ:`);
  console.log(`  ✅ Thành công: ${successCount}/${activeUsers.length}`);
  console.log(`  ❌ Thất bại: ${failedCount}/${activeUsers.length}`);
  
  return { total: activeUsers.length, success: successCount, failed: failedCount };
}

/**
 * Mock dữ liệu ngập lụt và trigger alert
 */
async function triggerFloodAlert(zoneId, waterLevel) {
  console.log('\n🌊 KÍCH HOẠT CẢNH BÁO NGẬP LỤT\n');
  console.log('═'.repeat(60));
  
  // Tìm khu vực
  const zone = DA_NANG_ZONES.find(z => z.id === zoneId);
  if (!zone) {
    console.error(`❌ Không tìm thấy khu vực: ${zoneId}`);
    console.log('\n📋 Danh sách khu vực có sẵn:');
    DA_NANG_ZONES.forEach(z => {
      console.log(`  • ${z.id} - ${z.name}`);
    });
    return;
  }
  
  // Xác định mức độ cảnh báo
  const { threshold } = zone;
  let alertStatus = 'normal';
  
  if (waterLevel >= threshold * 1.5) {
    alertStatus = 'critical';
  } else if (waterLevel >= threshold * 1.2) {
    alertStatus = 'danger';
  } else if (waterLevel >= threshold) {
    alertStatus = 'warning';
  }
  
  console.log(`📍 Khu vực: ${zone.name}`);
  console.log(`🌊 Mực nước: ${waterLevel} cm`);
  console.log(`📊 Ngưỡng: ${threshold} cm`);
  console.log(`⚠️ Trạng thái: ${alertStatus.toUpperCase()}`);
  console.log('═'.repeat(60));
  
  // Lưu vào Firebase
  try {
    await saveFloodZone(zoneId, {
      zone_name: zone.name,
      current_level: waterLevel,
      threshold_level: threshold,
      alert_status: alertStatus
    });
    console.log('\n💾 Đã lưu dữ liệu vào Firebase');
  } catch (error) {
    console.error('❌ Lỗi lưu Firebase:', error.message);
  }
  
  // Chỉ gửi cảnh báo nếu vượt ngưỡng
  if (['warning', 'danger', 'critical'].includes(alertStatus)) {
    await broadcastAlert(zone, waterLevel);
  } else {
    console.log('\n✅ Mực nước bình thường - Không cần cảnh báo');
  }
  
  console.log('\n═'.repeat(60));
  console.log('✅ HOÀN TẤT\n');
}

// Chạy script
if (require.main === module) {
  const zoneId = process.argv[2];
  const waterLevel = parseInt(process.argv[3]);
  
  if (!zoneId || !waterLevel) {
    console.log('📖 HƯỚNG DẪN SỬ DỤNG:\n');
    console.log('  node mockFloodAlert.js <zone_id> <water_level>');
    console.log('\n📋 DANH SÁCH KHU VỰC:\n');
    DA_NANG_ZONES.forEach(zone => {
      console.log(`  ${zone.id.padEnd(20)} - ${zone.name.padEnd(25)} (Ngưỡng: ${zone.threshold} cm)`);
    });
    console.log('\n💡 VÍ DỤ:\n');
    console.log('  # Cảnh báo nhẹ (vừa đạt ngưỡng)');
    console.log('  node mockFloodAlert.js hai_chau 100');
    console.log('');
    console.log('  # Cảnh báo nguy hiểm (120% ngưỡng)');
    console.log('  node mockFloodAlert.js thanh_khe 120');
    console.log('');
    console.log('  # Cảnh báo khẩn cấp (150%+ ngưỡng)');
    console.log('  node mockFloodAlert.js son_tra 180');
    console.log('');
    process.exit(1);
  }
  
  triggerFloodAlert(zoneId, waterLevel)
    .then(() => process.exit(0))
    .catch(error => {
      console.error('\n❌ LỖI:', error.message);
      process.exit(1);
    });
}

module.exports = { triggerFloodAlert, DA_NANG_ZONES };
