# 🎯 API Cảnh Báo Cá Nhân Hóa - Theo Địa Điểm Người Dùng

## 📊 Tổng Quan

API này phân tích **TẤT CẢ địa điểm** mà người dùng đã lưu trong Firestore, kiểm tra nguy cơ ngập trong bán kính cảnh báo, và tự động tạo email cá nhân hóa bằng **Gemini AI**.

---

## 🔌 API Endpoints

### 1. **Kiểm Tra & Gửi Cảnh Báo Cá Nhân Hóa**

**Endpoint:** `POST /api/check-user-locations-alert`

**Request Body:**
```json
{
  "userId": "MgqmfPnodPRCjEhqyfycYavN2cK2",
  "minRiskLevel": 1,
  "sendEmail": true
}
```

**Parameters:**
| Tên | Type | Bắt buộc | Mặc định | Mô tả |
|-----|------|----------|----------|-------|
| `userId` | string | ✅ | - | ID người dùng trong Firestore |
| `minRiskLevel` | number | ❌ | 1 | Ngưỡng cảnh báo (0-3) |
| `sendEmail` | boolean | ❌ | true | Có gửi email hay không |

**Response (Success - Có Cảnh Báo):**
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
        "subject": "🏠 Minh ơi - Cảnh báo ngập gần Nhà (nguyễn trí phương)",
        "htmlBody": "<p>Xin chào <b>Minh</b>,</p><p>Hệ thống phát hiện <b style='color:orange'>nguy cơ ngập</b> tại <b>Đường Nguyễn Tri Phương</b>, chỉ cách <b>Nhà</b> của bạn 120m...</p>"
      },
      "emailSent": true,
      "distance": 120,
      "floodRisk": 2
    }
  ]
}
```

**Response (Success - Không Có Cảnh Báo):**
```json
{
  "success": true,
  "message": "Tất cả địa điểm của bạn đều an toàn",
  "userId": "MgqmfPnodPRCjEhqyfycYavN2cK2",
  "user": {
    "name": "Nguyễn Văn Minh",
    "email": "minh@gmail.com"
  },
  "totalLocations": 1,
  "affectedLocations": 0,
  "alerts": []
}
```

---

### 2. **Lấy Danh Sách Địa Điểm User**

**Endpoint:** `GET /api/user-locations/:userId`

**Request:**
```
GET /api/user-locations/MgqmfPnodPRCjEhqyfycYavN2cK2
```

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
      "createdAt": 1763489536921,
      "icon": "🏠",
      "name": "nhà",
      "priority": "high",
      "status": "safe"
    }
  ]
}
```

---

## 🧠 Logic Hoạt Động

### **Flow Xử Lý:**

```
1. Nhận userId từ request
     ↓
2. Lấy thông tin user từ Firestore (users/{userId})
     ↓
3. Lấy tất cả locations từ users/{userId}/locations
     ↓
4. Với mỗi location:
   a. Lấy tọa độ (lat, lon)
   b. Gọi OpenWeather API → dự báo thời tiết 48h
   c. Phân tích ngập lụt (floodPredictionService)
   d. Tìm khu vực ngập trong bán kính alertRadius
   e. Lọc theo minRiskLevel
     ↓
5. Nếu có nguy cơ ngập:
   a. Tạo prompt AI cá nhân hóa (có tên user, địa điểm cụ thể)
   b. Gọi Gemini 2.5 Flash → tạo email
   c. Gửi email (nếu sendEmail = true)
   d. Lưu log vào users/{userId}/personalizedAlerts
   e. Cập nhật status location (safe/warning/danger/critical)
   f. Tăng stats.alertsReceived
   g. Thêm activity log
     ↓
6. Trả về danh sách cảnh báo
```

---

## 🎨 AI Personalization

### **Prompt Template:**

