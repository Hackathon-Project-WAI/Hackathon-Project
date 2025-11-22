# 📮 Postman Collections - Flood Alert System

## 📦 Available Collections

### 1. **Complete_API_Test.postman_collection.json** ⭐ (MỚI NHẤT)
**File:** `Complete_API_Test.postman_collection.json`

Collection hoàn chỉnh nhất với **tất cả 30+ API endpoints** được tổ chức theo chức năng:

**Nội dung:**
- ✅ 🏥 Health Check (1 endpoint)
- ✅ 📧 Email Alerts (4 endpoints)
- ✅ 🤖 AI Flood Alerts với Gemini (1 endpoint)
- ✅ 🔥 Firebase Data Management (5 endpoints)
- ✅ 🎯 Personalized Alerts (4 endpoints)
- ✅ ⚙️ Alert Settings & Auto Alert (7 endpoints)
- ✅ 📱 Telegram Bot Integration (4 endpoints)

**Đặc điểm:**
- Pre-configured environment variables
- Detailed descriptions cho mỗi endpoint
- Example request bodies
- Organized by feature folders
- Ready to use - chỉ cần import!

**Sử dụng:** [Xem hướng dẫn chi tiết](./POSTMAN_COLLECTION_GUIDE.md)

---

### 2. **Backend_Refactored_API.postman_collection.json**
Collection cũ hơn, tập trung vào các API cơ bản.

---

### 3. **Auto_Alert_Settings_API.postman_collection.json**
Collection chuyên về Alert Settings và Auto Alert features.

---

### 4. **Personalized_Alert_API.postman_collection.json**
Collection chuyên về Personalized Alerts.

---

### 5. **Postman_Collection.json**
Collection gốc ban đầu.

---

## 🚀 Quick Start

### Bước 1: Import Collection
```bash
1. Mở Postman
2. Click "Import" (góc trên bên trái)
3. Chọn file: Complete_API_Test.postman_collection.json
4. Click "Import"
```

### Bước 2: Kiểm tra Variables
```bash
Collection đã có sẵn:
- BASE_URL: http://localhost:3001
- USER_ID: user123
- SENSOR_ID: sensor1

→ Có thể thay đổi trong tab "Variables"
```

### Bước 3: Start Server
```bash
cd Backend
npm start
# Server chạy tại http://localhost:3001
```

### Bước 4: Test thử
```bash
1. Chạy: "Get API Status"
   → Đảm bảo server hoạt động
   
2. Chạy: "Get All Sensors"
   → Test Firebase connection
   
3. Chạy: "Send Test Email"
   → Test email service
```

---

## 📖 Documentation

- **[Hướng dẫn chi tiết](./POSTMAN_COLLECTION_GUIDE.md)** - Cách sử dụng collection
- **[Postman Guide](./POSTMAN_GUIDE.md)** - Hướng dẫn tổng quan về Postman
- **[Quick Test](./QUICK_TEST.md)** - Test nhanh các API chính

---

## 🎯 Recommended Test Workflows

### Workflow 1: Basic Health Check
```
GET / → Get API Status
GET /api/firebase/sensors → Get All Sensors  
GET /api/scheduler/status → Get Scheduler Status
```

### Workflow 2: Test Email System
```
POST /api/send-test-email → Send Test Email
POST /api/send-flood-alert → Send Flood Alert
POST /api/generate-flood-alert → AI Generated Alert
```

### Workflow 3: Setup Auto Alert
```
PUT /api/alert-settings/:userId → Update Alert Settings
GET /api/alert-settings/:userId → Get Alert Settings
POST /api/alert-settings/:userId/test → Test Alert Now
GET /api/alert-settings/:userId/logs → Get Alert Logs
```

### Workflow 4: Personalized Alerts
```
POST /api/check-user-locations-alert → Check All User Locations
POST /api/analyze-weather-alert → Analyze Weather at Location
POST /api/check-sensor-based-alert → Check Nearby Sensors
```

### Workflow 5: Telegram Integration
```
GET /api/telegram/info → Get Bot Info
GET /api/telegram/qr-info → Get QR Info for Linking
GET /api/telegram/status → Check Link Status
```

---

## 📊 Collection Comparison

