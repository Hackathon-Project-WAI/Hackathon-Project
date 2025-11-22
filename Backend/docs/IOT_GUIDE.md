# 🤖 HƯỚNG DẪN IoT DEVICE - POST LÊN FIREBASE

## 🎯 WORKFLOW HOÀN CHỈNH

```
IoT Device (ESP32/Arduino)
    ↓ (HTTP PUT/POST)
Firebase Realtime Database
    ↓ (Sau đó IoT gọi Backend)
Backend API: /api/check-firebase-and-alert
    ↓ (Đọc Firebase, phân tích)
Gemini AI tạo cảnh báo
    ↓
Gửi Email
```

---

## 📡 BƯỚC 1: IoT Device POST Lên Firebase

### **Cấu trúc dữ liệu trong Firebase:**

```
sensors/
  └── flood/
      ├── sensor_001/
      │   ├── location: "Cống Phan Đình Phùng"
      │   ├── current_percent: 85
      │   ├── previous_percent: 50
      │   └── timestamp: "2025-11-19T01:42:00"
      │
      └── sensor_002/
          ├── location: "Cầu Rồng"
          ├── current_percent: 65
          ├── previous_percent: 60
          └── timestamp: "2025-11-19T01:43:00"
```

---

### **Code ESP32/Arduino:**

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Firebase Config
const char* FIREBASE_URL = "https://hackathon-weather-634bf-default-rtdb.firebaseio.com";
const char* SENSOR_ID = "sensor_001";
const char* BACKEND_URL = "http://your-backend-ip:3001";

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
}

// HÀM 1: POST dữ liệu lên Firebase
void postToFirebase(float waterLevel, String location) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    // Firebase REST API: PUT hoặc PATCH
    String firebaseUrl = String(FIREBASE_URL) + "/sensors/flood/" + SENSOR_ID + ".json";
    http.begin(firebaseUrl);
    http.addHeader("Content-Type", "application/json");
    
    // Tạo JSON data
    StaticJsonDocument<200> doc;
    doc["location"] = location;
    doc["current_percent"] = waterLevel;
    doc["previous_percent"] = 50; // Lấy từ lần đo trước
    doc["timestamp"] = getTimestamp(); // Hàm lấy thời gian
    
    String jsonData;
    serializeJson(doc, jsonData);
    
    // PUT request (ghi đè toàn bộ)
    int httpCode = http.PUT(jsonData);
    
    if (httpCode > 0) {
      Serial.printf("✅ Firebase: %d\n", httpCode);
      Serial.println(http.getString());
    } else {
      Serial.printf("❌ Firebase error: %s\n", http.errorToString(httpCode).c_str());
    }
    
    http.end();
  }
}

// HÀM 2: Gọi Backend để kiểm tra và gửi email
void triggerBackendAlert() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    String backendUrl = String(BACKEND_URL) + "/api/check-firebase-and-alert";
    http.begin(backendUrl);
    http.addHeader("Content-Type", "application/json");
    
    // Chỉ cần gửi sensorId
    String jsonData = "{\"sensorId\":\"" + String(SENSOR_ID) + "\"}";
    
    int httpCode = http.POST(jsonData);
    
    if (httpCode > 0) {
      Serial.printf("✅ Backend: %d\n", httpCode);
      Serial.println(http.getString());
    } else {
      Serial.printf("❌ Backend error: %s\n", http.errorToString(httpCode).c_str());
    }
    
    http.end();
  }
}

// Hàm lấy timestamp (cần NTP hoặc RTC)
String getTimestamp() {
  // Sử dụng NTP hoặc RTC module
  // Ví dụ đơn giản:
  return "2025-11-19T" + String(millis() / 1000) + ":00";
}

