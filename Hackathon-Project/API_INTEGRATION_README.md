# 🌊 Flood Alert System - API Integration

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ installed
- Backend running on `http://localhost:3001`
- Frontend running on `http://localhost:3000`

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables
cp .env.example .env
# Edit .env and add your API keys

# 3. Start the application
npm run dev
```

---

## 📦 Package Structure

```
Hackathon-Project/
├── src/
│   ├── api/                      # API clients & services
│   │   ├── config.js             # API configuration
│   │   ├── client.js             # Axios instance
│   │   ├── emailApi.js           # Email APIs
│   │   ├── aiAlertApi.js         # AI alert APIs
│   │   ├── firebaseApi.js        # Firebase APIs
│   │   ├── personalizedAlertApi.js # Personalized alerts
│   │   └── index.js              # Main export
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useEmailAlert.js
│   │   ├── useAIAlert.js
│   │   ├── useFirebaseSensors.js
│   │   └── usePersonalizedAlert.js
│   │
│   ├── components/               # Demo components
│   │   ├── AIAlertDemo.js
│   │   ├── PersonalizedAlertDemo.js
│   │   └── FirebaseSensorsMonitor.js
│   │
│   └── pages/
│       └── APIDemo.js            # Main demo page
│
├── .env.example                  # Environment variables template
├── API_INTEGRATION_README.md     # This file
└── INTEGRATION_GUIDE.md          # Detailed guide
```

---

## 🎯 Features

### 1. **AI-Generated Flood Alerts** 🤖
Generate intelligent flood alerts using Gemini 2.5 Flash AI

```javascript
import { useAIAlert } from './hooks/useAIAlert';

const { generateAlert } = useAIAlert();

await generateAlert({
  current_percent: 85,
  previous_percent: 50,
  location: 'Cống Phan Đình Phùng',
  to: 'user@example.com'
});
```

### 2. **Personalized Location Alerts** 🎯
Check flood risks for user's saved locations

```javascript
import { usePersonalizedAlert } from './hooks/usePersonalizedAlert';

const { checkLocationsAndAlert } = usePersonalizedAlert(userId);

await checkLocationsAndAlert(1, true); // minRiskLevel=1, sendEmail=true
```

### 3. **Real-time Firebase Sensors** 🌊
Monitor IoT sensors in real-time

```javascript
import { useFirebaseSensors } from './hooks/useFirebaseSensors';

const { sensors, dangerousSensors } = useFirebaseSensors(
  true,  // autoRefresh
  5000   // interval: 5 seconds
);
```

---

## 📖 API Reference

### **Email APIs**

#### Send Test Email
```javascript
import { api } from './api';

await api.email.sendTestEmail('user@example.com');
```

#### Send Flood Alert
```javascript
await api.email.sendFloodAlert('user@example.com', {
  district: 'Hải Châu',
  level: 'Cao',
  rainfall: '120mm',
  time: new Date().toLocaleString('vi-VN')
});
```

#### Send Weather Update
```javascript
await api.email.sendWeatherUpdate('user@example.com', {
  location: 'Đà Nẵng',
  temperature: '28°C',
  humidity: '85%',
  rainChance: '70%',
  windSpeed: '15km/h'
});
```

---

### **AI Alert APIs**

#### Generate AI Flood Alert
```javascript
import { api } from './api';

const result = await api.aiAlert.generateFloodAlert({
  current_percent: 85,
  previous_percent: 50,
  location: 'Cống ABC',
  timestamp: new Date().toISOString(),
  to: 'user@example.com' // optional
});

console.log(result.alert.subject);
console.log(result.alert.htmlBody);
```

#### Generate from Sensor Data
```javascript
const sensorData = {
  device_id: 'SENSOR_ROAD',
  water_level_cm: 45,
  flood_status: 'DANGER',
  timestamp: Date.now() / 1000
};

const result = await api.aiAlert.generateAlertFromSensor(
  sensorData,
  'user@example.com'
);
```

---

### **Firebase APIs**

#### Get All Sensors
```javascript
import { api } from './api';

const result = await api.firebase.getAllSensors();
// result.data = { SENSOR_ROAD, SENSOR_SEWER, water_level_status }
```

#### Get Single Sensor
```javascript
const result = await api.firebase.getSensorById('SENSOR_ROAD');
// result.data = { device_id, flood_status, water_level_cm, ... }
```

#### Watch Sensors (Real-time)
```javascript
import { firebaseApi } from './api';

const cleanup = firebaseApi.watchAllSensors((data) => {
  console.log('Sensors updated:', data);
}, 5000);

// Stop watching
cleanup();
```

---

### **Personalized Alert APIs**

#### Get User Locations
```javascript
import { api } from './api';

const result = await api.personalized.getUserLocations(userId);
// result.locations = [{ id, name, address, latitude, longitude, ... }]
```

#### Check Locations & Send Alerts
```javascript
const result = await api.personalized.checkUserLocationsAndAlert(
  userId,
  1,    // minRiskLevel: 0=all, 1=warning+, 2=danger+, 3=critical only
  true  // sendEmail
);

console.log(`${result.analysis.affectedLocations} locations at risk`);
result.alerts.forEach(alert => {
  console.log(alert.locationName, alert.floodRisk);
});
```

#### Get Location Statistics
```javascript
const stats = await api.personalized.getUserLocationStats(userId);
// stats = { total, active, inactive, inDanger, locations }
```

---

## 🎨 Using Demo Components

### Add Demo Page to Your App

**1. Import the demo page:**
```javascript
// App.js
import APIDemo from './pages/APIDemo';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/api-demo" element={<APIDemo />} />
      </Routes>
    </BrowserRouter>
  );
}
```

**2. Or use individual components:**
```javascript
import AIAlertDemo from './components/AIAlertDemo';
import PersonalizedAlertDemo from './components/PersonalizedAlertDemo';
import FirebaseSensorsMonitor from './components/FirebaseSensorsMonitor';