| Feature | Complete API Test | Backend Refactored | Auto Alert | Personalized Alert |
|---------|------------------|-------------------|------------|-------------------|
| Health Check | ✅ | ✅ | ❌ | ❌ |
| Email Alerts | ✅ (4) | ✅ (3) | ❌ | ❌ |
| AI Alerts | ✅ | ✅ | ❌ | ❌ |
| Firebase | ✅ (5) | ✅ (3) | ❌ | ❌ |
| Personalized | ✅ (4) | ❌ | ❌ | ✅ (3) |
| Alert Settings | ✅ (7) | ❌ | ✅ (6) | ❌ |
| Telegram | ✅ (4) | ❌ | ❌ | ❌ |
| **Total Endpoints** | **30+** | **~15** | **~6** | **~3** |
| **Status** | ⭐ **Newest** | Old | Specific | Specific |

**👉 Khuyến nghị: Sử dụng `Complete_API_Test.postman_collection.json`**

---

## 🔧 Environment Variables

Collection sử dụng các biến sau:

| Variable | Default Value | Description |
|----------|--------------|-------------|
| `BASE_URL` | http://localhost:3001 | Backend server URL |
| `USER_ID` | user123 | Test user ID |
| `SENSOR_ID` | sensor1 | Test sensor ID |

**Cách thay đổi:**
1. Click vào Collection name
2. Tab "Variables"
3. Sửa "Current Value"
4. Save

---

## ⚡ Quick Commands

```bash
# Import all collections at once
# Trong Postman: Import → Chọn cả folder docs/

# Test toàn bộ collection
# Click collection name → Run → Run Collection

# Test một folder
# Click folder name → Run → Run [Folder Name]

# Copy as cURL (để test trên terminal)
# Click request → Code → cURL
```

---

## 🐛 Common Issues

### 1. Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:3001

Giải pháp:
✅ Check server có đang chạy: npm start
✅ Verify PORT trong .env (default: 3001)
✅ Check BASE_URL variable trong Postman
```

### 2. Firebase Error
```
Error: Firebase not initialized

Giải pháp:
✅ Check FIREBASE_SERVICE_ACCOUNT_KEY trong .env
✅ Verify serviceAccountKey.json path
✅ Restart server
```

### 3. Email Error
```
Error: Email service failed

Giải pháp:
✅ Check EMAIL_USER và EMAIL_PASSWORD trong .env
✅ Verify Gmail App Password (nếu dùng Gmail)
✅ Check network/firewall
```

---

## 📚 Additional Resources

### Documentation
- [Firebase Setup Guide](./FIREBASE_SETUP_GUIDE.md)
- [IoT Guide](./IOT_GUIDE.md)
- [Telegram Bot Guide](./TELEGRAM_BOT_DEPLOYMENT_GUIDE.md)
- [Weather Analysis Guide](./WEATHER_ANALYSIS_GUIDE.md)

### API Docs
- [Auto Alert Guide](./AUTO_ALERT_GUIDE.md)
- [Personalized Alert API](./PERSONALIZED_ALERT_API.md)

### Testing
- [Quick Test Guide](./QUICK_TEST.md)
- Test API file: [test-api.http](./test-api.http)

---

## 💡 Tips

1. **Luôn test Health Check trước** để verify server
2. **Sử dụng Environment Variables** cho data reusable
3. **Save Response Examples** cho documentation
4. **Run Collection** để test toàn bộ API cùng lúc
5. **Organize by folders** để dễ tìm endpoint

---

## 🎓 Learning Resources

### Postman Basics
- [Postman Official Docs](https://learning.postman.com/)
- [Postman API Testing](https://www.postman.com/api-testing/)

### API Testing
- [REST API Best Practices](https://restfulapi.net/)
- [HTTP Status Codes](https://httpstatuses.com/)

---

## 📞 Support

Nếu gặp vấn đề hoặc cần thêm endpoints:
1. Check [POSTMAN_COLLECTION_GUIDE.md](./POSTMAN_COLLECTION_GUIDE.md)
2. Check server logs
3. Verify .env configuration
4. Test với simpler endpoints trước

---

**Made with ❤️ for Flood Alert System**

**Last Updated:** November 22, 2024

