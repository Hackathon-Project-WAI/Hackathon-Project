# 🌊 Backend API Integration - React Frontend

## ⚡ TL;DR

**Đã tích hợp đầy đủ tất cả Backend APIs vào React Frontend!**

```bash
# Start Backend
cd Backend && npm start

# Start Frontend  
cd Hackathon-Project && npm run dev

# Visit demo
http://localhost:3000/api-demo
```

---

## 📦 Đã tạo gì?

### **API Layer** (`src/api/`)
- `emailApi.js` - Email services
- `aiAlertApi.js` - AI alerts (Gemini 2.5 Flash)
- `firebaseApi.js` - Firebase IoT sensors
- `personalizedAlertApi.js` - Location-based alerts

### **React Hooks** (`src/hooks/`)
- `useEmailAlert()` - Send emails
- `useAIAlert()` - Generate AI alerts
- `useFirebaseSensors()` - Monitor sensors
- `usePersonalizedAlert()` - Check user locations

### **Demo Components** (`src/components/`)
- `<AIAlertDemo />` - AI flood alert generator
- `<PersonalizedAlertDemo />` - Location alerts
- `<FirebaseSensorsMonitor />` - Real-time sensors

---

## 🚀 Cách dùng

### **Option 1: Dùng Hooks (Recommended)**

```javascript
import { useAIAlert } from './hooks/useAIAlert';

function MyComponent() {
  const { alert, generateAlert } = useAIAlert();
  
  const handleGenerate = async () => {
    await generateAlert({
      current_percent: 85,
      previous_percent: 50,
      location: 'Cống ABC',
      to: 'user@example.com'
    });
  };
  
  return (
    <div>
      <button onClick={handleGenerate}>Generate Alert</button>
      {alert && <div>{alert.subject}</div>}
    </div>
  );
}
```

### **Option 2: Gọi API trực tiếp**

```javascript
import { api } from './api';

// Email
await api.email.sendTestEmail('user@example.com');

// AI Alert
const result = await api.aiAlert.generateFloodAlert(data);

// Firebase
const sensors = await api.firebase.getAllSensors();

// Personalized
const alerts = await api.personalized.checkUserLocationsAndAlert(userId, 1, true);
```

### **Option 3: Dùng Demo Components**

```javascript
import APIDemo from './pages/APIDemo';
<Route path="/api-demo" element={<APIDemo />} />
```

---

## 📋 Tất cả APIs

| Category | API | Method |
|----------|-----|--------|
| **Email** | Send test email | `POST /api/send-test-email` |
| | Send custom email | `POST /api/send-email` |
| | Send flood alert | `POST /api/send-flood-alert` |
| | Send weather update | `POST /api/send-weather-update` |
| **AI** | Generate AI alert | `POST /api/generate-flood-alert` |
| **Firebase** | Get all sensors | `GET /api/firebase/sensors` |
| | Get sensor by ID | `GET /api/firebase/sensors/:id` |
| **Personalized** | Check locations | `POST /api/check-user-locations-alert` |
| | Get user locations | `GET /api/user-locations/:userId` |

**Total:** 9 endpoints, 16+ methods

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| `INTEGRATION_GUIDE.md` | Chi tiết đầy đủ |
| `API_INTEGRATION_README.md` | Quick reference |
| `BACKEND_API_SUMMARY.md` | API summary |
| `QUICK_TEST.md` | Testing guide |

---

## ✅ Features

✅ AI-powered flood alerts (Gemini 2.5 Flash)  
✅ Email notifications (Nodemailer)  
✅ Real-time Firebase monitoring  
✅ Personalized location alerts  
✅ Weather forecast integration  
✅ Custom React hooks  
✅ Demo components với UI đẹp  
✅ Full documentation  

---

## 🐛 Troubleshooting

| Error | Fix |
|-------|-----|
| Network Error | `cd Backend && npm start` |
| CORS Error | Backend có `app.use(cors())` |
| 503 Firebase | Add `serviceAccountKey.json` |
| 404 AI Model | Use `gemini-2.5-flash` |

---

## 🎯 Quick Examples

**Generate AI Alert:**
```javascript
const { generateAlert } = useAIAlert();
await generateAlert({ current_percent: 85, location: 'ABC' });
```

**Monitor Sensors:**
```javascript
const { sensors } = useFirebaseSensors(true, 5000); // auto-refresh
```

**Check User Locations:**
```javascript
const { checkLocationsAndAlert } = usePersonalizedAlert(userId);
await checkLocationsAndAlert(1, true); // minRisk=1, sendEmail=true
```

---

## 📊 Stats

- **Files created:** 20+ files
- **Lines of code:** ~4500 lines
- **APIs integrated:** 9 endpoints
- **Custom hooks:** 4 hooks
- **Demo components:** 3 components
- **Documentation:** 2000+ lines

---

## 🎉 Ready to use!

Tất cả đã sẵn sàng. Chỉ cần:
1. Start backend
2. Start frontend
3. Import hooks/components
4. Code! 🚀

**Full docs:** See other markdown files in this directory.

---

**Made with ❤️ for Hackathon Flood Alert System**

