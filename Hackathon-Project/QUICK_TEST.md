# ⚡ Quick Test Guide - API Integration

## 🚀 Kiểm tra nhanh hệ thống

### **Bước 1: Khởi động Backend**

```bash
cd Backend
npm start
```

**Kiểm tra:** Mở http://localhost:3001 - phải thấy message hoặc không bị lỗi

---

### **Bước 2: Khởi động Frontend**

```bash
cd Hackathon-Project
npm run dev
```

**Kiểm tra:** Mở http://localhost:3000 - app phải chạy bình thường

---

### **Bước 3: Test API trong Browser Console**

Mở DevTools (F12) → Console tab, paste các lệnh sau:

#### **Test 1: Import API**

```javascript
// Paste vào console
import("http://localhost:3000/static/js/bundle.js").then(() => {
  console.log("✅ App loaded successfully");
});
```

#### **Test 2: Test Backend Connection**

```javascript
// Test backend có chạy không
fetch("http://localhost:3001/api/firebase/sensors")
  .then((res) => res.json())
  .then((data) => console.log("✅ Backend connected:", data))
  .catch((err) => console.error("❌ Backend error:", err));
```

#### **Test 3: Test Email API**

```javascript
// Test gửi email (thay your-email@gmail.com)
fetch("http://localhost:3001/api/send-test-email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ to: "your-email@gmail.com" }),
})
  .then((res) => res.json())
  .then((data) => console.log("✅ Email sent:", data))
  .catch((err) => console.error("❌ Email error:", err));
```

#### **Test 4: Test AI Alert**

```javascript
// Test AI alert generation
fetch("http://localhost:3001/api/generate-flood-alert", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    current_percent: 85,
    previous_percent: 50,
    location: "Test Location",
    timestamp: new Date().toISOString(),
  }),
})
  .then((res) => res.json())
  .then((data) => {
    console.log("✅ AI Alert generated:");
    console.log("Subject:", data.alert.subject);
    console.log("Body:", data.alert.htmlBody.substring(0, 200) + "...");
  })
  .catch((err) => console.error("❌ AI Alert error:", err));
```

#### **Test 5: Test Firebase Sensors**

```javascript
// Test Firebase sensors
fetch("http://localhost:3001/api/firebase/sensors")
  .then((res) => res.json())
  .then((data) => {
    console.log("✅ Firebase sensors:");
    console.log("SENSOR_ROAD:", data.data.SENSOR_ROAD);
    console.log("SENSOR_SEWER:", data.data.SENSOR_SEWER);
  })
  .catch((err) => console.error("❌ Firebase error:", err));
```

#### **Test 6: Test Personalized Alerts**

```javascript
// Test personalized alerts (thay userId)
fetch("http://localhost:3001/api/user-locations/MgqmfPnodPRCjEhqyfycYavN2cK2")
  .then((res) => res.json())
  .then((data) => {
    console.log("✅ User locations:", data.locations);
  })
  .catch((err) => console.error("❌ User locations error:", err));
```

---

### **Bước 4: Test trong React App**

#### **Option A: Sử dụng Demo Page**

1. Thêm route trong `src/App.js`:

```javascript
import APIDemo from "./pages/APIDemo";

<Route path="/api-demo" element={<APIDemo />} />;
```

2. Truy cập: http://localhost:3000/api-demo

3. Test từng tab:
   - 🤖 AI Alert - Generate AI flood alert
   - 🎯 Personalized Alert - Check user locations
   - 🌊 Firebase Sensors - Monitor real-time sensors

#### **Option B: Sử dụng Components riêng lẻ**

**Test AI Alert Component:**

```javascript
// Thêm vào trang bất kỳ
import AIAlertDemo from "./components/AIAlertDemo";

function MyPage() {
  return <AIAlertDemo />;
}
```

**Test Personalized Alert:**

```javascript
import PersonalizedAlertDemo from "./components/PersonalizedAlertDemo";

function MyPage() {
  return <PersonalizedAlertDemo currentUserId="MgqmfPnodPRCjEhqyfycYavN2cK2" />;
}
```

**Test Firebase Sensors:**

```javascript
import FirebaseSensorsMonitor from "./components/FirebaseSensorsMonitor";

function MyPage() {
  return <FirebaseSensorsMonitor />;
}
```

---

### **Bước 5: Test với Hooks**

Tạo file test component: `src/components/QuickTest.js`

