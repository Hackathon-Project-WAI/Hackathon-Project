# 🔥 Firebase Configuration - Setup Guide

## ✅ Bạn Cần Làm Ngay

### 1. Tạo/Cập nhật file `.env`

**Location:** `Backend/.env`

**Copy nội dung này vào file `.env` của bạn:**

```env
# ===========================================
# FIREBASE CONFIGURATION ⭐ MỚI CẬP NHẬT
# ===========================================

# 🔥 Firebase Realtime Database URL
FIREBASE_DATABASE_URL=https://hackathon-weather-634bf-default-rtdb.asia-southeast1.firebasedatabase.app

# 🔑 Path to Firebase Service Account Key
FIREBASE_SERVICE_ACCOUNT_KEY=./configs/serviceAccountKey.json

# ===========================================
# EMAIL CONFIGURATION (Gmail SMTP)
# ===========================================

EMAIL_USER=viettaiifptudh@gmail.com
EMAIL_PASS=your-gmail-app-password-here
EMAIL_FROM="Flood Alert System <viettaiifptudh@gmail.com>"

# Alert recipients (comma-separated)
ALERT_EMAIL_RECIPIENTS=viettaiifptudh@gmail.com

# ===========================================
# AI & WEATHER APIs
# ===========================================

# Gemini AI API Key
GEMINI_API_KEY=your-gemini-api-key-here

# OpenWeather API Key
OPENWEATHER_API_KEY=your-openweather-api-key-here

# HERE Maps API Key (for geocoding address → coordinates)
HERE_API_KEY=your-here-api-key-here

# ===========================================
# TELEGRAM BOT (Optional)
# ===========================================

TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here

# ===========================================
# SERVER CONFIGURATION
# ===========================================

PORT=4000
NODE_ENV=development

# ===========================================
# FIREBASE LISTENER (IoT Auto Alert)
# ===========================================

# Enable Firebase IoT listener
ENABLE_FIREBASE_LISTENER=true
```

---

## 📝 Code Firebase Initialization

File `Backend/src/integrations/firebaseClient.js` đã được setup để dùng config trên:

```javascript
const admin = require("firebase-admin");
const path = require("path");

// Đọc từ .env
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const databaseURL = process.env.FIREBASE_DATABASE_URL;

// Load service account key
const serviceAccount = require(path.resolve(serviceAccountPath));

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: databaseURL,
});
```

**✅ Code này đã có sẵn trong project, bạn chỉ cần update `.env`!**

---

## 🔍 Verify Setup

### 1. Check File Structure

```
Backend/
├── .env                          ← Tạo file này
└── configs/
    └── serviceAccountKey.json    ← ✅ Đã có
```

### 2. Check `.env` Content

```bash
cat Backend/.env
```

Phải thấy:

```
FIREBASE_DATABASE_URL=https://hackathon-weather-634bf-default-rtdb...
FIREBASE_SERVICE_ACCOUNT_KEY=./configs/serviceAccountKey.json
```

### 3. Test Firebase Connection

```bash
cd Backend
npm start
```

Phải thấy log:

```
✅ Firebase Admin SDK khởi tạo thành công
📁 Service Account: serviceAccountKey.json
🔥 Firebase IoT Listener đã bật
```

---

## 🚨 Nếu Gặp Lỗi

### Error: "FIREBASE_DATABASE_URL chưa được cấu hình"

**Fix:**

```bash
# Check file .env có tồn tại không
ls -la Backend/.env

# Nếu không có, tạo mới
touch Backend/.env

# Copy content từ trên vào
```

### Error: "serviceAccountKey.json không tìm thấy"

**Fix:**

```bash
# Check file có tồn tại không
ls Backend/configs/serviceAccountKey.json

# Check path trong .env
# Phải là: ./configs/serviceAccountKey.json
```

### Error: "MODULE_NOT_FOUND"

**Fix:**

```env
# Sửa path trong .env
FIREBASE_SERVICE_ACCOUNT_KEY=./configs/serviceAccountKey.json
# KHÔNG dùng ../configs hoặc absolute path
```

---

## 🎯 Quick Start (Copy & Paste)

### Step 1: Tạo/Edit `.env`

```bash
cd Backend
nano .env  # hoặc code .env
```

### Step 2: Paste Config

```env
FIREBASE_DATABASE_URL=https://hackathon-weather-634bf-default-rtdb.asia-southeast1.firebasedatabase.app
FIREBASE_SERVICE_ACCOUNT_KEY=./configs/serviceAccountKey.json
EMAIL_USER=viettaiifptudh@gmail.com
ALERT_EMAIL_RECIPIENTS=viettaiifptudh@gmail.com
```

### Step 3: Save & Restart

```bash
# Save file (Ctrl+X, Y, Enter trong nano)
# Hoặc Ctrl+S trong VSCode

# Restart server
npm start
```

### Step 4: Verify

```
✅ Firebase Admin SDK khởi tạo thành công
✅ Server đang chạy tại http://localhost:4000
```

---

## 📊 Firebase Database Structure

Với URL: `https://hackathon-weather-634bf-default-rtdb.asia-southeast1.firebasedatabase.app`

**Suggested structure:**

```json
{
  "iotData": {
    "SENSOR_ROAD": {
      "water_level_cm": 120,
      "flood_status": "DANGER",
      "timestamp": 1234567890
    },
    "SENSOR_SEWER": {
      "water_level_cm": 80,
      "flood_status": "WARNING",
      "timestamp": 1234567890
    }
  },
  "userProfiles": {
    "user123": {
      "email": "user@example.com",
      "savedLocations": {
        "loc1": {
          "name": "Nhà",
          "lat": 16.0544,
          "lon": 108.2022
        }
      }
    }
  },
  "alertSettings": {
    "user123": {
      "enabled": true,
      "checkIntervalMinutes": 30,
      "email": "user@example.com"
    }
  }
}
```

---

## 🔐 Security Notes

⚠️ **QUAN TRỌNG:**

- `.env` file **KHÔNG BAO GIỜ** commit lên Git
- `.gitignore` phải có: `.env`
- `serviceAccountKey.json` cũng **KHÔNG BAO GIỜ** commit
- Chỉ commit `.env.example` (không có values thật)

---

## 📚 Related Files

- `Backend/src/integrations/firebaseClient.js` - Firebase client wrapper
- `Backend/src/integrations/firebaseAdmin.js` - Legacy admin SDK
- `Backend/src/iot/iotListener.js` - IoT data listener
- `Backend/src/index.js` - Server startup (auto init Firebase)

---

## ✅ Checklist

- [ ] Tạo file `Backend/.env`
- [ ] Copy config từ guide này
- [ ] Update `FIREBASE_DATABASE_URL`
- [ ] Update `EMAIL_USER` và `EMAIL_PASS`
- [ ] Test: `npm start`
- [ ] Verify: Thấy "✅ Firebase Admin SDK khởi tạo thành công"
- [ ] Test API: GET `http://localhost:4000/api/firebase/sensors`

---

**Xong! Firebase đã được cấu hình với database URL mới! 🎉**
