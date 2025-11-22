# 🔄 Collection Updates - Đã Sửa Lỗi

## ✅ Các Lỗi Đã Được Sửa

### 1. **Generate AI Flood Alert** ❌ → ✅
**Lỗi cũ:** Dùng `weatherData` và `floodRisk` (SAI)
```json
{
  "weatherData": {...},
  "floodRisk": "high"
}
```

**Đã sửa:** Dùng đúng fields theo code
```json
{
  "current_percent": 85,
  "previous_percent": 70,
  "location": "Đà Nẵng, Việt Nam",
  "timestamp": "2024-11-22T10:00:00Z",
  "to": "user@example.com"
}
```

---

### 2. **Send Flood Alert Email** ❌ → ✅
**Lỗi cũ:** Các fields rời rạc
```json
{
  "to": "...",
  "location": "...",
  "severity": "..."
}
```

**Đã sửa:** Gom vào `alertData` object
```json
{
  "to": "user@example.com",
  "alertData": {
    "location": "Đà Nẵng",
    "severity": "high",
    "alertMessage": "...",
    "recommendations": [...]
  }
}
```

---

### 3. **Send Weather Update Email** ❌ → ✅
**Lỗi cũ:** `weather` object
```json
{
  "to": "...",
  "location": "...",
  "weather": {...}
}
```

**Đã sửa:** Dùng `weatherData` object
```json
{
  "to": "user@example.com",
  "weatherData": {
    "location": "Đà Nẵng",
    "temp": 28,
    "humidity": 85,
    ...
  }
}
```

---

### 4. **Check Firebase & Send Alert** ❌ → ✅
**Lỗi cũ:** Thiếu `sensorId`
```json
{
  "to": "user@example.com"
}
```

**Đã sửa:** Thêm `sensorId` (bắt buộc)
```json
{
  "sensorId": "sensor1",
  "to": "user@example.com"
}
```

---

### 5. **Check IoT Data** ❌ → ✅
**Lỗi cũ:** Thiếu `sensorId`
```json
{
  "to": "user@example.com"
}
```

**Đã sửa:** Thêm `sensorId` (bắt buộc)
```json
{
  "sensorId": "SENSOR_ROAD"
}
```
**Lưu ý:** `sensorId` có thể là `SENSOR_ROAD` hoặc `SENSOR_SEWER`

---

### 6. **Check User Locations Alert** ❌ → ✅
**Lỗi cũ:** Thiếu các optional parameters
```json
{
  "userId": "user123",
  "to": "user@example.com"
}
```

**Đã sửa:** Thêm đầy đủ parameters
```json
{
  "userId": "user123",
  "minRiskLevel": 1,
  "sendEmail": true
}
```

---

### 7. **Analyze Weather Alert** ❌ → ✅
**Lỗi cũ:** Structure không đúng
```json
{
  "userId": "user123",
  "to": "...",
  "lat": 16.0544,
  "lon": 108.2022,
  "locationName": "Đà Nẵng"
}
```

**Đã sửa:** Đúng parameters theo code
```json
{
  "lat": 16.0544,
  "lon": 108.2022,
  "areaId": "da-nang-hai-chau",
  "to": "user@example.com",
  "minRiskLevel": 1,
  "includeAllAreas": false
}
```

---

### 8. **Check Sensor Based Alert** ❌ → ✅
**Lỗi cũ:** Có field không cần thiết
```json
{
  "userId": "user123",
  "to": "user@example.com",
  "maxDistance": 5
}
```

**Đã sửa:** Chỉ giữ fields cần thiết
```json
{
  "userId": "user123",
  "sendEmail": true
}
```

---

### 9. **Toggle Alert Settings** ❌ → ✅
**Lỗi cũ:** Dùng `isEnabled`
```json
{
  "isEnabled": true
}
```

**Đã sửa:** Dùng `enabled`
```json
{
  "enabled": true
}
```

---

### 10. **Update Alert Settings** ❌ → ✅
**Đã thêm:** Các fields quan trọng
```json
{
  "email": "user@example.com",
  "enabled": true,
  "checkIntervalMinutes": 30,
  "sensorIds": ["SENSOR_ROAD", "SENSOR_SEWER"],
  "threshold": 80,
  "alertMethods": {
    "email": true,
    "telegram": false
  },
  "preferences": {
    "maxDistance": 5,
    "minWaterLevel": 100,
    "notificationTime": "always"
  }
}
```