function MyPage() {
  return (
    <div>
      <AIAlertDemo />
      <PersonalizedAlertDemo currentUserId="user123" />
      <FirebaseSensorsMonitor />
    </div>
  );
}
```

---

## ⚙️ Configuration

### Environment Variables

Create `.env` file:
```bash
# Backend API
REACT_APP_BACKEND_URL=http://localhost:3001

# OpenWeather (optional, backend handles this)
REACT_APP_OPENWEATHER_API_KEY=your_key_here

# Firebase (if using client-side Firebase)
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_DATABASE_URL=...
```

### Change Backend URL

Edit `src/api/config.js`:
```javascript
export const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
```

---

## 🧪 Testing

### Test APIs with Postman

Import collection:
```
Backend/Flood_Alert_API_Complete.postman_collection.json
```

### Test in Browser Console

```javascript
// Open DevTools Console (F12)

// Test email
await api.email.sendTestEmail('your-email@gmail.com');

// Test AI alert
const result = await api.aiAlert.generateFloodAlert({
  current_percent: 85,
  previous_percent: 50,
  location: 'Test Location'
});
console.log(result);

// Test Firebase
const sensors = await api.firebase.getAllSensors();
console.log(sensors);
```

---

## 🐛 Common Issues

### 1. **"Network Error" or "ERR_CONNECTION_REFUSED"**

**Problem:** Backend is not running

**Solution:**
```bash
cd Backend
npm start
# Make sure it's running on http://localhost:3001
```

### 2. **CORS Error**

**Problem:** Cross-origin request blocked

**Solution:** Backend should have CORS enabled. Check `Backend/src/index.js`:
```javascript
const cors = require('cors');
app.use(cors());
```

### 3. **"Firebase chưa được cấu hình"**

**Problem:** Firebase not initialized in backend

**Solution:**
- Add `serviceAccountKey.json` to `Backend/configs/`
- Set `.env` variables in Backend

### 4. **"Không tìm thấy user"**

**Problem:** User doesn't exist in Firebase

**Solution:**
- Create user in Firebase Console
- Path: `userProfiles/{userId}`
- Add locations: `userProfiles/{userId}/locations/{locationId}`

### 5. **AI Alert Generation Fails**

**Problem:** Invalid Gemini API key or model

**Solution:**
- Check `GEMINI_API_KEY` in Backend `.env`
- Ensure using `gemini-2.5-flash` model

---

## 📚 Documentation

- **Integration Guide:** [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
- **Backend API Docs:** `Backend/docs/PERSONALIZED_ALERT_API.md`
- **Postman Collection:** `Backend/Flood_Alert_API_Complete.postman_collection.json`
- **Quick Start:** `Backend/QUICK_START_PERSONALIZED_ALERTS.md`

---

## 🎓 Examples

### Example 1: Build a Simple Alert Page

```javascript
import React, { useState } from 'react';
import { usePersonalizedAlert } from './hooks/usePersonalizedAlert';

function AlertPage() {
  const [userId, setUserId] = useState('');
  const { locations, alerts, checkLocationsAndAlert } = usePersonalizedAlert(userId);

  return (
    <div>
      <h1>Flood Alerts</h1>
      <input
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        placeholder="Enter User ID"
      />
      <button onClick={() => checkLocationsAndAlert(1, false)}>
        Check Alerts
      </button>
      
      <h2>Your Locations ({locations.length})</h2>
      {locations.map(loc => (
        <div key={loc.id}>
          {loc.name} - {loc.address}
        </div>
      ))}
      
      <h2>Alerts ({alerts.length})</h2>
      {alerts.map((alert, i) => (
        <div key={i}>
          <strong>{alert.locationName}</strong>
          <p dangerouslySetInnerHTML={{ __html: alert.alert.htmlBody }} />
        </div>
      ))}
    </div>
  );
}
```

### Example 2: Real-time Sensor Dashboard

```javascript
import React, { useEffect, useState } from 'react';
import { useFirebaseSensors } from './hooks/useFirebaseSensors';

function SensorDashboard() {
  const { sensors, dangerousSensors, lastUpdate } = useFirebaseSensors(true, 5000);

  return (
    <div>
      <h1>Sensor Dashboard</h1>
      <p>Last update: {lastUpdate?.toLocaleTimeString()}</p>
      
      {dangerousSensors.length > 0 && (
        <div style={{ color: 'red' }}>
          ⚠️ {dangerousSensors.length} sensors in DANGER!
        </div>
      )}
      
      {sensors?.SENSOR_ROAD && (
        <div>
          <h2>Road Sensor</h2>
          <p>Status: {sensors.SENSOR_ROAD.flood_status}</p>
          <p>Water Level: {sensors.SENSOR_ROAD.water_level_cm} cm</p>
        </div>
      )}
      
      {sensors?.SENSOR_SEWER && (
        <div>
          <h2>Sewer Sensor</h2>
          <p>Status: {sensors.SENSOR_SEWER.flood_status}</p>
          <p>Water Level: {sensors.SENSOR_SEWER.water_level_cm} cm</p>
        </div>
      )}
    </div>
  );
}
```

---

## 🤝 Support

Nếu gặp vấn đề:
1. Check console logs (F12 → Console)
2. Check network requests (F12 → Network)
3. Verify backend is running
4. Check environment variables
5. Read error messages carefully

---

## 📝 License

MIT License - See Backend for details

---

**Made with ❤️ for Hackathon Project - Flood Alert System**

