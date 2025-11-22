# ✅ Firebase Setup - Hoàn Tất!

## 🎉 Đã Cập Nhật Database URL

**Database URL mới của bạn:**
```
https://hackathon-weather-634bf-default-rtdb.asia-southeast1.firebasedatabase.app
```

**Project ID:** `hackathon-weather-634bf`

---

## 📁 Files Đã Có Sẵn

### ✅ serviceAccountKey.json
**Location:** `Backend/configs/serviceAccountKey.json`

```
Backend/
└── configs/
    └── serviceAccountKey.json  ← ✅ Đã có
```

### ✅ Firebase Client Code
**Location:** `Backend/src/integrations/firebaseClient.js`

Code đã sẵn sàng:
```javascript
const admin = require("firebase-admin");
const serviceAccount = require("./configs/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});
```

---

## 🔧 Bạn Chỉ Cần Làm 1 Việc

### Tạo/Cập nhật file `.env`

**Location:** `Backend/.env`

**Content (copy toàn bộ):**

```env
# Firebase
FIREBASE_DATABASE_URL=https://hackathon-weather-634bf-default-rtdb.asia-southeast1.firebasedatabase.app
FIREBASE_SERVICE_ACCOUNT_KEY=./configs/serviceAccountKey.json

# Email
EMAIL_USER=viettaiifptudh@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_FROM="Flood Alert System <viettaiifptudh@gmail.com>"
ALERT_EMAIL_RECIPIENTS=viettaiifptudh@gmail.com

# APIs (optional - get later)
GEMINI_API_KEY=your-key
OPENWEATHER_API_KEY=your-key
HERE_API_KEY=your-key

# Server
PORT=4000
NODE_ENV=development
ENABLE_FIREBASE_LISTENER=true
```

---

## 🚀 Test Ngay

### 1. Start Server
```bash
cd Backend
npm start
```

### 2. Kiểm tra Console Log
Phải thấy:
```
✅ Firebase Admin SDK khởi tạo thành công
📁 Service Account: serviceAccountKey.json
🔥 Firebase IoT Listener đã bật
🚀 Server đang chạy tại http://localhost:4000
```

### 3. Test API
```bash
# Get all sensors
curl http://localhost:4000/api/firebase/sensors

# Health check
curl http://localhost:4000/
```

---

## 📊 Database Structure Mẫu

Trong Firebase Realtime Database của bạn:

```json
{
  "iotData": {
    "SENSOR_ROAD": {
      "water_level_cm": 120,
      "flood_status": "DANGER",
      "location": "Đà Nẵng",
      "timestamp": 1234567890
    }
  },
  "userProfiles": {
    "user123": {
      "email": "user@example.com",
      "savedLocations": {
        "home": {
          "name": "Nhà",
          "lat": 16.0544,
          "lon": 108.2022
        }
      }
    }
  }
}
```

---

## 🎯 Code Initialization (Đã Có Sẵn)

### Option 1: Dùng FirebaseClient (Recommended) ✅

```javascript
// Trong controllers/services
const firebaseClient = require("./integrations/firebaseClient");

// Auto initialize khi server start
firebaseClient.initialize();

// Sử dụng
const data = await firebaseClient.readData("iotData/SENSOR_ROAD");
await firebaseClient.writeData("iotData/TEST", { value: 100 });
```

### Option 2: Dùng Admin SDK Trực Tiếp

```javascript
const admin = require("firebase-admin");
const serviceAccount = require("./configs/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://hackathon-weather-634bf-default-rtdb.asia-southeast1.firebasedatabase.app"
});

// Sử dụng
const db = admin.database();
const ref = db.ref("iotData/SENSOR_ROAD");
const snapshot = await ref.once("value");
const data = snapshot.val();
```

---

## 📝 Các File Liên Quan

1. **`Backend/.env`** ← BẠN CẦN TẠO FILE NÀY
2. `Backend/configs/serviceAccountKey.json` ← ✅ Đã có
3. `Backend/src/integrations/firebaseClient.js` ← ✅ Đã có
4. `Backend/src/integrations/firebaseAdmin.js` ← ✅ Đã có
5. `Backend/src/iot/iotListener.js` ← ✅ Đã có (auto listen IoT)

---

## 🔥 Quick Reference

### Read Data
```javascript
const data = await firebaseClient.readData("iotData/SENSOR_ROAD");
console.log(data.water_level_cm);
```

### Write Data
```javascript
await firebaseClient.writeData("iotData/TEST", {
  water_level_cm: 120,
  timestamp: Date.now()
});
```

### Listen to Changes
```javascript
firebaseClient.listenToPath("iotData/SENSOR_ROAD", (data) => {
  console.log("Data changed:", data);
});
```

---

## 🐛 Troubleshooting

### Lỗi: "FIREBASE_DATABASE_URL chưa được cấu hình"
```bash
# Tạo file .env
touch Backend/.env

# Copy config vào (xem FIREBASE_QUICK_SETUP.txt)
```

### Lỗi: "serviceAccountKey.json không tìm thấy"
```bash
# Check file có tồn tại
ls Backend/configs/serviceAccountKey.json

# Nếu không có, download từ Firebase Console:
# https://console.firebase.google.com/project/hackathon-weather-634bf/settings/serviceaccounts/adminsdk
```

### Lỗi: "Permission denied"
```bash
# Check Firebase Rules trong Console
# Rules → Realtime Database → cho phép read/write (test only)
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

---

## ✅ Checklist

- [x] serviceAccountKey.json đã có ✓
- [x] Database URL đã update ✓
- [x] Code initialization đã có sẵn ✓
- [ ] Tạo file Backend/.env ← BẠN LÀM VIỆC NÀY
- [ ] Copy config vào .env
- [ ] Test: `npm start`
- [ ] Verify: Thấy "✅ Firebase Admin SDK khởi tạo thành công"

---

## 🎉 Tổng Kết

**Code bạn muốn đã được implement sẵn:**
```javascript
var admin = require("firebase-admin");
var serviceAccount = require("./configs/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://hackathon-weather-634bf-default-rtdb.asia-southeast1.firebasedatabase.app"
});
```

**Location:** `Backend/src/integrations/firebaseClient.js` (lines 1-41)

**Bạn chỉ cần:**
1. Tạo file `Backend/.env`
2. Copy config từ `FIREBASE_QUICK_SETUP.txt`
3. Run `npm start`

**Done! 🚀**

---

**Files Hỗ Trợ:**
- 📄 `FIREBASE_QUICK_SETUP.txt` - Copy paste nhanh config
- 📖 `ENV_CONFIG_FIREBASE.md` - Hướng dẫn chi tiết
- 📋 `FIREBASE_SUMMARY.md` - File này (tổng hợp)

