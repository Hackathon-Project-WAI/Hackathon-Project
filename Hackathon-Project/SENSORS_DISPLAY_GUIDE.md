# 📊 Hướng dẫn: Hiển thị dữ liệu Sensors trên Web

## 🎯 Tổng quan

Tính năng hiển thị **real-time** dữ liệu từ 2 sensors Firebase:
- 🛣️ **SENSOR_ROAD** - Cảm biến đường
- 🚰 **SENSOR_SEWER** - Cảm biến cống

---

## ✨ Tính năng

✅ **Hiển thị real-time:**
- Mực nước (cm và %)
- Trạng thái ngập (SAFE, WARNING, DANGER, CRITICAL)
- Vị trí GPS (latitude, longitude)
- Thời gian cập nhật

✅ **Auto refresh:**
- Tự động cập nhật mỗi 5 giây
- Có thể bật/tắt auto refresh
- Nút làm mới thủ công

✅ **UI hiện đại:**
- Progress bar hiển thị mực nước
- Màu sắc theo mức độ nguy hiểm
- Animation mượt mà
- Responsive design

✅ **Thống kê tổng quan:**
- Tổng số sensors
- Số sensors cảnh báo
- Số sensors nguy hiểm

---

## 🏗️ Kiến trúc

```
┌─────────────────────────────────────────────────────┐
│               FIREBASE REALTIME DB                   │
│                  iotData/                            │
│                     ├── SENSOR_ROAD                  │
│                     └── SENSOR_SEWER                 │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│                  BACKEND API                         │
│         GET /api/firebase/sensors                    │
│         → firebaseController.getAllSensors()         │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│                  FRONTEND                            │
│         /sensors → SensorsPage                       │
│                ↓                                     │
│         SensorsDashboard Component                   │
│         - useEffect → fetch mỗi 5s                   │
│         - firebaseApi.getAllSensors()                │
└─────────────────────────────────────────────────────┘
```

---

## 📂 Cấu trúc Files

### **Backend (Đã có sẵn):**
```
Backend/
├── src/
│   ├── controllers/
│   │   └── firebaseController.js    ✅ Đã có sẵn
│   ├── routes/
│   │   └── firebaseRoutes.js        ✅ Đã có sẵn
│   └── integrations/
│       └── firebaseClient.js        ✅ Đã có sẵn
```

### **Frontend (Mới tạo):**
```
Hackathon-Project/
├── src/
│   ├── components/
│   │   ├── SensorsDashboard.js       ✨ NEW - Component chính
│   │   ├── SensorsDashboard.css      ✨ NEW - Styles
│   │   └── TopNavigation.js          🔧 UPDATED - Thêm tab Sensors
│   ├── pages/
│   │   ├── SensorsPage.js            ✨ NEW - Page wrapper
│   │   └── SensorsPage.css           ✨ NEW - Page styles
│   ├── api/
│   │   └── firebaseApi.js            ✅ Đã có sẵn
│   └── App.js                        🔧 UPDATED - Thêm route /sensors
```

---

## 🚀 Cách sử dụng

### **1. Truy cập trang Sensors**

Có 3 cách:
1. **Navigation bar** → Click tab "📊 Sensors"
2. **URL** → Truy cập trực tiếp: `http://localhost:3000/sensors`
3. **Link** → Từ bất kỳ đâu trong app

### **2. Xem dữ liệu real-time**

Dashboard tự động:
- Load dữ liệu khi vào trang
- Refresh mỗi 5 giây (nếu bật auto refresh)
- Hiển thị status màu sắc theo mức độ

### **3. Điều khiển**

- **Toggle Auto Refresh:** Bật/tắt tự động cập nhật
- **Nút Làm mới:** Cập nhật thủ công bất cứ lúc nào

---

## 🎨 UI/UX

