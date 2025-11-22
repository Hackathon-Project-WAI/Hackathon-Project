# 🚀 Frontend-Backend Integration Guide

## 📋 Mục lục

1. [Tổng quan](#tổng-quan)
2. [Cấu trúc API](#cấu-trúc-api)
3. [Cách sử dụng](#cách-sử-dụng)
4. [Components Demo](#components-demo)
5. [Troubleshooting](#troubleshooting)

---

## 🎯 Tổng quan

Hệ thống đã được tích hợp hoàn toàn giữa **React Frontend** và **Node.js Backend** với các tính năng:

- ✅ **AI-Generated Flood Alerts** (Gemini 2.5 Flash)
- ✅ **Personalized Location-based Alerts**
- ✅ **Real-time Firebase IoT Sensors Monitoring**
- ✅ **Email Notifications** (nodemailer + Gmail SMTP)

---

## 📂 Cấu trúc API

### **API Client** (`src/api/`)

```
src/api/
├── config.js              # API endpoints & configuration
├── client.js              # Axios instance với interceptors
├── emailApi.js            # Email services
├── aiAlertApi.js          # AI alert generation
├── firebaseApi.js         # Firebase sensors
├── personalizedAlertApi.js # Personalized alerts
└── index.js               # Export tất cả APIs
```

### **Custom Hooks** (`src/hooks/`)

```
src/hooks/
├── useEmailAlert.js       # Hook cho email alerts
├── useAIAlert.js          # Hook cho AI-generated alerts
├── useFirebaseSensors.js  # Hook cho Firebase sensors
└── usePersonalizedAlert.js # Hook cho personalized alerts
```

### **Demo Components** (`src/components/`)

```
src/components/
├── AIAlertDemo.js          # Demo AI flood alerts
├── PersonalizedAlertDemo.js # Demo personalized alerts
└── FirebaseSensorsMonitor.js # Real-time sensors monitor
```

---

## 🛠️ Cách sử dụng

### **1. Setup Environment Variables**

Tạo file `.env` trong thư mục `Hackathon-Project/`:

```bash
# Backend API URL
REACT_APP_BACKEND_URL=http://localhost:3001

# OpenWeatherMap API Key (nếu cần)
REACT_APP_OPENWEATHER_API_KEY=your_api_key_here

# Firebase Config (nếu dùng Firebase Client-side)
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_DATABASE_URL=...
```

### **2. Sử dụng API trong Components**

#### **Example 1: Sử dụng AI Alert Hook**

```javascript
import React, { useState } from 'react';
import { useAIAlert } from '../hooks/useAIAlert';

function MyComponent() {
  const { loading, error, alert, generateAlert } = useAIAlert();

  const handleGenerate = async () => {
    try {
      await generateAlert({
        current_percent: 85,
        previous_percent: 50,
        location: 'Cống ABC',
        to: 'user@example.com', // optional
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={loading}>
        Generate Alert
      </button>
      {alert && <div>{alert.subject}</div>}
      {error && <div>Error: {error}</div>}
    </div>
  );
}
```

#### **Example 2: Personalized Alerts**

```javascript
import React, { useEffect } from 'react';
import { usePersonalizedAlert } from '../hooks/usePersonalizedAlert';

function UserAlerts({ userId }) {
  const {
    loading,
    locations,
    alerts,
    fetchLocations,
    checkLocationsAndAlert,
  } = usePersonalizedAlert(userId);

  useEffect(() => {
    fetchLocations();
  }, [userId, fetchLocations]);

  const handleCheck = async () => {
    await checkLocationsAndAlert(1, true); // minRiskLevel=1, sendEmail=true
  };

  return (
    <div>
      <h2>Your Locations ({locations.length})</h2>
      <button onClick={handleCheck}>Check Alerts</button>
      {alerts.map((alert, i) => (
        <div key={i}>{alert.locationName}</div>
      ))}
    </div>
  );
}
```

#### **Example 3: Firebase Sensors Monitoring**

```javascript
import React from 'react';
import { useFirebaseSensors } from '../hooks/useFirebaseSensors';

function SensorsPanel() {
  const { sensors, loading, dangerousSensors } = useFirebaseSensors(
    true,  // autoRefresh
    5000   // refresh every 5 seconds
  );

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Sensors</h2>
      {dangerousSensors.length > 0 && (
        <div>⚠️ {dangerousSensors.length} sensors in danger!</div>
      )}
      {sensors?.SENSOR_ROAD && (
        <div>
          Road: {sensors.SENSOR_ROAD.water_level_cm} cm
        </div>
      )}
    </div>
  );
}
```

### **3. Import API trực tiếp (không dùng hooks)**

```javascript
import { api } from '../api';

// Email APIs
await api.email.sendTestEmail('user@example.com');
await api.email.sendFloodAlert('user@example.com', alertData);

// AI Alert APIs
const result = await api.aiAlert.generateFloodAlert(alertData);

// Firebase APIs
const sensors = await api.firebase.getAllSensors();
const sensor = await api.firebase.getSensorById('SENSOR_ROAD');

// Personalized Alert APIs
const locations = await api.personalized.getUserLocations(userId);
const alerts = await api.personalized.checkUserLocationsAndAlert(userId, 1, true);
```

---

## 🎨 Components Demo

### **Chạy Demo Page**

1. **Start Backend:**
   ```bash
   cd Backend
   npm start
   # Backend chạy tại http://localhost:3001
   ```

2. **Start Frontend:**
   ```bash
   cd Hackathon-Project
   npm run dev
   # Frontend chạy tại http://localhost:3000
   ```

3. **Truy cập Demo Page:**
   
   Thêm route trong `App.js`:
   ```javascript
   import APIDemo from './pages/APIDemo';
   
   <Route path="/api-demo" element={<APIDemo />} />
   ```
   
   Truy cập: `http://localhost:3000/api-demo`

### **Demo Components**

#### **1. AI Alert Demo**
- Nhập mức ngập hiện tại/trước đó
- Nhập vị trí trạm
- AI tự động tạo cảnh báo chi tiết
- Gửi email (optional)

#### **2. Personalized Alert Demo**
- Nhập User ID
- Hiển thị tất cả locations
- Check alerts cho từng location
- Gửi email cá nhân hóa

#### **3. Firebase Sensors Monitor**
- Real-time monitoring sensors
- Auto-refresh mỗi N giây
- Generate AI alerts từ sensor data
- Hiển thị dangerous sensors

---

## 🔧 API Endpoints

### **Email APIs**
```
POST /api/send-test-email
POST /api/send-email
POST /api/send-flood-alert
POST /api/send-weather-update
```

### **AI Alert APIs**
```
POST /api/generate-flood-alert
```

### **Firebase APIs**
```
GET /api/firebase/sensors
GET /api/firebase/sensors/:sensorId
```

### **Personalized Alert APIs**
```
POST /api/check-user-locations-alert
GET /api/user-locations/:userId
```

---

## 🐛 Troubleshooting

### **1. CORS Error**

**Lỗi:** `Access to fetch at 'http://localhost:3001' from origin 'http://localhost:3000' has been blocked by CORS policy`

**Giải pháp:**
- Backend đã có CORS middleware
- Kiểm tra `Backend/src/index.js` có `app.use(cors())`

### **2. Network Error - Backend không chạy**

**Lỗi:** `Network Error` hoặc `ERR_CONNECTION_REFUSED`

**Giải pháp:**
```bash
# Check backend có chạy không
cd Backend
npm start

# Kiểm tra port 3001
netstat -an | findstr :3001
```

### **3. Firebase Not Configured**

**Lỗi:** `503 Service Unavailable - Firebase chưa được cấu hình`

**Giải pháp:**
- Kiểm tra `Backend/configs/serviceAccountKey.json` có tồn tại
- Kiểm tra `.env` có `FIREBASE_SERVICE_ACCOUNT_KEY` và `FIREBASE_DATABASE_URL`

### **4. AI Alert Error - Invalid Model**

**Lỗi:** `404 Not Found - models/gemini-xxx is not found`

**Giải pháp:**
- Đảm bảo backend sử dụng `gemini-2.5-flash`
- Check `GEMINI_API_KEY` trong `.env`

### **5. User Not Found**

**Lỗi:** `Không tìm thấy user`

**Giải pháp:**
- Tạo user trong Firebase Console
- Path: `userProfiles/{userId}`
- Thêm locations: `userProfiles/{userId}/locations`

---

## 📚 Tài liệu tham khảo

- **Backend API Docs:** `Backend/docs/PERSONALIZED_ALERT_API.md`
- **Postman Collection:** `Backend/Flood_Alert_API_Complete.postman_collection.json`
- **Quick Start:** `Backend/QUICK_START_PERSONALIZED_ALERTS.md`
- **Refactor Summary:** `Backend/REFACTOR_SUMMARY.md`

---

## 🎉 Kết luận

Hệ thống đã tích hợp đầy đủ:
✅ Frontend React với custom hooks
✅ Backend Node.js với MVC pattern
✅ AI-powered alerts (Gemini 2.5 Flash)
✅ Real-time Firebase monitoring
✅ Email notifications
✅ Personalized location-based alerts

**Happy Coding! 🚀**

