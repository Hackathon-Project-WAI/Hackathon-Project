# 📮 Hướng Dẫn Test API Bằng Postman

## 📥 Import Collection

### **Cách 1: Import File JSON**
1. Mở Postman
2. Click **Import** (góc trên bên trái)
3. Chọn file: `Backend/Personalized_Alert_API.postman_collection.json`
4. Click **Import**

### **Cách 2: Copy-Paste JSON**
1. Mở file `Personalized_Alert_API.postman_collection.json`
2. Copy toàn bộ nội dung
3. Trong Postman: Import → Raw text → Paste → Continue

---

## ⚙️ Setup Variables

### **1. Sửa Collection Variables:**
1. Click vào Collection **Personalized Weather Alert API**
2. Tab **Variables**
3. Sửa các giá trị:
   - `userId`: Thay bằng userId thật của bạn trong Firestore
   - `testEmail`: Thay bằng email thật để nhận cảnh báo

### **2. Hoặc dùng Environment (Recommended):**

**Tạo Environment mới:**
1. Click icon ⚙️ (góc phải trên) → **Environments**
2. Click **+** → Tạo environment mới: `Weather Alert - Development`
3. Thêm variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `baseUrl` | `http://localhost:3001` | `http://localhost:3001` |
| `userId` | `MgqmfPnodPRCjEhqyfycYavN2cK2` | `YOUR_REAL_USER_ID` |
| `testEmail` | `your-email@gmail.com` | `YOUR_REAL_EMAIL` |

4. Click **Save**
5. Chọn environment này ở dropdown (góc phải trên)

---

## 🚀 Test Từng API

### **✅ Test 1: Kiểm Tra Địa Điểm + Gửi Email Cá Nhân Hóa**

**Endpoint:** `POST /api/check-user-locations-alert`

**Request Body:**
```json
{
  "userId": "MgqmfPnodPRCjEhqyfycYavN2cK2",
  "minRiskLevel": 1,
  "sendEmail": true
}
```

**Steps:**
1. Mở request **"1. Kiểm tra địa điểm + Gửi email cá nhân hóa"**
2. Sửa `userId` thành ID thật của bạn
3. Click **Send**

**Expected Response (Có Cảnh Báo):**
```json
{
  "success": true,
  "message": "Đã tạo 1 cảnh báo cá nhân hóa",
  "analysis": {
    "userId": "MgqmfPnodPRCjEhqyfycYavN2cK2",
    "user": {
      "name": "Nguyễn Văn Minh",
      "email": "minh@gmail.com"
    },
    "totalLocations": 1,
    "affectedLocations": 1
  },
  "alerts": [
    {
      "locationName": "nhà",
      "alert": {
        "subject": "🏠 Minh ơi - Cảnh báo ngập gần Nhà",
        "htmlBody": "<p>Xin chào <b>Minh</b>...</p>"
      },
      "emailSent": true,
      "distance": 120,
      "floodRisk": 2
    }
  ]
}
```

**Expected Response (Không Có Cảnh Báo):**
```json
{
  "success": true,
  "message": "Tất cả địa điểm của bạn đều an toàn",
  "userId": "MgqmfPnodPRCjEhqyfycYavN2cK2",
  "totalLocations": 1,
  "affectedLocations": 0,
  "alerts": []
}
```

**Check Email:**
- Vào hộp thư email của bạn
- Tìm email có subject như: `🏠 [Tên] ơi - Cảnh báo ngập gần [Địa điểm]`

---

### **✅ Test 2: Kiểm Tra Chỉ Xem (Không Gửi Email)**

**Use Case:** Preview kết quả trước khi gửi email thật

**Request Body:**
```json
{
  "userId": "MgqmfPnodPRCjEhqyfycYavN2cK2",
  "minRiskLevel": 0,
  "sendEmail": false
}
```

**Steps:**
1. Mở request **"2. Kiểm tra chỉ xem (KHÔNG gửi email)"**
2. Click **Send**