```javascript
Bạn là một hệ thống AI chuyên tạo cảnh báo ngập lụt CÁ NHÂN HÓA bằng tiếng Việt.

THÔNG TIN NGƯỜI DÙNG:
- Tên: Nguyễn Văn Minh
- Email: minh@gmail.com
- Địa điểm quan tâm: Nhà "nhà" (🏠)
- Địa chỉ: nguyễn trí phương
- Mức ưu tiên: high

THÔNG TIN KHU VỰC NGẬP:
- Tên khu vực ngập: Đường Nguyễn Tri Phương (Hải Châu)
- Khoảng cách từ Nhà: 120m
- Cấp độ nguy hiểm: NGUY HIỂM
- Điểm rủi ro: 68/100

DỮ LIỆU DỰ BÁO:
- Lượng mưa 3h tới: 65mm
- Lượng mưa 6h tới: 110mm
- Độ sâu ngập dự kiến: 12cm
- Thời gian ngập: 45 phút

YÊU CẦU TẠO EMAIL:
1. Tiêu đề: Có icon 🏠, tên "Minh", địa điểm "nhà"
2. Nội dung: 
   - Chào "Nguyễn Văn Minh"
   - Nhấn mạnh "Nhà nhà" và khoảng cách "120m"
   - Hành động cụ thể cho loại "residential"
3. Tone: Cá nhân hóa, thân thiện, dưới 150 từ

FORMAT: JSON {"subject": "...", "htmlBody": "..."}
```

### **Output Mẫu:**

```json
{
  "subject": "🏠 Minh ơi - Cảnh báo ngập gần Nhà (nguyễn trí phương)",
  "htmlBody": "<p>Xin chào <b>Nguyễn Văn Minh</b>,</p><p>Hệ thống phát hiện <b style='color:orange'>nguy cơ ngập cao</b> tại <b>Đường Nguyễn Tri Phương</b>, chỉ cách <b>Nhà</b> của bạn 120m.</p><ul><li>Lượng mưa dự báo: 65mm trong 3h tới</li><li>Ngập dự kiến: 12cm trong 45 phút</li></ul><p><b>KHUYẾN NGHỊ:</b></p><ul><li>⚠️ Di chuyển xe lên cao</li><li>🚪 Đóng cửa chống nước</li><li>📱 Theo dõi cập nhật</li></ul>"
}
```

---

## 📝 Firestore Updates

### **Collections được cập nhật:**

#### 1. `users/{userId}/personalizedAlerts/{alertId}`
```javascript
{
  locationId: "-OeN97tUohTc0NKK8-Sd",
  locationName: "nhà",
  locationAddress: "nguyễn trí phương",
  floodAreaId: 2,
  floodAreaName: "Đường Nguyễn Tri Phương",
  floodRisk: 2,
  riskScore: 68,
  distance: 120,
  rainfall3h: 65.0,
  predictedDepth: 12,
  emailSent: true,
  emailSubject: "🏠 Minh ơi - Cảnh báo ngập...",
  createdAt: Timestamp,
  isRead: false
}
```

#### 2. `users/{userId}/locations/{locationId}`
```javascript
{
  // ... existing fields ...
  status: "danger",  // "safe", "warning", "danger", "critical"
  lastAlertTime: "2025-11-19T14:30:00.000Z",
  updatedAt: Timestamp
}
```

#### 3. `users/{userId}/stats`
```javascript
{
  alertsReceived: 1,  // +1
  floodReports: 0,
  savedLocationsCount: 1,
  updatedAt: Timestamp
}
```

#### 4. `users/{userId}/activities/{activityId}`
```javascript
{
  type: "alert_received",
  title: "Cảnh báo ngập tại Đường Nguyễn Tri Phương",
  description: "Cảnh báo cho địa điểm \"nhà\" - Cách 120m",
  timestamp: 1763489537116,
  metadata: {
    locationId: "-OeN97tUohTc0NKK8-Sd",
    floodAreaId: 2,
    riskLevel: 2
  }
}
```

---

## 🧪 Cách Test

### **Test với PowerShell:**

```powershell
# 1. Test kiểm tra địa điểm + gửi email
$body = @{
    userId = "MgqmfPnodPRCjEhqyfycYavN2cK2"
    minRiskLevel = 1
    sendEmail = $true
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri "http://localhost:3001/api/check-user-locations-alert" `
  -Body $body `
  -ContentType "application/json"

# 2. Test chỉ xem analysis (không gửi email)
$body = @{
    userId = "MgqmfPnodPRCjEhqyfycYavN2cK2"
    minRiskLevel = 0
    sendEmail = $false
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri "http://localhost:3001/api/check-user-locations-alert" `
  -Body $body `
  -ContentType "application/json"

# 3. Test lấy danh sách địa điểm
Invoke-RestMethod -Method Get `
  -Uri "http://localhost:3001/api/user-locations/MgqmfPnodPRCjEhqyfycYavN2cK2"
