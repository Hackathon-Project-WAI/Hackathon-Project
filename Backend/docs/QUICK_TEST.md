# ⚡ HƯỚNG DẪN TEST NHANH - 5 PHÚT

## 🎯 MỤC TIÊU
Test hệ thống cảnh báo ngập lụt **KHÔNG CẦN IoT device** - chỉ dùng Postman!

---

## 📋 CHUẨN BỊ

✅ Backend đang chạy: `npm start` (port 3001)  
✅ File `.env` đã cấu hình đúng  
✅ Cài Postman hoặc VS Code + REST Client extension

---

## 🚀 CÁCH 1: DÙNG POSTMAN (3 BƯỚC)

### **Bước 1: Import Collection**
1. Mở Postman
2. Click **Import** > **Upload Files**
3. Chọn file: `Backend/Postman_Collection.json`

### **Bước 2: POST Fake Data lên Firebase**
1. Mở folder: **🔥 FAKE DATA - IoT Simulation**
2. Click: **"1. POST Fake Data lên Firebase (Sensor 001)"**
3. Click **Send**

**✅ Kết quả:** Firebase sẽ trả về data bạn vừa gửi

### **Bước 3: Trigger Backend Alert**
1. Click: **"2. Gọi Backend Đọc Firebase và Gửi Email"**
2. Click **Send**

**✅ Kết quả:** 
- Backend đọc Firebase
- Gemini AI tạo cảnh báo
- Email được gửi tới `trantafi2204@gmail.com`

---

## 🚀 CÁCH 2: DÙNG VS CODE (2 BƯỚC)

### **Bước 1: Cài Extension**
1. Mở VS Code
2. Extensions > Tìm: **"REST Client"**
3. Cài đặt

### **Bước 2: Test**
1. Mở file: `Backend/test-api.http`
2. Click **"Send Request"** ở dòng 7 (POST lên Firebase)
3. Click **"Send Request"** ở dòng 20 (Gọi Backend)

---

## 🧪 TEST CASES - 5 TRƯỜNG HỢP

| Test | Mức Ngập | Kết Quả | Email? |
|------|----------|---------|--------|
| TEST 1 | 85% | ⚠️ Nguy hiểm | ✅ Có |
| TEST 2 | 65% | ⚠️ Trung bình | ❌ Không (< 80%) |
| TEST 3 | 40% | ✅ An toàn | ❌ Không |
| TEST 4 | 90% | 🚨 Nước tăng nhanh | ✅ Có |
| TEST 5 | 95% | 🔴 Cực kỳ nguy hiểm | ✅ Có |

**📧 Email chỉ gửi khi `current_percent >= 80%`**

---

## 📊 KIỂM TRA DỮ LIỆU FIREBASE

### **Cách 1: Qua Backend API**
```http
GET http://localhost:3001/api/firebase/sensors
```

### **Cách 2: Trực tiếp Firebase Console**
https://console.firebase.google.com/project/hackathon-weather-634bf/database

Path: `sensors/flood/`

---

## 🎯 TEST NHANH NHẤT (1 REQUEST)

Nếu không muốn dùng Firebase, gọi trực tiếp API:

```http
POST http://localhost:3001/api/generate-flood-alert
Content-Type: application/json

{
  "current_percent": 85,
  "previous_percent": 50,
  "location": "Cống Phan Đình Phùng, Đà Nẵng",
  "timestamp": "2025-11-19T14:30:00",
  "to": "trantafi2204@gmail.com"
}
```

**✅ Email sẽ được gửi ngay lập tức!**

---

## 🔍 KIỂM TRA EMAIL

1. Đăng nhập: https://mail.google.com
2. Email: `trantafi2204@gmail.com`
3. Tìm email với subject: **"CẢNH BÁO KHẨN CẤP: NGẬP LỤT..."**

**Lưu ý:** Email có thể vào **Spam**, kiểm tra cả folder đó!

---

## ❌ TROUBLESHOOTING

### **Lỗi 1: "ECONNREFUSED localhost:3001"**
→ Backend chưa chạy. Run: `npm start`

### **Lỗi 2: "GEMINI_API_KEY not configured"**
→ Chưa thêm `GEMINI_API_KEY` vào `.env`

### **Lỗi 3: "Email sending failed"**
→ Kiểm tra `EMAIL_USER` và `EMAIL_PASS` trong `.env`

### **Lỗi 4: Firebase 403 Permission Denied**
→ Vào Firebase Console > Database > Rules:
```json
{
  "rules": {
    "sensors": {
      ".read": true,
      ".write": true
    }
  }
}
```

---

## 📝 LOG TRONG CONSOLE

Nếu thành công, bạn sẽ thấy:

```
📊 Dữ liệu mới từ sensor sensor_001: { location: '...', current_percent: 85, ... }
🚨 CẢNH BÁO: Ngập lụt nguy hiểm tại Cống Phan Đình Phùng!
✅ Gemini AI generated alert: ⚠️ CẢNH BÁO KHẨN CẤP: NGẬP LỤT...
✉️ Đã gửi email cảnh báo tới trantafi2204@gmail.com
```

---

## 🎉 DEMO VIDEO (Gợi ý cho Hackathon)

1. Mở Postman (hoặc VS Code)
2. POST fake data lên Firebase (giả lập IoT)
3. Backend tự động đọc và phân tích
4. Gemini AI tạo email cảnh báo thông minh
5. Mở Gmail và show email vừa nhận

**Thời gian demo: < 2 phút!**

---

**Made with ❤️ by Hackathon WAI Team**

