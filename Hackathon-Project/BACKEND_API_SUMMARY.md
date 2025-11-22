# 🌊 Backend API Integration - Summary

## ✅ Đã tích hợp thành công!

Frontend React của bạn đã được tích hợp đầy đủ với tất cả API từ Backend Node.js.

---

## 📦 Files đã tạo

### **1. API Clients** (`src/api/`)
✅ `config.js` - API endpoints và configuration  
✅ `client.js` - Axios instance với interceptors  
✅ `emailApi.js` - Email services (test, flood alert, weather update)  
✅ `aiAlertApi.js` - AI-generated flood alerts (Gemini 2.5 Flash)  
✅ `firebaseApi.js` - Firebase Realtime Database sensors  
✅ `personalizedAlertApi.js` - Personalized location-based alerts  
✅ `index.js` - Main export cho tất cả APIs  

### **2. React Hooks** (`src/hooks/`)
✅ `useEmailAlert.js` - Hook cho email operations  
✅ `useAIAlert.js` - Hook cho AI alert generation  
✅ `useFirebaseSensors.js` - Hook cho real-time sensors monitoring  
✅ `usePersonalizedAlert.js` - Hook cho personalized alerts  

### **3. Demo Components** (`src/components/`)
✅ `AIAlertDemo.js` + `.css` - Demo AI flood alert generator  
✅ `PersonalizedAlertDemo.js` + `.css` - Demo personalized location alerts  
✅ `FirebaseSensorsMonitor.js` + `.css` - Real-time IoT sensors dashboard  

### **4. Pages**
✅ `src/pages/APIDemo.js` + `.css` - Main demo page với tabs navigation  

### **5. Documentation**
✅ `INTEGRATION_GUIDE.md` - Chi tiết cách sử dụng  
✅ `API_INTEGRATION_README.md` - Quick reference guide  
✅ `.env.example` - Environment variables template  

---

## 🚀 Cách sử dụng nhanh

### **Start Backend & Frontend**

```bash
# Terminal 1: Start Backend
cd Backend
npm start
# Running on http://localhost:3001

# Terminal 2: Start Frontend
cd Hackathon-Project
npm run dev
# Running on http://localhost:3000
```

### **Truy cập Demo**

1. Thêm route trong `App.js`:
```javascript
import APIDemo from './pages/APIDemo';
<Route path="/api-demo" element={<APIDemo />} />
```

2. Truy cập: http://localhost:3000/api-demo

---

## 🎯 API Usage Examples

### **1. Sử dụng Hooks trong Components**

```javascript
import { useAIAlert } from './hooks/useAIAlert';

function MyComponent() {
  const { loading, alert, generateAlert } = useAIAlert();
  
  const handleClick = async () => {
    await generateAlert({
      current_percent: 85,
      previous_percent: 50,
      location: 'Cống ABC',
      to: 'user@example.com'
    });
  };
  
  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? 'Generating...' : 'Generate Alert'}
    </button>
  );
}
```

### **2. Import API trực tiếp**

```javascript
import { api } from './api';

// Email
await api.email.sendTestEmail('user@example.com');

// AI Alert
const result = await api.aiAlert.generateFloodAlert(data);

// Firebase Sensors
const sensors = await api.firebase.getAllSensors();

// Personalized Alerts
const alerts = await api.personalized.checkUserLocationsAndAlert(userId, 1, true);
```

---

## 📋 Tất cả API Endpoints

### **Email Services**
- `POST /api/send-test-email` - Gửi test email
- `POST /api/send-email` - Gửi custom email
- `POST /api/send-flood-alert` - Gửi flood alert với template
- `POST /api/send-weather-update` - Gửi weather update

### **AI Alert Services**
- `POST /api/generate-flood-alert` - Generate AI flood alert (Gemini 2.5 Flash)

### **Firebase Services**
- `GET /api/firebase/sensors` - Lấy tất cả sensors
- `GET /api/firebase/sensors/:sensorId` - Lấy 1 sensor cụ thể

### **Personalized Alert Services**
- `POST /api/check-user-locations-alert` - Check & send personalized alerts
- `GET /api/user-locations/:userId` - Get user's saved locations

---

## 🎨 Demo Components

### **1. AI Alert Demo**
- Input: mức ngập (%), vị trí, email
- AI tự động phân tích và tạo cảnh báo
- Preview subject và HTML body
- Gửi email (optional)

### **2. Personalized Alert Demo**
- Input: User ID
- Hiển thị danh sách locations
- Check flood risk cho từng location
- Generate AI alerts cho locations có risk
- Gửi email cá nhân hóa

### **3. Firebase Sensors Monitor**
- Real-time monitoring IoT sensors
- Auto-refresh mỗi N giây
- Highlight dangerous sensors
- Generate AI alert từ sensor data
- Display water level, GPS, status