```

### **Test với cURL:**

```bash
# Kiểm tra + gửi email
curl -X POST http://localhost:3001/api/check-user-locations-alert \
  -H "Content-Type: application/json" \
  -d '{"userId":"MgqmfPnodPRCjEhqyfycYavN2cK2","minRiskLevel":1,"sendEmail":true}'

# Lấy locations
curl http://localhost:3001/api/user-locations/MgqmfPnodPRCjEhqyfycYavN2cK2
```

---

## 🎯 Use Cases

### **1. Manual Check (User nhấn nút "Kiểm tra ngay")**
```javascript
// Frontend button click
const checkNow = async () => {
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
    showAlert(`⚠️ ${result.affectedLocations} địa điểm có nguy cơ ngập!`);
  }
};
```

### **2. Scheduled Check (Cron Job - Mỗi 3 giờ)**
```javascript
// cron.js
const cron = require('node-cron');

// Chạy mỗi 3 giờ
cron.schedule('0 */3 * * *', async () => {
  console.log('🕐 Bắt đầu kiểm tra định kỳ...');
  
  // Lấy tất cả userId có notifications.email = true
  const users = await getAllActiveUsers();
  
  for (const user of users) {
    try {
      await fetch('http://localhost:3001/api/check-user-locations-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          minRiskLevel: 1,
          sendEmail: true
        })
      });
    } catch (error) {
      console.error(`Lỗi check user ${user.id}:`, error);
    }
  }
});
```

### **3. Real-time Check (khi user thêm địa điểm mới)**
```javascript
// Frontend - Sau khi thêm location
const onLocationAdded = async (locationId) => {
  // Kiểm tra ngay địa điểm vừa thêm
  const response = await fetch('/api/check-user-locations-alert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: currentUser.uid,
      minRiskLevel: 0, // Check tất cả
      sendEmail: false // Chỉ xem, không gửi email
    })
  });
  
  const result = await response.json();
  const newLocationAlert = result.alerts.find(
    a => a.locationId === locationId
  );
  
  if (newLocationAlert) {
    showWarning(`⚠️ Địa điểm vừa thêm có nguy cơ ngập!`);
  }
};
```

---

## ⚙️ Configuration

### **.env Requirements:**
```env
# OpenWeather API
OPENWEATHER_API_KEY=your_openweather_key

# Gemini AI
GEMINI_API_KEY=your_gemini_key

# Email Service
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your_app_password

# Firebase Admin SDK (auto-loaded from serviceAccountKey.json)
```

---

## 🚀 Next Steps

### **Features có thể mở rộng:**

1. **Smart Frequency Control:**
   ```javascript
   // Không gửi email quá nhiều cho cùng 1 địa điểm
   if (location.lastAlertTime) {
     const hoursSinceLastAlert = 
       (Date.now() - location.lastAlertTime) / (1000 * 60 * 60);
     
     if (hoursSinceLastAlert < 3) {
       console.log('Đã gửi cảnh báo gần đây, bỏ qua');
       return;
     }
   }
   ```

2. **Route Suggestions:**
   ```javascript
   // Dùng Google Directions API
   if (location.type === 'office') {
     const safestRoute = await getSafestRoute(
       homeLocation,
       officeLocation,
       floodAreas
     );
     
     // Thêm vào email: "Đường đề xuất: Lê Duẩn → Ngô Quyền"
   }
   ```

3. **Multi-language Support:**
   ```javascript
   // Thêm field language vào user
   const aiPrompt = createPrompt(user, alert, user.language || 'vi');
   // Support: 'vi', 'en'
   ```

4. **Push Notifications:**
   ```javascript
   // Gửi thông báo qua FCM
   if (user.notifications.push && user.fcmToken) {
     await sendPushNotification(user.fcmToken, {
       title: generatedAlert.subject,
       body: stripHtml(generatedAlert.htmlBody)
     });
   }
   ```

---

## 📊 Monitoring & Analytics

### **Metrics cần track:**
- Số lượng cảnh báo gửi mỗi ngày
- Tỷ lệ email mở (open rate)
- Tỷ lệ click vào link trong email
- Số user active (có ít nhất 1 location)
- Số location trung bình mỗi user
- API response time

### **Log format:**
```javascript
console.log(`
📊 Personalized Alert Summary:
- User: ${userId}
- Total Locations: ${totalLocations}
- Affected: ${affectedLocations}
- Emails Sent: ${emailsSent}
- Time: ${Date.now() - startTime}ms
`);
```

---

**🎯 API này đã sẵn sàng sử dụng! Hãy test với userId thật của bạn.**



