# 📮 Hướng Dẫn Sử Dụng Postman Collection

## 🚀 Import Collection Vào Postman

### Cách 1: Import File
1. Mở Postman
2. Click **Import** ở góc trên bên trái
3. Chọn file `Complete_API_Test.postman_collection.json`
4. Click **Import**

### Cách 2: Import từ URL (nếu có)
1. Mở Postman
2. Click **Import** → **Link**
3. Paste URL của file collection
4. Click **Continue** → **Import**

---

## 🎯 Cấu Hình Environment Variables

Collection đã có sẵn các biến:
- `BASE_URL`: http://localhost:3001
- `USER_ID`: user123 (thay đổi theo user ID thực tế)
- `SENSOR_ID`: sensor1 (thay đổi theo sensor ID thực tế)

### Cách thay đổi biến:
1. Click vào collection name
2. Chọn tab **Variables**
3. Sửa giá trị trong cột **Current Value**
4. Click **Save**

---

## 📁 Cấu Trúc Collection

### 1. 🏥 Health Check
- **Get API Status**: Kiểm tra server có đang chạy không

### 2. 📧 Email Alerts
- **Send Test Email**: Test gửi email đơn giản
- **Send Custom Email**: Gửi email với nội dung tùy chỉnh
- **Send Flood Alert Email**: Gửi cảnh báo lũ lụt
- **Send Weather Update Email**: Gửi cập nhật thời tiết

### 3. 🤖 AI Flood Alerts (Gemini)
- **Generate AI Flood Alert**: Sử dụng Gemini AI tạo cảnh báo thông minh

### 4. 🔥 Firebase Data
- **Get All Sensors**: Xem tất cả cảm biến
- **Get Sensor By ID**: Xem chi tiết 1 cảm biến
- **Write Firebase Data**: Ghi dữ liệu mới
- **Check Firebase & Send Alert**: Kiểm tra Firebase và gửi cảnh báo
- **Check IoT Data**: Kiểm tra dữ liệu IoT

### 5. 🎯 Personalized Alerts
- **Check User Locations Alert**: Kiểm tra tất cả vị trí của user
- **Get User Locations**: Lấy danh sách vị trí đã lưu
- **Analyze Weather Alert**: Phân tích thời tiết tại vị trí
- **Check Sensor Based Alert**: Cảnh báo dựa trên cảm biến gần user

### 6. ⚙️ Alert Settings & Auto Alert
- **Get Alert Settings**: Xem cấu hình cảnh báo tự động
- **Update Alert Settings**: Cập nhật cấu hình
- **Toggle Alert Settings**: Bật/tắt cảnh báo tự động
- **Delete Alert Settings**: Xóa cấu hình
- **Get Alert Logs**: Xem lịch sử cảnh báo
- **Test Alert Now**: Test gửi cảnh báo ngay
- **Get Scheduler Status**: Xem trạng thái scheduler

### 7. 📱 Telegram Bot
- **Get Telegram QR Info**: Lấy thông tin QR code
- **Get Bot Info**: Thông tin bot
- **Check Telegram Status**: Kiểm tra trạng thái liên kết
- **Unlink Telegram**: Hủy liên kết

---

## 🧪 Test Workflow Cơ Bản

### Workflow 1: Kiểm tra hệ thống
```
1. Get API Status
   → Đảm bảo server đang chạy

2. Get All Sensors
   → Xem có dữ liệu cảm biến không

3. Get Scheduler Status
   → Kiểm tra scheduler có hoạt động không
```

### Workflow 2: Test Email Alert
```
1. Send Test Email
   → Kiểm tra email service hoạt động

2. Send Flood Alert Email
   → Test gửi cảnh báo lũ lụt

3. Generate AI Flood Alert
   → Test AI tạo cảnh báo thông minh
```

### Workflow 3: Thiết lập Auto Alert cho User
```
1. Update Alert Settings
   → Tạo/cập nhật cấu hình cho user
   Body:
   {
     "email": "user@example.com",
     "isEnabled": true,
     "checkIntervalMinutes": 30
   }

2. Get Alert Settings
   → Verify cấu hình đã lưu

3. Test Alert Now
   → Test gửi cảnh báo ngay

4. Get Alert Logs
   → Xem lịch sử cảnh báo đã gửi
```

### Workflow 4: Telegram Integration
```
1. Get Bot Info
   → Lấy thông tin bot

2. Get Telegram QR Info
   → Lấy link để tạo QR code

3. Check Telegram Status
   → Kiểm tra user đã liên kết chưa
```