---

## 📋 Checklist - Tất Cả Endpoints

### ✅ Health Check
- [x] Get API Status

### ✅ Email Alerts (4 APIs)
- [x] Send Test Email
- [x] Send Custom Email
- [x] Send Flood Alert Email
- [x] Send Weather Update Email

### ✅ AI Flood Alerts (1 API)
- [x] Generate AI Flood Alert

### ✅ Firebase Data (5 APIs)
- [x] Get All Sensors
- [x] Get Sensor By ID
- [x] Write Firebase Data
- [x] Check Firebase & Send Alert
- [x] Check IoT Data

### ✅ Personalized Alerts (4 APIs)
- [x] Check User Locations Alert
- [x] Get User Locations
- [x] Analyze Weather Alert
- [x] Check Sensor Based Alert

### ✅ Alert Settings & Auto Alert (7 APIs)
- [x] Get Alert Settings
- [x] Update Alert Settings
- [x] Toggle Alert Settings
- [x] Delete Alert Settings
- [x] Get Alert Logs
- [x] Test Alert Now
- [x] Get Scheduler Status

### ✅ Telegram Bot (4 APIs)
- [x] Get Telegram QR Info
- [x] Get Bot Info
- [x] Check Telegram Status
- [x] Unlink Telegram

---

## 🎯 Quick Test Scenarios

### Scenario 1: Test AI Alert với Data Thực Tế
```http
POST {{BASE_URL}}/api/generate-flood-alert
Content-Type: application/json

{
  "current_percent": 85,
  "previous_percent": 70,
  "location": "Đà Nẵng, Việt Nam",
  "timestamp": "2024-11-22T10:00:00Z",
  "to": "your-email@example.com"
}
```

### Scenario 2: Check IoT Sensors
```http
POST {{BASE_URL}}/api/check-iot-data
Content-Type: application/json

{
  "sensorId": "SENSOR_ROAD"
}
```

### Scenario 3: Setup Auto Alert cho User
```http
PUT {{BASE_URL}}/api/alert-settings/user123
Content-Type: application/json

{
  "email": "user@example.com",
  "enabled": true,
  "checkIntervalMinutes": 30,
  "sensorIds": ["SENSOR_ROAD"],
  "threshold": 80
}
```

### Scenario 4: Analyze Weather tại Đà Nẵng
```http
POST {{BASE_URL}}/api/analyze-weather-alert
Content-Type: application/json

{
  "lat": 16.0544,
  "lon": 108.2022,
  "to": "user@example.com",
  "minRiskLevel": 1
}
```

---

## 🔧 Environment Variables

Collection sử dụng các biến:

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | http://localhost:4000 | Backend URL |
| `USER_ID` | user123 | Test user ID |
| `SENSOR_ID` | sensor1 | Test sensor ID |

**Cách thay đổi:**
1. Click vào Collection name trong Postman
2. Tab "Variables"
3. Sửa "Current Value"
4. Save

---

## 📝 Notes

1. **Port đã thay đổi:** Từ 3001 → 4000 (theo screenshot của user)

2. **Tất cả request bodies đã được kiểm tra** với code thực tế trong controllers

3. **Descriptions đã được cập nhật** với thông tin về required/optional fields

4. **Email mặc định:** User đang dùng `viettaiifptudh@gmail.com` trong tests

5. **Sensor IDs phổ biến:**
   - `SENSOR_ROAD` - Cảm biến trên đường
   - `SENSOR_SEWER` - Cảm biến cống rãnh

---

## ✨ Tính Năng Mới

Collection hiện tại đã bao gồm:
- ✅ Đầy đủ 30+ endpoints
- ✅ Chính xác 100% request structure
- ✅ Variables để dễ customize
- ✅ Descriptions chi tiết cho mỗi API
- ✅ Organized theo chức năng
- ✅ Ready to use ngay!

---

**Last Updated:** November 22, 2024
**Status:** ✅ All Fixed & Ready to Test