### **Màu sắc theo trạng thái:**
- 🟢 **SAFE** → Xanh lá (#4caf50)
- 🟡 **WARNING** → Cam (#ff9800)
- 🔴 **DANGER** → Đỏ (#f44336)
- ⚫ **CRITICAL** → Đỏ đậm (#b71c1c)

### **Layout:**
```
┌─────────────────────────────────────────────┐
│  📊 Giám sát Sensors   | [Auto] [Làm mới]  │
├─────────────────────────────────────────────┤
│  🛣️ SENSOR_ROAD     |  🚰 SENSOR_SEWER    │
│  ┌─────────────────┐ | ┌─────────────────┐│
│  │ WARNING         │ | │ SAFE            ││
│  │ 💧 14 cm (14%)  │ | │ 💧 34 cm (34%)  ││
│  │ [Progress Bar]  │ | │ [Progress Bar]  ││
│  │ 📍 16.01, 108.24│ | │ 📍 16.02, 108.25││
│  │ ⏰ 20:30:00     │ | │ ⏰ 20:30:05     ││
│  └─────────────────┘ | └─────────────────┘│
├─────────────────────────────────────────────┤
│  🔢 2 Sensors | ⚠️ 1 Cảnh báo | 🚨 0 Nguy hiểm │
└─────────────────────────────────────────────┘
```

---

## 🔧 Configuration

### **Backend API Endpoint:**
```javascript
GET http://localhost:3000/api/firebase/sensors

Response:
{
  "success": true,
  "data": {
    "SENSOR_ROAD": {
      "device_id": "SENSOR_ROAD",
      "flood_status": "WARNING",
      "latitude": 16.0125,
      "longitude": 108.2442,
      "timestamp": "1763660322000",
      "water_level_cm": 14
    },
    "SENSOR_SEWER": {
      "device_id": "SENSOR_SEWER",
      "flood_status": "SAFE",
      "latitude": 16.0543,
      "longitude": 108.2021,
      "timestamp": "1763660314000",
      "water_level_cm": 34
    }
  }
}
```

### **Auto Refresh Interval:**
```javascript
// Trong SensorsDashboard.js
const REFRESH_INTERVAL = 5000; // 5 giây

// Có thể thay đổi:
// 3000  → 3 giây (nhanh hơn)
// 10000 → 10 giây (chậm hơn)
```

---

## 💻 Code Examples

### **Sử dụng Component trực tiếp:**
```jsx
import SensorsDashboard from './components/SensorsDashboard';

function MyPage() {
  return (
    <div>
      <h1>My Custom Page</h1>
      <SensorsDashboard />
    </div>
  );
}
```

### **Fetch dữ liệu thủ công:**
```javascript
import { firebaseApi } from './api';

// Lấy tất cả sensors
const sensors = await firebaseApi.getAllSensors();
console.log(sensors.data.SENSOR_ROAD);

// Lấy 1 sensor cụ thể
const roadSensor = await firebaseApi.getSensorById('SENSOR_ROAD');
console.log(roadSensor.data);
```

### **Watch sensors realtime:**
```javascript
import { firebaseApi } from './api';

// Watch với callback
const cleanup = firebaseApi.watchAllSensors((data) => {
  console.log('Sensors updated:', data);
}, 5000);

// Dừng watching khi component unmount
return cleanup;
```

---

## 📊 Firebase Data Structure

```json
iotData/
  SENSOR_ROAD/
    device_id: "SENSOR_ROAD"
    flood_status: "WARNING" | "SAFE" | "DANGER" | "CRITICAL"
    latitude: 16.0125
    longitude: 108.2442
    timestamp: "1763660322000"
    water_level_cm: 14
  
  SENSOR_SEWER/
    device_id: "SENSOR_SEWER"
    flood_status: "SAFE"
    latitude: 16.0543
    longitude: 108.2021
    timestamp: "1763660314000"
    water_level_cm: 34
```

---

## 🎯 Use Cases

### **1. Giám sát real-time**
```
Nhân viên giám sát → Mở /sensors
                   → Để tab mở
                   → Tự động update mỗi 5s
                   → Nhận thông tin ngay lập tức
```

### **2. Kiểm tra nhanh**
```
User → Click "Sensors" tab
     → Xem trạng thái hiện tại
     → Quay lại bản đồ/thời tiết
```

### **3. Dashboard display**
```
Hiển thị trên màn hình lớn
→ /sensors fullscreen
→ Auto refresh ON
→ Giám sát liên tục
```

---

## 🐛 Troubleshooting

### **1. Không hiển thị dữ liệu**
- ✅ Kiểm tra Backend có chạy không (`http://localhost:3000`)
- ✅ Kiểm tra Firebase đã config chưa (`.env` file)
- ✅ Test API: `curl http://localhost:3000/api/firebase/sensors`
- ✅ Xem Console log trong browser (F12)

### **2. Auto refresh không hoạt động**
- ✅ Kiểm tra toggle button có màu xanh không
- ✅ Xem Console có lỗi không
- ✅ Refresh page thử lại

### **3. Hiển thị "Loading..." mãi**
- ✅ Backend API có phản hồi không
- ✅ Kiểm tra CORS settings
- ✅ Xem Network tab trong DevTools

### **4. Màu sắc không đúng**
- ✅ Kiểm tra `flood_status` trong Firebase
- ✅ Phải là: SAFE, WARNING, DANGER, hoặc CRITICAL
- ✅ Case-sensitive

---

## 📱 Responsive Design

- **Desktop (>768px):** 2 cột, hiển thị song song
- **Mobile (<768px):** 1 cột, xếp dọc
- **Tablet (768px-1024px):** Auto adjust

---

## 🎨 Customization

### **Thay đổi màu sắc:**
```css
/* SensorsDashboard.css */
.progress-fill {
  background: #your-color;
}

.sensor-status {
  background-color: #your-bg;
  color: #your-text;
}
```

### **Thay đổi interval:**
```javascript
// SensorsDashboard.js
const interval = setInterval(fetchSensors, 10000); // 10 giây
```

### **Thêm sensors mới:**
```javascript
// Chỉ cần thêm vào Firebase với format tương tự
// Component tự động hiển thị
```

---

## 🚀 Next Steps

- [ ] Thêm charts/graphs cho lịch sử dữ liệu
- [ ] Export data to CSV
- [ ] Cảnh báo popup khi vượt ngưỡng
- [ ] So sánh giữa nhiều sensors
- [ ] Dark mode

---

## 📚 Tài liệu liên quan

- [Backend API Documentation](../Backend/docs/AUTO_ALERT_GUIDE.md)
- [Firebase API Guide](./API_INTEGRATION_README.md)
- [Component Library](./DESIGN_SYSTEM_GUIDE.md)

---

**🎉 Hoàn thành! Giờ bạn có thể xem dữ liệu sensors real-time trên web!**

**Truy cập:** `http://localhost:3000/sensors`