**Response:**
- Giống Test 1 nhưng `emailSent: false`
- Không có email gửi đi
- Vẫn lưu log vào Firestore

---

### **✅ Test 3: Lấy Danh Sách Địa Điểm**

**Endpoint:** `GET /api/user-locations/:userId`

**Steps:**
1. Mở request **"3. Lấy danh sách địa điểm của user"**
2. Sửa URL: thay `MgqmfPnodPRCjEhqyfycYavN2cK2` bằng userId thật
3. Click **Send**

**Response:**
```json
{
  "success": true,
  "userId": "MgqmfPnodPRCjEhqyfycYavN2cK2",
  "count": 1,
  "locations": [
    {
      "id": "-OeN97tUohTc0NKK8-Sd",
      "address": "nguyễn trí phương",
      "alertRadius": 1000,
      "coords": {
        "lat": 16.0678,
        "lon": 108.2208
      },
      "icon": "🏠",
      "name": "nhà",
      "priority": "high",
      "status": "safe"
    }
  ]
}
```

---

### **✅ Test 4: Phân Tích Thời Tiết Theo Tọa Độ**

**Use Case:** Kiểm tra bất kỳ tọa độ nào (không cần có user)

**Request Body:**
```json
{
  "lat": 16.0678,
  "lon": 108.2208,
  "to": "your-email@gmail.com",
  "minRiskLevel": 1,
  "includeAllAreas": false
}
```

**Steps:**
1. Mở request **"4. Phân tích thời tiết theo tọa độ"**
2. Sửa `to` thành email thật
3. Click **Send**

**Use Case:**
- Kiểm tra 1 địa điểm bất kỳ
- Không cần user đã đăng ký

---

### **✅ Test 5: Cảnh Báo Từ Cảm Biến IoT**

**Use Case:** Khi có dữ liệu % ngập từ cảm biến

**Request Body:**
```json
{
  "current_percent": 85,
  "previous_percent": 50,
  "location": "Cống Phan Đình Phùng",
  "timestamp": "2025-11-19T14:30:00",
  "to": "your-email@gmail.com"
}
```

**Steps:**
1. Mở request **"5. Cảnh báo từ cảm biến IoT"**
2. Click **Send**

**Response:**
```json
{
  "success": true,
  "message": "AI alert generated and email sent successfully",
  "alert": {
    "subject": "🚨 CẢNH BÁO KHẨN CẤP: Ngập lụt...",
    "htmlBody": "<b>CẢNH BÁO MỨC ĐỘ CAO</b>..."
  },
  "emailResult": {
    "success": true
  }
}
```

---

### **✅ Test 6: Test Email SMTP**

**Use Case:** Kiểm tra email config trước khi test API khác

**Request Body:**
```json
{
  "to": "your-email@gmail.com"
}
```

**Steps:**
1. Mở request **"6. Test Email đơn giản"**
2. Click **Send**

**Response:**
```json
{
  "success": true,
  "messageId": "<abc123@gmail.com>",
  "message": "Email sent successfully"
}
```

**Lỗi thường gặp:**
```json
{
  "success": false,
  "error": "Invalid login: 535-5.7.8 Username and Password not accepted"
}
```
→ **Fix:** Kiểm tra `EMAIL_USER` và `EMAIL_PASS` trong `.env`

---

## 🔥 Test Scenarios

### **Scenario 1: User mới đăng ký, thêm địa điểm lần đầu**

1. User thêm location "nhà" vào Firestore
2. Frontend gọi API:
```javascript
POST /api/check-user-locations-alert
{
  "userId": "new_user_123",
  "minRiskLevel": 0,  // Check tất cả
  "sendEmail": false  // Chỉ preview
}
```
3. Hiển thị kết quả cho user:
   - ✅ "Địa điểm an toàn"
   - ⚠️ "Cảnh báo: Có nguy cơ ngập nhẹ"

---

### **Scenario 2: Cron job kiểm tra định kỳ (mỗi 3 giờ)**