void loop() {
  // Đọc cảm biến
  float waterLevel = readWaterSensor(); // Hàm đọc cảm biến của bạn
  String location = "Cống Phan Đình Phùng";
  
  // 1. POST lên Firebase
  postToFirebase(waterLevel, location);
  
  // 2. Gọi Backend để kiểm tra
  delay(2000); // Đợi Firebase cập nhật
  triggerBackendAlert();
  
  // Đợi 5 phút trước khi đo lại
  delay(300000); // 5 minutes
}

float readWaterSensor() {
  // Code đọc cảm biến của bạn
  // Ví dụ: đọc từ ultrasonic sensor, pressure sensor, etc.
  return 85.5; // Mock data
}
```

---

## 🔥 BƯỚC 2: Test Bằng Postman (Không cần IoT)

### **2.1. POST Dữ Liệu Lên Firebase:**

```http
PUT https://hackathon-weather-634bf-default-rtdb.firebaseio.com/sensors/flood/sensor_001.json
Content-Type: application/json

{
  "location": "Cống Phan Đình Phùng",
  "current_percent": 85,
  "previous_percent": 50,
  "timestamp": "2025-11-19T01:42:00"
}
```

**Response Firebase:**
```json
{
  "location": "Cống Phan Đình Phùng",
  "current_percent": 85,
  "previous_percent": 50,
  "timestamp": "2025-11-19T01:42:00"
}
```

---

### **2.2. Gọi Backend Để Kiểm Tra:**

```http
POST http://localhost:3001/api/check-firebase-and-alert
Content-Type: application/json

{
  "sensorId": "sensor_001"
}
```

**Response Backend:**
```json
{
  "success": true,
  "message": "Alert generated and email sent",
  "alert": {
    "subject": "⚠️ CẢNH BÁO KHẨN CẤP: NGẬP LỤT CAO TẠI CỐNG PHAN ĐÌNH PHÙNG",
    "htmlBody": "<b>Mức ngập hiện tại: 85%</b><br>..."
  },
  "sensorData": {
    "location": "Cống Phan Đình Phùng",
    "current_percent": 85,
    "previous_percent": 50,
    "timestamp": "2025-11-19T01:42:00"
  }
}
```

---

## 📊 BƯỚC 3: Đọc Dữ Liệu Firebase (Backend hoặc Frontend)

### **API Endpoint:**

```http
GET http://localhost:3001/api/firebase/sensors
GET http://localhost:3001/api/firebase/sensors/sensor_001
```

---

## 🔍 FIREBASE RULES (Quan trọng!)

Vào Firebase Console > Realtime Database > Rules:

```json
{
  "rules": {
    "sensors": {
      ".read": true,
      ".write": true
    },
    "alerts": {
      ".read": true,
      ".write": true
    }
  }
}
```

**⚠️ Lưu ý:** Rules này cho phép public read/write (chỉ dùng cho development). Production cần bảo mật hơn!

---

## ✅ CHECKLIST

- [ ] Firebase Realtime Database đã được tạo
- [ ] Firebase Rules đã cấu hình (allow read/write)
- [ ] Backend `.env` có `FIREBASE_DATABASE_URL`
- [ ] IoT device có WiFi
- [ ] IoT device test POST lên Firebase thành công
- [ ] Backend test đọc Firebase thành công
- [ ] Email được gửi khi mức ngập >= 80%

---

## 🎯 DEMO NHANH (Không cần IoT)

1. **POST lên Firebase bằng cURL:**
```bash
curl -X PUT "https://hackathon-weather-634bf-default-rtdb.firebaseio.com/sensors/flood/sensor_001.json" \
  -H "Content-Type: application/json" \
  -d '{"location":"Cống Test","current_percent":90,"previous_percent":60,"timestamp":"2025-11-19T02:00:00"}'
```

2. **Gọi Backend:**
```bash
curl -X POST http://localhost:3001/api/check-firebase-and-alert \
  -H "Content-Type: application/json" \
  -d '{"sensorId":"sensor_001"}'
```

3. **Kiểm tra email!** 📧

---

**Made with ❤️ by Hackathon WAI Team**

