# 📚 Telegram Bot - Quick Reference

## 🚀 Chạy nhanh

### Terminal 1 - Bot Listener
```bash
cd Backend
npm run bot:listener
```

### Terminal 2 - Alert Trigger  
```bash
cd Backend
npm run bot:alert
```

## 🧪 Test Commands

```bash
# Test cảnh báo
node testAlert.js

# Test từng phần
node testAlert.js trigger
node testAlert.js broadcast
node testAlert.js check
```

## 📝 Cấu trúc Files

```
Backend/
├── telegramFirebaseConfig.js    # Cấu hình Firebase Admin SDK
├── firestoreManager.js           # Quản lý Firestore collections
├── telegramBotListener.js        # Long Polling listener
├── telegramAlertTrigger.js       # Alert trigger service
├── testAlert.js                  # Test scripts
├── .env                          # Environment variables
├── .env.example                  # Environment template
└── serviceAccountKey.json        # Firebase Service Account (KHÔNG commit)
```

## 🔑 Environment Variables

```env
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
ALERT_CHECK_INTERVAL=10
```

## 🤖 Bot Commands

- `/start` - Đăng ký nhận cảnh báo
- `/stop` - Hủy đăng ký
- `/status` - Kiểm tra trạng thái
- `/help` - Hướng dẫn sử dụng

## 📊 Firestore Collections

### telegram_users
```javascript
{
  chat_id: "123456789",
  username: "user123",
  first_name: "John",
  last_name: "Doe",
  is_active: true,
  registered_at: Timestamp,
  last_active: Timestamp
}
```

### flood_zones
```javascript
{
  zone_id: "zone_001",
  zone_name: "Quận Hải Châu",
  current_level: 150,
  threshold_level: 100,
  alert_status: "danger",
  last_updated: Timestamp
}
```

## 🎯 API Functions

### Listener Service
```javascript
const { sendMessage, startBot } = require('./telegramBotListener');

// Gửi tin nhắn
await sendMessage(chatId, "Hello!", { parse_mode: "Markdown" });

// Khởi động bot
await startBot();
```

### Alert Service
```javascript
const { triggerAlerts, broadcastAlert } = require('./telegramAlertTrigger');

// Kích hoạt cảnh báo
await triggerAlerts('zone_001', 150, {
  zone_name: 'Quận Hải Châu',
  threshold_level: 100
});

// Broadcast tới tất cả
await broadcastAlert(zoneData);
```

### Firestore Manager
```javascript
const { 
  saveTelegramUser, 
  getActiveUsers,
  saveFloodZone,
  getAlertingZones 
} = require('./firestoreManager');

// Lưu user
await saveTelegramUser(chatId, { username: "user123" });

// Lấy users hoạt động
const users = await getActiveUsers();

// Lưu khu vực
await saveFloodZone('zone_001', {
  current_level: 150,
  threshold_level: 100,
  alert_status: 'danger'
});
```

## ⚠️ Alert Levels

| Mực nước | Status | Emoji | Hành động |
|----------|--------|-------|-----------|
| < 100cm | normal | ✅ | Không cảnh báo |
| 100-119cm | warning | ⚠️ | Cảnh báo chuẩn bị |
| 120-149cm | danger | 🚨 | Cảnh báo nguy hiểm |
| ≥ 150cm | critical | 🔴 | Cảnh báo khẩn cấp |

## 🔧 Troubleshooting

### Bot không nhận tin nhắn
```bash
# Kiểm tra token
curl https://api.telegram.org/bot<TOKEN>/getMe

# Restart listener
npm run bot:listener
```

### Firebase connection error
```bash
# Kiểm tra service account
ls -la serviceAccountKey.json

# Kiểm tra env
cat .env | grep FIREBASE
```

### Dependencies error
```bash
# Cài lại dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📞 Quick Links

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Firebase Console](https://console.firebase.google.com/)
- [Bot Father](https://t.me/BotFather)

## 💡 Tips

1. **Rate Limit**: Telegram giới hạn 30 msg/giây
2. **Timeout**: Long Polling timeout = 60 giây
3. **Retry**: Tự động retry khi có lỗi network
4. **Logging**: Check console output để debug
5. **PM2**: Dùng PM2 cho production environment

## 🎨 Message Formatting

### Markdown
```javascript
await sendMessage(chatId, `
*Bold text*
_Italic text_
[Link](https://example.com)
\`Code\`
`, { parse_mode: "Markdown" });
```

### HTML
```javascript
await sendMessage(chatId, `
<b>Bold</b>
<i>Italic</i>
<a href="https://example.com">Link</a>
<code>Code</code>
`, { parse_mode: "HTML" });
```

## 🚦 Production Checklist

- [ ] Service Account Key an toàn
- [ ] .env không commit lên Git
- [ ] Rate limiting đã implement
- [ ] Error handling đầy đủ
- [ ] Logging system
- [ ] PM2 setup
- [ ] Firestore Security Rules
- [ ] Bot commands đã set
- [ ] Test thoroughly
- [ ] Monitor logs

---

**Xem chi tiết tại:** `TELEGRAM_BOT_DEPLOYMENT_GUIDE.md`