**Setup Cron:**
```javascript
// cron.js
const cron = require('node-cron');
const axios = require('axios');

// Chạy lúc 6:00, 9:00, 12:00, 15:00, 18:00, 21:00
cron.schedule('0 6,9,12,15,18,21 * * *', async () => {
  console.log('🕐 Kiểm tra định kỳ...');
  
  // Lấy danh sách userId active
  const users = await getActiveUsers(); // From Firestore
  
  for (const user of users) {
    if (!user.notifications?.email) continue;
    
    try {
      const response = await axios.post(
        'http://localhost:3001/api/check-user-locations-alert',
        {
          userId: user.id,
          minRiskLevel: 1,
          sendEmail: true
        }
      );
      
      console.log(`✅ Checked user ${user.id}: ${response.data.affectedLocations} alerts`);
    } catch (error) {
      console.error(`❌ Error user ${user.id}:`, error.message);
    }
  }
});
```

**Test bằng Postman:**
1. Tạo request mới: `POST {{baseUrl}}/api/check-user-locations-alert`
2. Body: `{"userId": "{{userId}}", "minRiskLevel": 1, "sendEmail": true}`
3. Thêm vào **Collection Runner**:
   - Click Collection → **Run**
   - Chọn request **"1. Kiểm tra địa điểm + Gửi email"**
   - Iterations: 1
   - Delay: 0ms
   - Run

---

### **Scenario 3: User nhấn nút "Kiểm tra ngay" trong app**

**Frontend Code:**
```javascript
const handleCheckNow = async () => {
  setLoading(true);
  
  try {
    const response = await fetch('/api/check-user-locations-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.uid,
        minRiskLevel: 1,
        sendEmail: true
      })
    });
    
    const result = await response.json();
    
    if (result.affectedLocations > 0) {
      showNotification({
        type: 'warning',
        title: `⚠️ ${result.affectedLocations} địa điểm có nguy cơ ngập`,
        message: 'Vui lòng kiểm tra email để xem chi tiết'
      });
    } else {
      showNotification({
        type: 'success',
        title: '✅ Tất cả địa điểm an toàn',
        message: 'Không có cảnh báo nào'
      });
    }
  } catch (error) {
    showNotification({
      type: 'error',
      title: 'Lỗi kiểm tra',
      message: error.message
    });
  } finally {
    setLoading(false);
  }
};
```

**Test bằng Postman:**
- Giống Test 1
- Quan sát console backend để thấy logs

---

## 📊 Check Firestore Sau Khi Test

### **1. Check personalizedAlerts:**
```
Firestore → users/{userId}/personalizedAlerts
```
Expected:
```javascript
{
  locationId: "-OeN97tUohTc0NKK8-Sd",
  locationName: "nhà",
  floodAreaName: "Đường Nguyễn Tri Phương",
  floodRisk: 2,
  riskScore: 68,
  distance: 120,
  emailSent: true,
  createdAt: Timestamp
}
```

### **2. Check location status:**
```
Firestore → users/{userId}/locations/{locationId}
```
Expected:
```javascript
{
  // ... existing fields ...
  status: "danger",  // Updated!
  lastAlertTime: "2025-11-19T14:30:00.000Z",  // Updated!
  updatedAt: Timestamp
}
```

### **3. Check stats:**
```
Firestore → users/{userId}/stats
```
Expected:
```javascript
{
  alertsReceived: 1,  // +1
  floodReports: 0,
  savedLocationsCount: 1
}
```

### **4. Check activities:**
```
Firestore → users/{userId}/activities
```
Expected: Activity mới với type `"alert_received"`

---

## 🐛 Troubleshooting

### **Lỗi: "Không tìm thấy user"**
```json
{
  "success": false,
  "error": "Không tìm thấy user"
}
```
**Fix:**
1. Check userId có đúng không
2. Check Firestore: `users/{userId}` có tồn tại không

---

