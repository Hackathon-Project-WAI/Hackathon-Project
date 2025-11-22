# 🤖 Hướng dẫn Triển khai Telegram Bot Cảnh báo Ngập lụt

## 📋 Tổng quan Hệ thống

Hệ thống cảnh báo ngập lụt sử dụng:
- **Node.js** với Long Polling
- **Firebase Firestore** để lưu trữ dữ liệu
- **Telegram Bot API** để giao tiếp với người dùng

### 🏗️ Kiến trúc

```
┌─────────────────────┐
│  Telegram Users     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐      ┌─────────────────────┐
│ Bot Listener        │      │ Alert Trigger       │
│ (Long Polling)      │      │ (Monitoring)        │
│                     │      │                     │
│ - Nhận lệnh /start  │      │ - Kiểm tra mực nước │
│ - Đăng ký user      │      │ - Gửi cảnh báo      │
└──────────┬──────────┘      └──────────┬──────────┘
           │                            │
           ▼                            ▼
    ┌──────────────────────────────────────┐
    │      Firebase Firestore              │
    │                                      │
    │  Collections:                        │
    │  - telegram_users                    │
    │  - flood_zones                       │
    └──────────────────────────────────────┘
```

---

## 🚀 BƯỚC 1: Cài đặt Môi trường

### 1.1. Yêu cầu hệ thống

- **Node.js** >= 14.x
- **npm** hoặc **yarn**
- **Firebase Project** với Firestore đã kích hoạt
- **Telegram Bot Token** (từ @BotFather)

### 1.2. Cài đặt Dependencies

```bash
cd Backend
npm install axios firebase-admin dotenv
```

Hoặc nếu chưa có `package.json`, xem BƯỚC 6 bên dưới.

---

## 🔑 BƯỚC 2: Cấu hình Firebase

### 2.1. Tạo Firebase Project

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Tạo project mới hoặc sử dụng project hiện có
3. Kích hoạt **Firestore Database** (chế độ Test hoặc Production)

### 2.2. Tạo Service Account

1. Vào **Project Settings** → **Service Accounts**
2. Click **Generate new private key**
3. Lưu file JSON với tên `serviceAccountKey.json`
4. Copy file vào thư mục `Backend/`

**⚠️ QUAN TRỌNG:** Thêm `serviceAccountKey.json` vào `.gitignore`

```bash
echo "serviceAccountKey.json" >> .gitignore
```

### 2.3. Cấu trúc Firestore Collections

Hệ thống sẽ tự động tạo collections khi chạy, nhưng bạn có thể tạo thủ công:

#### Collection: `telegram_users`
```
telegram_users/{chat_id}
├── chat_id: string
├── username: string
├── first_name: string
├── last_name: string
├── is_active: boolean
├── registered_at: timestamp
└── last_active: timestamp
```

#### Collection: `flood_zones`
```
flood_zones/{zone_id}
├── zone_id: string
├── zone_name: string
├── current_level: number
├── threshold_level: number
├── alert_status: string (normal|warning|danger|critical)
└── last_updated: timestamp
```

---

## 🤖 BƯỚC 3: Tạo Telegram Bot

### 3.1. Tạo Bot mới