### Workflow 5: Personalized Alert
```
1. Check User Locations Alert
   → Kiểm tra tất cả vị trí của user
   Body:
   {
     "userId": "user123",
     "to": "user@example.com"
   }

2. Analyze Weather Alert
   → Phân tích thời tiết tại vị trí cụ thể
   Body:
   {
     "userId": "user123",
     "lat": 16.0544,
     "lon": 108.2022,
     "locationName": "Đà Nẵng"
   }
```

---

## 💡 Tips & Tricks

### 1. Thay đổi USER_ID nhanh
- Hover vào `{{USER_ID}}` trong URL
- Click để quick edit
- Hoặc dùng Environment variables

### 2. Copy Response để dùng cho request khác
```
Ví dụ:
1. Get All Sensors → Copy sensor ID
2. Get Sensor By ID → Paste vào {{SENSOR_ID}}
```

### 3. Test hàng loạt
- Click vào folder name (ví dụ: "Email Alerts")
- Click **Run** → **Run Email Alerts**
- Chọn requests muốn chạy
- Click **Run Email Alerts**

### 4. Save Response Examples
- Sau khi chạy request thành công
- Click **Save as Example**
- Lần sau sẽ thấy được response mẫu

---

## 🐛 Troubleshooting

### Lỗi: "Could not connect to server"
```
✅ Giải pháp:
- Kiểm tra server có đang chạy không
- Verify PORT đúng (mặc định 3001)
- Check firewall/antivirus
```

### Lỗi: "Firebase not initialized"
```
✅ Giải pháp:
- Kiểm tra file .env có FIREBASE_SERVICE_ACCOUNT_KEY
- Verify serviceAccountKey.json đúng path
- Restart server
```

### Lỗi: "Email service failed"
```
✅ Giải pháp:
- Check .env có EMAIL_USER và EMAIL_PASSWORD
- Verify Gmail App Password (nếu dùng Gmail)
- Test với Send Test Email trước
```

### Lỗi: "User not found" 
```
✅ Giải pháp:
- Thay đổi {{USER_ID}} thành user ID thực tế
- Hoặc tạo user mới trong Firebase
```

---

## 🔐 Security Notes

⚠️ **Quan trọng:**
- **KHÔNG** commit Postman collection có chứa API keys, passwords
- **KHÔNG** share collection có chứa thông tin nhạy cảm
- Sử dụng Environment variables cho sensitive data
- Tạo separate environment cho dev/staging/production

---

## 📊 Request Body Examples

### Update Alert Settings - Đầy đủ
```json
{
  "email": "user@example.com",
  "isEnabled": true,
  "checkIntervalMinutes": 30,
  "alertMethods": {
    "email": true,
    "telegram": true
  },
  "preferences": {
    "maxDistance": 5,
    "minWaterLevel": 100,
    "notificationTime": "always",
    "language": "vi"
  }
}
```

### Generate AI Flood Alert - Đầy đủ
```json
{
  "to": "user@example.com",
  "location": "Đà Nẵng, Việt Nam",
  "weatherData": {
    "temp": 28,
    "humidity": 90,
    "rainfall": 150,
    "windSpeed": 25,
    "description": "Mưa to có giông"
  },
  "floodRisk": "high",
  "additionalInfo": {
    "nearbyRivers": ["Sông Hàn", "Sông Cầu Đỏ"],
    "affectedAreas": ["Hải Châu", "Thanh Khê"]
  }
}
```

### Analyze Weather Alert - Đầy đủ
```json
{
  "userId": "user123",
  "to": "user@example.com",
  "lat": 16.0544,
  "lon": 108.2022,
  "locationName": "Đà Nẵng",
  "radius": 10
}
```

---

## 🎓 Best Practices

1. **Luôn test Health Check trước**
   - Đảm bảo server đang chạy
   - Verify endpoints available

2. **Dùng variables cho reusable data**
   - USER_ID, SENSOR_ID, emails, etc.
   - Dễ maintain và update

3. **Save examples cho team**
   - Request examples
   - Response examples
   - Error cases

4. **Organize theo workflow**
   - Group related requests
   - Add descriptions
   - Use folders effectively

5. **Monitor responses**
   - Check status codes
   - Verify response data
   - Test error cases

---

## 📞 Support

Nếu gặp vấn đề:
1. Check server logs
2. Verify environment variables
3. Test với Health Check endpoint
4. Check Firebase connection
5. Verify email service configuration

---

**Happy Testing! 🚀**