### **Lỗi: "Không nhận được dữ liệu dự báo từ OpenWeather"**
```json
{
  "success": false,
  "error": "Không nhận được dữ liệu dự báo từ OpenWeather"
}
```
**Fix:**
1. Check `OPENWEATHER_API_KEY` trong `.env`
2. Test API key: https://api.openweathermap.org/data/2.5/weather?q=Danang&appid=YOUR_KEY
3. Check rate limit (60 calls/minute free tier)

---

### **Lỗi: "GEMINI_API_KEY chưa được cấu hình"**
```json
{
  "success": false,
  "error": "GEMINI_API_KEY chưa được cấu hình trong backend"
}
```
**Fix:**
1. Thêm `GEMINI_API_KEY` vào `Backend/.env`
2. Restart backend

---

### **Lỗi: Email không gửi được**
```json
{
  "emailSent": false,
  "error": "Invalid login: 535-5.7.8"
}
```
**Fix:**
1. Check `EMAIL_USER` và `EMAIL_PASS` trong `.env`
2. Đảm bảo dùng **App Password**, không phải password Gmail thường
3. Tạo App Password: https://myaccount.google.com/apppasswords

---

## 📸 Screenshots Expected

### **1. Postman Collection:**
```
📁 Personalized Weather Alert API
  └─ 📄 1. Kiểm tra địa điểm + Gửi email cá nhân hóa
  └─ 📄 2. Kiểm tra chỉ xem (KHÔNG gửi email)
  └─ 📄 3. Lấy danh sách địa điểm của user
  └─ 📄 4. Phân tích thời tiết theo tọa độ
  └─ 📄 5. Cảnh báo từ cảm biến IoT
  └─ 📄 6. Test Email đơn giản
  └─ 📄 7. Lấy dữ liệu Firebase Sensors
  └─ 📄 8. Kiểm tra 1 sensor cụ thể
  └─ 📄 9. Đọc Firebase + Tạo cảnh báo AI
  └─ 📄 10. Kiểm tra IoT data structure mới
```

### **2. Console Backend Logs:**
```
🔍 Đang phân tích địa điểm cho user: MgqmfPnodPRCjEhqyfycYavN2cK2
⚠️ Phát hiện 1/1 địa điểm có nguy cơ ngập
✅ AI tạo cảnh báo cho "nhà": 🏠 Minh ơi - Cảnh báo ngập gần Nhà
✉️ Đã gửi email cảnh báo tới minh@gmail.com
```

### **3. Email nhận được:**
```
Subject: 🏠 Minh ơi - Cảnh báo ngập gần Nhà (nguyễn trí phương)

Body:
┌─────────────────────────────────────┐
│  🚨 CẢNH BÁO NGẬP LỤT               │
└─────────────────────────────────────┘

Xin chào Nguyễn Văn Minh,

Hệ thống phát hiện nguy cơ ngập cao tại 
Đường Nguyễn Tri Phương, chỉ cách Nhà 
của bạn 120m.

📊 Dự báo:
• Lượng mưa: 65mm trong 3h tới
• Ngập dự kiến: 12cm trong 45 phút

⚠️ KHUYẾN NGHỊ:
• Di chuyển xe lên cao
• Đóng cửa chống nước
• Theo dõi cập nhật
```

---

## ✅ Checklist Test Đầy Đủ

- [ ] Import Postman Collection thành công
- [ ] Sửa `userId` và `testEmail` trong Variables
- [ ] Backend đang chạy (`npm start`)
- [ ] `.env` có đủ: `OPENWEATHER_API_KEY`, `GEMINI_API_KEY`, `EMAIL_USER`, `EMAIL_PASS`
- [ ] Test 1: Kiểm tra địa điểm → Response 200 OK
- [ ] Check email inbox → Nhận được email cá nhân hóa
- [ ] Check Firestore → personalizedAlerts có log mới
- [ ] Check Firestore → location.status đã update
- [ ] Check Firestore → stats.alertsReceived tăng
- [ ] Test 3: Lấy locations → Có dữ liệu
- [ ] Test 6: Email test → Gửi thành công

---

**🎯 Nếu tất cả test pass → API đã hoạt động hoàn hảo! 🚀**