---

## 🔧 Configuration

### **Environment Variables**

Tạo `.env` trong `Hackathon-Project/`:

```bash
REACT_APP_BACKEND_URL=http://localhost:3001
REACT_APP_OPENWEATHER_API_KEY=your_key_here
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_DATABASE_URL=...
```

### **API Base URL**

File: `src/api/config.js`
```javascript
export const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
```

---

## 🎓 Học cách sử dụng

### **Đọc docs:**
1. `INTEGRATION_GUIDE.md` - Chi tiết đầy đủ
2. `API_INTEGRATION_README.md` - Quick reference
3. `Backend/docs/PERSONALIZED_ALERT_API.md` - Backend API docs

### **Import Postman:**
```
Backend/Flood_Alert_API_Complete.postman_collection.json
```

### **Xem example code trong:**
- `src/components/AIAlertDemo.js`
- `src/components/PersonalizedAlertDemo.js`
- `src/components/FirebaseSensorsMonitor.js`

---

## 🐛 Troubleshooting

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| Network Error | Backend không chạy | `cd Backend && npm start` |
| CORS Error | CORS chưa enable | Check `Backend/src/index.js` có `cors()` |
| 503 Firebase | Firebase chưa config | Thêm `serviceAccountKey.json` |
| 404 Not Found | Endpoint sai | Check API_ENDPOINTS trong `config.js` |
| AI Error 404 | Model sai | Đảm bảo dùng `gemini-2.5-flash` |
| User Not Found | User không tồn tại | Tạo trong Firebase Console |

---

## 📊 Luồng xử lý API

### **AI Alert Flow:**
```
Client → useAIAlert Hook
    ↓
aiAlertApi.generateFloodAlert()
    ↓
POST /api/generate-flood-alert
    ↓
Backend: geminiClient.generateFloodAlert()
    ↓
Gemini AI: Generate alert (subject + htmlBody)
    ↓
Optional: Send email via nodemailer
    ↓
Return: { success, alert, emailResult }
```

### **Personalized Alert Flow:**
```
Client → usePersonalizedAlert Hook
    ↓
personalizedAlertApi.checkUserLocationsAndAlert()
    ↓
POST /api/check-user-locations-alert
    ↓
Backend: Get user from Firebase
    ↓
Get user's locations from Firebase
    ↓
For each location:
    - Find nearest flood-prone area
    - Get weather forecast
    - Analyze flood risk
    - Generate AI alert if risk >= minRiskLevel
    ↓
Send emails
    ↓
Save logs to Firebase
    ↓
Return: { analysis, alerts }
```

### **Firebase Sensors Flow:**
```
Client → useFirebaseSensors Hook
    ↓
firebaseApi.getAllSensors()
    ↓
GET /api/firebase/sensors
    ↓
Backend: firebaseClient.readData('iotData')
    ↓
Return: { SENSOR_ROAD, SENSOR_SEWER, water_level_status }
    ↓
Optional: Auto-refresh every N seconds
```

---

## 🎉 Tính năng đã hoàn thành

✅ **Email Services** - Gửi email với templates đẹp  
✅ **AI Alert Generation** - Gemini 2.5 Flash tạo cảnh báo thông minh  
✅ **Firebase Integration** - Theo dõi IoT sensors real-time  
✅ **Personalized Alerts** - Cảnh báo cá nhân hóa theo địa điểm  
✅ **React Hooks** - Custom hooks dễ sử dụng  
✅ **Demo Components** - UI đẹp, đầy đủ tính năng  
✅ **Error Handling** - Interceptors, retry logic  
✅ **Documentation** - Docs chi tiết, examples  

---

## 🚀 Next Steps

1. **Tích hợp vào App chính:**
   - Import components vào pages hiện có
   - Sử dụng hooks trong features

2. **Customize UI:**
   - Chỉnh sửa CSS theo design của bạn
   - Thay đổi colors, layouts

3. **Add Authentication:**
   - Integrate với Firebase Auth
   - Auto-detect current user ID

4. **Enhance Features:**
   - Add notifications
   - Add map integration
   - Add chart visualization

5. **Deploy:**
   - Deploy Backend lên Heroku/Railway
   - Deploy Frontend lên Vercel/Netlify
   - Update API_BASE_URL

---

## 📞 Support

Nếu cần hỗ trợ:
1. Check console logs (F12)
2. Check Network tab (F12)
3. Đọc error messages
4. Xem docs trong `INTEGRATION_GUIDE.md`
5. Check Postman collection

---

**🎉 Chúc mừng! Frontend đã tích hợp đầy đủ với Backend API!**

**Happy Coding! 🚀**