1. Mở Telegram và tìm **@BotFather**
2. Gửi lệnh `/newbot`
3. Đặt tên cho bot (ví dụ: `Flood Alert Bot`)
4. Đặt username (phải kết thúc bằng `bot`, ví dụ: `danang_flood_bot`)
5. Lưu **Bot Token** (dạng: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 3.2. Cấu hình Bot (Tùy chọn)

```
/setdescription - Đặt mô tả bot
/setabouttext - Đặt thông tin về bot
/setuserpic - Đặt avatar cho bot
/setcommands - Đặt danh sách lệnh
```

Danh sách lệnh gợi ý:
```
start - Đăng ký nhận cảnh báo
stop - Hủy đăng ký
status - Kiểm tra trạng thái
help - Hướng dẫn sử dụng
```

---

## ⚙️ BƯỚC 4: Cấu hình Environment Variables

### 4.1. Tạo file `.env`

Tạo file `.env` trong thư mục `Backend/`:

```bash
cd Backend
touch .env
```

### 4.2. Nội dung file `.env`

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN

# Firebase Configuration
FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json

# Optional: Alert Settings
ALERT_CHECK_INTERVAL=10
```

**Thay thế:**
- `YOUR_BOT_TOKEN` → Token từ @BotFather
- `YOUR_FIREBASE_PROJECT_ID` → Project ID từ Firebase Console
- `./serviceAccountKey.json` → Đường dẫn tới Service Account Key

---

## 🎯 BƯỚC 5: Chạy Hệ thống

### 5.1. Chạy Bot Listener (Terminal 1)

Script này lắng nghe tin nhắn từ người dùng và đăng ký họ:

```bash
cd Backend
node telegramBotListener.js
```

**Output mong đợi:**
```
🤖 Khởi động Telegram Bot (Long Polling)...
✅ Firebase Admin SDK đã được khởi tạo thành công
✅ Bot đã kết nối: @danang_flood_bot
🔄 Bắt đầu Long Polling...
📡 Đang lắng nghe tin nhắn từ người dùng...
```

### 5.2. Chạy Alert Trigger (Terminal 2)

Script này gửi cảnh báo khi phát hiện nguy cơ ngập lụt:

#### Option A: Chạy Monitoring Mode (Tự động kiểm tra)

```bash
cd Backend
node telegramAlertTrigger.js
```

**Output mong đợi:**
```
🚨 Telegram Bot Alert Trigger Service 🚨
🔄 Khởi động dịch vụ giám sát...
⏰ Chu kỳ kiểm tra: 10 phút
✅ Dịch vụ giám sát đang chạy...
```

#### Option B: Kích hoạt Cảnh báo Thủ công (Test)

Tạo file test `testAlert.js`:

```javascript
const { initializeFirebase } = require('./telegramFirebaseConfig');
const { triggerAlerts } = require('./telegramAlertTrigger');

initializeFirebase();

// Test cảnh báo cho khu vực
triggerAlerts('zone_001', 150, {
  zone_name: 'Quận Hải Châu',
  threshold_level: 100
}).then(() => {
  console.log('✅ Hoàn tất test cảnh báo');
  process.exit(0);
}).catch(error => {
  console.error('❌ Lỗi:', error);
  process.exit(1);
});
```

Chạy test:
```bash
node testAlert.js
```

---

## 📱 BƯỚC 6: Test Hệ thống

### 6.1. Test Bot Listener

1. Mở Telegram và tìm bot của bạn (ví dụ: `@danang_flood_bot`)
2. Gửi lệnh `/start`
3. Bạn sẽ nhận được tin nhắn chào mừng
4. Kiểm tra Firestore → Collection `telegram_users` → Có document mới với `chat_id` của bạn

### 6.2. Test Alert Trigger

**Cách 1: Thêm dữ liệu test vào Firestore**

1. Vào Firestore Console
2. Tạo document mới trong collection `flood_zones`:
   ```
   Document ID: zone_test_001
   Fields:
   - zone_id: "zone_test_001"
   - zone_name: "Quận Test"
   - current_level: 150
   - threshold_level: 100
   - alert_status: "danger"
   - last_updated: [timestamp]
   ```

3. Chạy script kiểm tra:
   ```javascript
   const { checkAllZonesAndAlert } = require('./telegramAlertTrigger');
   const { initializeFirebase } = require('./telegramFirebaseConfig');
   
   initializeFirebase();
   checkAllZonesAndAlert();
   ```

**Cách 2: Sử dụng hàm triggerAlerts**

```javascript
const { triggerAlerts } = require('./telegramAlertTrigger');
const { initializeFirebase } = require('./telegramFirebaseConfig');

initializeFirebase();

// Test cảnh báo với mực nước 150cm (nguy hiểm)
triggerAlerts('zone_001', 150, {
  zone_name: 'Quận Hải Châu',
  threshold_level: 100
});
```

---

## 🔄 BƯỚC 7: Tích hợp với Hệ thống IoT (Tùy chọn)

### 7.1. Nhận dữ liệu từ IoT Sensor

Tạo file `iotListener.js`:

```javascript
const { initializeFirebase } = require('./telegramFirebaseConfig');
const { triggerAlerts } = require('./telegramAlertTrigger');

initializeFirebase();

// Giả lập nhận dữ liệu từ IoT
function onIoTDataReceived(sensorData) {
  const { zoneId, waterLevel, zoneName } = sensorData;
  
  console.log(`🌊 Nhận dữ liệu IoT: ${zoneName} - ${waterLevel}cm`);
  
  // Kích hoạt cảnh báo nếu cần
  triggerAlerts(zoneId, waterLevel, {
    zone_name: zoneName,
    threshold_level: 100
  });
}

// Ví dụ: Nhận dữ liệu qua HTTP endpoint
const express = require('express');
const app = express();
app.use(express.json());

app.post('/api/sensor/data', (req, res) => {
  const { zone_id, water_level, zone_name } = req.body;
  
  onIoTDataReceived({
    zoneId: zone_id,
    waterLevel: water_level,
    zoneName: zone_name
  });
  
  res.json({ success: true, message: 'Data received' });
});

app.listen(3000, () => {
  console.log('🔌 IoT Listener đang chạy trên port 3000');
});
```

Chạy:
```bash
node iotListener.js
```

Test bằng curl:
```bash
curl -X POST http://localhost:3000/api/sensor/data \
  -H "Content-Type: application/json" \
  -d '{
    "zone_id": "zone_001",
    "water_level": 150,
    "zone_name": "Quận Hải Châu"
  }'
