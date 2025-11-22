# 📧 Hướng dẫn: Cảnh báo tự động định kỳ

## 🎯 Tính năng

Hệ thống tự động **kiểm tra dữ liệu sensor định kỳ** (ví dụ mỗi 5 phút) và **gửi email cảnh báo** khi mực nước vượt ngưỡng mà người dùng đã thiết lập.

---

## 🔧 Cách hoạt động

### 1. User cấu hình Alert Settings
- Thiết lập **ngưỡng cảnh báo** (threshold: 0-100%)
- Thiết lập **khoảng thời gian check** (checkInterval: milliseconds)
- Thiết lập **email nhận cảnh báo**
- Chọn **sensor IDs** cần theo dõi
- **Bật/tắt** tính năng auto-alert

### 2. Scheduler Service tự động chạy
- Khi server khởi động, Scheduler Service sẽ:
  - Lấy danh sách tất cả users có `enabled: true`
  - Tạo interval timer cho mỗi user theo `checkInterval`
  - Tự động check dữ liệu sensor định kỳ

### 3. Kiểm tra và gửi email
- Mỗi lần check:
  - Đọc dữ liệu từ Firebase (`iotData/{sensorId}` hoặc `sensors/flood/{sensorId}`)
  - So sánh `current_percent` với `threshold`
  - Nếu vượt ngưỡng → Tạo cảnh báo bằng AI → Gửi email
  - Lưu log vào Firebase

---

## 📡 API Endpoints

### 1. **Lấy cấu hình cảnh báo**
```http
GET /api/alert-settings/:userId
```

**Response:**
```json
{
  "success": true,
  "settings": {
    "enabled": false,
    "threshold": 80,
    "checkInterval": 300000,
    "email": "",
    "sensorIds": [],
    "lastChecked": null,
    "lastAlertSent": null,
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000
  }
}
```

---

### 2. **Cập nhật cấu hình cảnh báo**
```http
PUT /api/alert-settings/:userId
Content-Type: application/json

{
  "threshold": 75,
  "checkInterval": 300000,
  "email": "user@example.com",
  "sensorIds": ["SENSOR_ROAD", "SENSOR_SEWER"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Alert settings updated successfully",
  "settings": { ... }
}
```

**Lưu ý:**
- `threshold`: 0-100 (%)
- `checkInterval`: tối thiểu 60000 (1 phút), đơn vị milliseconds
  - 5 phút = 300000
  - 10 phút = 600000
  - 30 phút = 1800000

---

### 3. **Bật/tắt cảnh báo tự động**
```http
POST /api/alert-settings/:userId/toggle
Content-Type: application/json

{
  "enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đã BẬT cảnh báo tự động",
  "enabled": true
}
```

---

### 4. **Xóa cấu hình**
```http
DELETE /api/alert-settings/:userId
```

---

### 5. **Lấy lịch sử cảnh báo**
```http
GET /api/alert-settings/:userId/logs?limit=20
```

**Response:**
```json
{
  "success": true,
  "total": 5,
  "logs": [
    {
      "id": "-NxYz123",
      "sensorId": "SENSOR_ROAD",
      "sensorData": { ... },
      "alert": {
        "subject": "🚨 Cảnh báo...",
        "htmlBody": "..."
      },
      "sentAt": 1700000000000,
      "createdAt": 1700000000000
    }
  ]
}
```

---

### 6. **Test gửi cảnh báo ngay**
```http
POST /api/alert-settings/:userId/test
```

Không đợi scheduler, test ngay lập tức với cấu hình hiện tại.

---

### 7. **Kiểm tra trạng thái Scheduler**
```http
GET /api/scheduler/status
```

**Response:**
```json
{
  "success": true,
  "scheduler": {
    "isRunning": true,
    "totalUsers": 3,
    "users": ["user1", "user2", "user3"]
  }
}
```

---

## 🚀 Ví dụ sử dụng

### Bước 1: Cấu hình ban đầu

```bash
# Thiết lập ngưỡng 75%, check mỗi 5 phút
curl -X PUT http://localhost:3000/api/alert-settings/user123 \
  -H "Content-Type: application/json" \
  -d '{
    "threshold": 75,
    "checkInterval": 300000,
    "email": "user@example.com",
    "sensorIds": ["SENSOR_ROAD", "SENSOR_SEWER"]
  }'
```

### Bước 2: Bật cảnh báo tự động

```bash
curl -X POST http://localhost:3000/api/alert-settings/user123/toggle \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
```

### Bước 3: Test ngay

```bash
curl -X POST http://localhost:3000/api/alert-settings/user123/test
```

### Bước 4: Xem lịch sử

```bash
curl http://localhost:3000/api/alert-settings/user123/logs?limit=10
```

---

## 📊 Cấu trúc Firebase Database

