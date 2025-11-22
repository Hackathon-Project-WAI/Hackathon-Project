/**
 * Test Script for Telegram Alert System
 * Script này giúp test chức năng gửi cảnh báo
 */

const { triggerAlerts, broadcastAlert, checkAllZonesAndAlert } = require('./telegramAlertTrigger');

console.log('🧪 BẮT ĐẦU TEST HỆ THỐNG CẢNH BÁO\n');

/**
 * Test 1: Kích hoạt cảnh báo cho một khu vực cụ thể
 */
async function testTriggerAlert() {
  console.log('📋 TEST 1: Kích hoạt cảnh báo cho khu vực cụ thể\n');
  
  try {
    const result = await triggerAlerts('zone_test_001', 150, {
      zone_name: 'Quận Hải Châu (Test)',
      threshold_level: 100
    });
    
    console.log('\n✅ Kết quả Test 1:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Test 1 thất bại:', error.message);
  }
}

/**
 * Test 2: Broadcast cảnh báo tới tất cả người dùng
 */
async function testBroadcast() {
  console.log('\n\n📋 TEST 2: Broadcast cảnh báo tới tất cả người dùng\n');
  
  const testZone = {
    zone_id: 'zone_test_002',
    zone_name: 'Quận Thanh Khê (Test)',
    current_level: 180,
    threshold_level: 100,
    alert_status: 'critical'
  };
  
  try {
    const result = await broadcastAlert(testZone);
    console.log('\n✅ Kết quả Test 2:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Test 2 thất bại:', error.message);
  }
}

/**
 * Test 3: Kiểm tra tất cả khu vực đang cảnh báo
 */
async function testCheckAllZones() {
  console.log('\n\n📋 TEST 3: Kiểm tra tất cả khu vực đang cảnh báo\n');
  
  try {
    await checkAllZonesAndAlert();
    console.log('\n✅ Test 3 hoàn tất');
  } catch (error) {
    console.error('❌ Test 3 thất bại:', error.message);
  }
}

/**
 * Chạy tất cả tests
 */
async function runAllTests() {
  console.log('═'.repeat(60));
  console.log('🚀 CHẠY TẤT CẢ TESTS');
  console.log('═'.repeat(60));
  
  await testTriggerAlert();
  
  // Delay giữa các tests
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testBroadcast();
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testCheckAllZones();
  
  console.log('\n' + '═'.repeat(60));
  console.log('✅ HOÀN TẤT TẤT CẢ TESTS');
  console.log('═'.repeat(60));
  
  process.exit(0);
}

// Chọn test để chạy
const testMode = process.argv[2] || 'all';

switch (testMode) {
  case 'trigger':
    testTriggerAlert().then(() => process.exit(0));
    break;
  case 'broadcast':
    testBroadcast().then(() => process.exit(0));
    break;
  case 'check':
    testCheckAllZones().then(() => process.exit(0));
    break;
  case 'all':
  default:
    runAllTests();
    break;
}

// Usage:
// node testAlert.js           -> Chạy tất cả tests
// node testAlert.js trigger   -> Test kích hoạt cảnh báo
// node testAlert.js broadcast -> Test broadcast
// node testAlert.js check     -> Test kiểm tra khu vực