```

---

## 📦 BƯỚC 8: Package.json (Nếu chưa có)

Tạo hoặc cập nhật `Backend/package.json`:

```json
{
  "name": "flood-alert-telegram-bot",
  "version": "1.0.0",
  "description": "Telegram Bot for Flood Alert System using Firebase Firestore",
  "main": "telegramBotListener.js",
  "scripts": {
    "start": "node telegramBotListener.js",
    "alert": "node telegramAlertTrigger.js",
    "test": "node testAlert.js",
    "dev:listener": "nodemon telegramBotListener.js",
    "dev:alert": "nodemon telegramAlertTrigger.js"
  },
  "keywords": [
    "telegram",
    "bot",
    "flood",
    "alert",
    "firebase",
    "firestore"
  ],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "axios": "^1.6.0",
    "dotenv": "^16.3.1",
    "firebase-admin": "^12.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

Cài đặt:
```bash
npm install
```

---

## 🛠️ Troubleshooting

### Lỗi: "Firebase Admin SDK initialization failed"

**Nguyên nhân:** Service Account Key không hợp lệ hoặc đường dẫn sai

**Giải pháp:**
- Kiểm tra file `serviceAccountKey.json` có tồn tại
- Kiểm tra đường dẫn trong file `.env`
- Đảm bảo file JSON không bị lỗi format

### Lỗi: "Bot Token không hợp lệ"

**Nguyên nhân:** Bot Token sai hoặc bot bị vô hiệu hóa

**Giải pháp:**
- Kiểm tra lại token trong file `.env`
- Liên hệ @BotFather để lấy token mới

### Lỗi: "Cannot find module 'axios'"

**Nguyên nhân:** Dependencies chưa được cài đặt

**Giải pháp:**
```bash
npm install axios firebase-admin dotenv
```

### Bot không nhận tin nhắn

**Nguyên nhân:** Long Polling chưa chạy hoặc bị lỗi

**Giải pháp:**
- Kiểm tra log trong terminal
- Kiểm tra kết nối internet
- Restart script `telegramBotListener.js`

---

## 📊 Monitoring & Logging

### Sử dụng PM2 cho Production

Cài đặt PM2:
```bash
npm install -g pm2
```

Tạo file `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'bot-listener',
      script: './telegramBotListener.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'alert-trigger',
      script: './telegramAlertTrigger.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

Chạy với PM2:
```bash
pm2 start ecosystem.config.js
pm2 logs
pm2 status
```

---

## 🎯 Best Practices

### 1. Bảo mật

- **KHÔNG** commit `.env` và `serviceAccountKey.json` lên Git
- Sử dụng environment variables cho production
- Giới hạn quyền truy cập Firestore (Security Rules)

### 2. Rate Limiting

Telegram giới hạn:
- 30 tin nhắn/giây cho mỗi bot
- 1 tin nhắn/giây cho mỗi chat

Script đã tích hợp delay 50ms giữa các tin nhắn.

### 3. Error Handling

- Log tất cả errors vào file
- Sử dụng try-catch cho tất cả async operations
- Implement retry logic cho network requests

### 4. Monitoring

- Theo dõi số lượng người dùng hoạt động
- Theo dõi số lượng cảnh báo được gửi
- Theo dõi errors và performance

---

## 📞 Hỗ trợ

Nếu gặp vấn đề, kiểm tra:

1. **Logs** trong terminal
2. **Firestore Console** để xem dữ liệu
3. **Telegram Bot API** status: https://core.telegram.org/bots/api

---

## ✅ Checklist Triển khai

- [ ] Cài đặt Node.js và npm
- [ ] Tạo Firebase Project và kích hoạt Firestore
- [ ] Tạo Service Account Key
- [ ] Tạo Telegram Bot với @BotFather
- [ ] Cấu hình file `.env`
- [ ] Cài đặt dependencies: `npm install`
- [ ] Test Bot Listener: `node telegramBotListener.js`
- [ ] Test Alert Trigger: `node telegramAlertTrigger.js`
- [ ] Gửi `/start` tới bot và nhận tin nhắn chào mừng
- [ ] Test gửi cảnh báo
- [ ] Setup PM2 cho production (tùy chọn)
- [ ] Tích hợp với IoT sensors (tùy chọn)

---

**🎉 Chúc mừng! Hệ thống của bạn đã sẵn sàng hoạt động!**