```
userSettings/
  {userId}/
    alertSettings/
      enabled: true
      threshold: 75
      checkInterval: 300000
      email: "user@example.com"
      sensorIds: ["SENSOR_ROAD", "SENSOR_SEWER"]
      lastChecked: 1700000000000
      lastAlertSent: 1700000000000
      createdAt: 1700000000000
      updatedAt: 1700000000000
    alertLogs/
      -NxYz123/
        sensorId: "SENSOR_ROAD"
        sensorData: { ... }
        alert: { ... }
        sentAt: 1700000000000
```

---

## 🔍 Scheduler Logic

```javascript
// Khi server khởi động
schedulerService.start()
  → Lấy tất cả users có enabled: true
  → Tạo setInterval() cho mỗi user với checkInterval riêng

// Mỗi lần interval chạy:
setInterval(() => {
  1. Đọc dữ liệu sensor từ Firebase
  2. Tính current_percent
  3. So sánh với threshold
  4. Nếu vượt ngưỡng:
     - Tạo cảnh báo bằng Gemini AI
     - Gửi email
     - Lưu log
     - Cập nhật lastAlertSent
  5. Cập nhật lastChecked
}, checkInterval)

// Khi user update settings:
→ Restart scheduler với interval mới

// Khi user toggle enabled:
→ Start hoặc Stop scheduler
```

---

## ⚙️ Configuration

Các file cần chú ý:
- `src/services/alertSettingsService.js` - Quản lý settings
- `src/services/schedulerService.js` - Tự động check định kỳ
- `src/controllers/alertSettingsController.js` - API controller
- `src/index.js` - Khởi động scheduler khi server start

---

## 🐛 Troubleshooting

### 1. Scheduler không chạy
- Kiểm tra Firebase đã được khởi tạo chưa
- Kiểm tra console log: `🕐 Scheduler Service đang khởi động...`
- Gọi `GET /api/scheduler/status` để xem trạng thái

### 2. Không nhận được email
- Kiểm tra cấu hình email trong `.env`
- Kiểm tra `threshold` và dữ liệu sensor
- Gọi `POST /api/alert-settings/:userId/test` để test
- Xem console log xem có lỗi gì không

### 3. Check quá thường xuyên/chậm
- Cập nhật `checkInterval` qua API
- Scheduler sẽ tự động restart với interval mới

### 4. Muốn dừng tạm thời
```bash
# Tắt cảnh báo cho 1 user
curl -X POST http://localhost:3000/api/alert-settings/user123/toggle \
  -d '{"enabled": false}'

# Scheduler sẽ tự động dừng interval cho user này
```

---

## 💡 Tips

1. **Interval tối ưu:**
   - 5 phút (300000ms) - Khuyến nghị cho giám sát thường xuyên
   - 10 phút (600000ms) - Tiết kiệm tài nguyên
   - 1 phút (60000ms) - Cho trường hợp khẩn cấp

2. **Tránh spam email:**
   - Hệ thống lưu `lastAlertSent` để tránh gửi quá nhiều
   - Có thể thêm logic cooldown trong code nếu cần

3. **Multiple sensors:**
   - Có thể theo dõi nhiều sensors cùng lúc
   - Chỉ gửi 1 email nếu bất kỳ sensor nào vượt ngưỡng

4. **Graceful shutdown:**
   - Server tự động dừng scheduler khi nhận SIGTERM/SIGINT
   - Không lo interval bị "leak"

---

## 📝 Example Frontend Code

```javascript
// Lấy settings hiện tại
const getSettings = async (userId) => {
  const response = await fetch(`/api/alert-settings/${userId}`);
  return response.json();
};

// Cập nhật settings
const updateSettings = async (userId, settings) => {
  const response = await fetch(`/api/alert-settings/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  return response.json();
};

// Bật/tắt
const toggleAlert = async (userId, enabled) => {
  const response = await fetch(`/api/alert-settings/${userId}/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled })
  });
  return response.json();
};

// Test
const testAlert = async (userId) => {
  const response = await fetch(`/api/alert-settings/${userId}/test`, {
    method: 'POST'
  });
  return response.json();
};

// Lấy logs
const getLogs = async (userId, limit = 20) => {
  const response = await fetch(`/api/alert-settings/${userId}/logs?limit=${limit}`);
  return response.json();
};
```

---

## ✅ Checklist triển khai

- [ ] Đã cấu hình email trong `.env` (EMAIL_USER, EMAIL_PASS)
- [ ] Firebase đã được khởi tạo
- [ ] Server đang chạy và scheduler đã start
- [ ] User đã cấu hình settings (threshold, interval, email, sensorIds)
- [ ] Đã bật `enabled: true`
- [ ] Đã test với `/api/alert-settings/:userId/test`
- [ ] Check logs và email inbox

---

**🎉 Hoàn tất! Hệ thống tự động cảnh báo đã sẵn sàng!**