```javascript
import React from "react";
import { useAIAlert } from "../hooks/useAIAlert";
import { useFirebaseSensors } from "../hooks/useFirebaseSensors";

function QuickTest() {
  const { loading, alert, generateAlert } = useAIAlert();
  const { sensors } = useFirebaseSensors(true, 5000);

  const handleTest = async () => {
    console.log("🧪 Testing AI Alert...");
    try {
      const result = await generateAlert({
        current_percent: 85,
        previous_percent: 50,
        location: "Test Location",
      });
      console.log("✅ Success:", result);
    } catch (err) {
      console.error("❌ Error:", err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Quick Test</h1>

      <button onClick={handleTest} disabled={loading}>
        Test AI Alert
      </button>

      {alert && (
        <div>
          <h3>Alert Generated:</h3>
          <p>{alert.subject}</p>
        </div>
      )}

      <h3>Firebase Sensors:</h3>
      {sensors && <pre>{JSON.stringify(sensors, null, 2)}</pre>}
    </div>
  );
}

export default QuickTest;
```

Thêm vào App.js:

```javascript
import QuickTest from "./components/QuickTest";
<Route path="/quick-test" element={<QuickTest />} />;
```

Truy cập: http://localhost:3000/quick-test

---

## ✅ Checklist - Đảm bảo tất cả hoạt động

### **Backend APIs**

- [ ] Backend chạy tại http://localhost:3001
- [ ] `GET /api/firebase/sensors` - Trả về sensors data
- [ ] `POST /api/send-test-email` - Gửi email thành công
- [ ] `POST /api/generate-flood-alert` - Generate AI alert
- [ ] `GET /api/user-locations/:userId` - Get user locations

### **Frontend Integration**

- [ ] Frontend chạy tại http://localhost:3000
- [ ] Import `{ api }` from './api' - Không lỗi
- [ ] Hooks (useAIAlert, useFirebaseSensors, etc.) - Hoạt động
- [ ] Demo components render đúng
- [ ] Console không có lỗi CORS

### **Features**

- [ ] AI Alert generation hoạt động
- [ ] Email notification gửi được
- [ ] Firebase sensors hiển thị data
- [ ] Personalized alerts check được locations
- [ ] Real-time auto-refresh sensors

---

## 🐛 Common Test Errors

### **Error: "Network Error"**

```
❌ Lỗi: Network Error
```

**Giải pháp:** Backend chưa chạy

```bash
cd Backend
npm start
```

### **Error: "CORS policy"**

```
❌ Access to fetch ... blocked by CORS policy
```

**Giải pháp:** Check Backend có `cors()` middleware

### **Error: "503 Service Unavailable"**

```
❌ Firebase chưa được cấu hình
```

**Giải pháp:** Thêm `serviceAccountKey.json` vào `Backend/configs/`

### **Error: "404 Not Found"**

```
❌ 404 Not Found - models/gemini-xxx
```

**Giải pháp:** Check GEMINI_API_KEY trong Backend `.env`

---

## 📊 Expected Results

### **Test AI Alert - Expected Output:**

```json
{
  "success": true,
  "alert": {
    "subject": "⚠️ CẢNH BÁO NGẬP LỤT - Test Location",
    "htmlBody": "<div>...</div>"
  }
}
```

### **Test Firebase Sensors - Expected Output:**

```json
{
  "success": true,
  "data": {
    "SENSOR_ROAD": {
      "device_id": "SENSOR_ROAD",
      "flood_status": "SAFE",
      "water_level_cm": 15,
      "latitude": 16.6125,
      "longitude": 108.2442
    },
    "SENSOR_SEWER": { ... }
  }
}
```

### **Test User Locations - Expected Output:**

```json
{
  "success": true,
  "userId": "MgqmfPnodPRCjEhqyfycYavN2cK2",
  "count": 2,
  "locations": [
    {
      "id": "loc_001",
      "name": "Nhà riêng",
      "address": "123 ABC",
      "latitude": 16.0544,
      "longitude": 108.2022,
      "alert_radius": 3,
      "is_active": true
    }
  ]
}
```

---

## 🎓 Next Steps After Testing

1. **Tất cả tests pass** ✅
   → Tích hợp vào app chính

2. **Một số tests fail** ❌
   → Check error messages
   → Đọc Troubleshooting section
   → Fix issues

3. **Customize** 🎨
   → Chỉnh UI/UX
   → Thêm features
   → Deploy

---

## 📞 Need Help?

1. Check console logs (F12 → Console)
2. Check network requests (F12 → Network)
3. Read error messages carefully
4. Check `INTEGRATION_GUIDE.md`
5. Test with Postman collection

---

**🎉 Happy Testing! 🚀**
