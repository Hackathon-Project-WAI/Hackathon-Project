# 🚀 API Quick Reference Card

## Các API Chính - Copy & Paste Ngay

### 1. 🏥 Health Check
```bash
GET http://localhost:4000/
```

---

### 2. 📧 Test Email
```bash
POST http://localhost:4000/api/send-test-email
Content-Type: application/json

{
  "to": "your-email@example.com"
}
```

---

### 3. 🤖 AI Flood Alert (Gemini)
```bash
POST http://localhost:4000/api/generate-flood-alert
Content-Type: application/json

{
  "current_percent": 85,
  "location": "Đà Nẵng, Việt Nam",
  "to": "your-email@example.com"
}
```

---

### 4. 🔥 Get All Sensors
```bash
GET http://localhost:4000/api/firebase/sensors
```

---

### 5. 📊 Check IoT Data
```bash
POST http://localhost:4000/api/check-iot-data
Content-Type: application/json

{
  "sensorId": "SENSOR_ROAD"
}
```

---

### 6. 🎯 Analyze Weather
```bash
POST http://localhost:4000/api/analyze-weather-alert
Content-Type: application/json

{
  "lat": 16.0544,
  "lon": 108.2022,
  "to": "your-email@example.com"
}
```

---

### 7. ⚙️ Get Alert Settings
```bash
GET http://localhost:4000/api/alert-settings/user123
```

---

### 8. ✏️ Update Alert Settings
```bash
PUT http://localhost:4000/api/alert-settings/user123
Content-Type: application/json

{
  "email": "your-email@example.com",
  "enabled": true,
  "checkIntervalMinutes": 30,
  "sensorIds": ["SENSOR_ROAD"],
  "threshold": 80
}
```

---

### 9. 🔘 Toggle Auto Alert
```bash
POST http://localhost:4000/api/alert-settings/user123/toggle
Content-Type: application/json

{
  "enabled": true
}
```

---

### 10. 🧪 Test Alert Ngay
```bash
POST http://localhost:4000/api/alert-settings/user123/test
```

---

### 11. 📱 Get Telegram QR Info
```bash
GET http://localhost:4000/api/telegram/qr-info
```

---

### 12. 📈 Scheduler Status
```bash
GET http://localhost:4000/api/scheduler/status
```

---

## 💡 Tips

### Thay đổi Port
Nếu server chạy port khác, thay `4000` → port của bạn

### Thay đổi User ID
Thay `user123` → user ID thực tế trong Firebase

### Thay đổi Email
Thay `your-email@example.com` → email thật của bạn

### Test nhanh với cURL
```bash
# Health check
curl http://localhost:4000/

# Test email
curl -X POST http://localhost:4000/api/send-test-email \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@example.com"}'

# Get sensors
curl http://localhost:4000/api/firebase/sensors
```

---

## 🔑 Required Fields Summary

| Endpoint | Required Fields |
|----------|----------------|
| Generate AI Alert | `current_percent`, `location` |
| Check Firebase Alert | `sensorId` |
| Check IoT Data | `sensorId` |
| Check User Locations | `userId` |
| Analyze Weather | `lat`, `lon` |
| Update Settings | `email` (recommended) |
| Toggle Settings | `enabled` |

---

## 📝 Common Sensor IDs

- `SENSOR_ROAD` - Cảm biến đường
- `SENSOR_SEWER` - Cảm biến cống
- `sensor1`, `sensor2`, ... - Các sensors khác

---

## 🎯 Quick Test Flow

```
1. GET  / → Check server running
2. GET  /api/firebase/sensors → Check Firebase connection
3. POST /api/send-test-email → Check email service
4. POST /api/generate-flood-alert → Test AI alert
5. GET  /api/scheduler/status → Check auto alert running
```

---

**Port:** 4000 (mặc định)
**Base URL:** http://localhost:4000
**Last Updated:** Nov 22, 2024

