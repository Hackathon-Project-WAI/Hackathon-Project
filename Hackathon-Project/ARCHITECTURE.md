# 🏗️ System Architecture - Frontend-Backend Integration

## 📊 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACE                           │
│                   (React Frontend)                           │
│                  http://localhost:3000                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/HTTPS
                            │ (Axios)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API SERVER                        │
│                  (Node.js + Express)                         │
│                  http://localhost:3001                       │
│                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Controllers │  │   Services   │  │ Integrations │       │
│  └─────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
         │                  │                    │
         │                  │                    │
         ▼                  ▼                    ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
│   Firebase   │  │ OpenWeather  │  │   Gemini AI      │
│   Realtime   │  │     API      │  │ (2.5 Flash)      │
│   Database   │  └──────────────┘  └──────────────────┘
└──────────────┘
        │
        ▼
┌──────────────┐
│ IoT Sensors  │
│ (SENSOR_*)   │
└──────────────┘
```

---

## 🔄 Data Flow Diagram

### **Flow 1: AI Alert Generation**

```
┌─────────────┐
│    User     │
│  (Browser)  │
└──────┬──────┘
       │ 1. Click "Generate Alert"
       │
       ▼
┌─────────────────────┐
│  <AIAlertDemo />    │
│   Component         │
└──────┬──────────────┘
       │ 2. Call hook
       │
       ▼
┌─────────────────────┐
│  useAIAlert()       │
│   Hook              │
└──────┬──────────────┘
       │ 3. generateAlert()
       │
       ▼
┌─────────────────────┐
│  aiAlertApi.js      │
│  generateFloodAlert │
└──────┬──────────────┘
       │ 4. POST request
       │
       ▼
┌─────────────────────────────────┐
│  Backend API                    │
│  /api/generate-flood-alert      │
└──────┬──────────────────────────┘
       │ 5. Process request
       │
       ▼
┌─────────────────────┐
│  alertController    │
│  generateFloodAlert │
└──────┬──────────────┘
       │ 6. Call Gemini
       │
       ▼
┌─────────────────────┐
│  geminiClient       │
│  Gemini AI API      │
└──────┬──────────────┘
       │ 7. Generate alert
       │
       ▼
┌─────────────────────┐
│  AI Response        │
│  { subject, html }  │
└──────┬──────────────┘
       │ 8. Return to Frontend
       │
       ▼
┌─────────────────────┐
│  Display in UI      │
│  Show alert         │
└─────────────────────┘
```

---

### **Flow 2: Personalized Location Alert**

```
User (userId) → Frontend Component
                      ↓
                usePersonalizedAlert()
                      ↓
                checkLocationsAndAlert()
                      ↓
        POST /api/check-user-locations-alert
                      ↓
                Backend Server
                      ↓
        ┌─────────────┴─────────────┐
        ▼                           ▼
  Get User Info              Get Locations
  (Firebase)                 (Firebase)
        │                           │
        └─────────────┬─────────────┘
                      ▼
              For Each Location:
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
  Find Nearest   Get Weather   Analyze Risk
    Area          Forecast      (ML Model)
        │             │             │
        └─────────────┼─────────────┘
                      ▼
              Risk >= minRiskLevel?
                      │
                  YES │ NO → Skip
                      ▼
            Generate AI Alert
            (Gemini 2.5 Flash)
                      ↓
            Send Email (Nodemailer)
                      ↓
            Save Log (Firebase)
                      ↓
            Update Status (Firebase)
                      ↓
        Return Analysis + Alerts
                      ↓
            Display in Frontend
```

---

### **Flow 3: Real-time Firebase Sensors**

```
IoT Sensors → Firebase Realtime Database
                      ↓
                  iotData/
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   SENSOR_ROAD  SENSOR_SEWER  water_level_status
        │             │             │
        └─────────────┼─────────────┘
                      ▼
        Backend: GET /api/firebase/sensors
                      ↓
        Frontend: useFirebaseSensors()
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   Initial Fetch  Auto Refresh  Display Data
                      │
                      ▼
            <FirebaseSensorsMonitor />
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
  Show Status   Highlight      Generate
   (SAFE/       Dangerous      AI Alert
   DANGER)       Sensors       (Optional)
```

---

## 🏛️ Frontend Architecture

```
src/
├── api/                          # API Integration Layer
│   ├── config.js                 # Base URL, endpoints
│   ├── client.js                 # Axios instance
│   ├── emailApi.js               # Email endpoints
│   ├── aiAlertApi.js             # AI alert endpoints
│   ├── firebaseApi.js            # Firebase endpoints
│   ├── personalizedAlertApi.js   # Personalized endpoints
│   └── index.js                  # Main export
│
├── hooks/                        # Custom React Hooks
│   ├── useEmailAlert.js          # Email hook
│   ├── useAIAlert.js             # AI alert hook
│   ├── useFirebaseSensors.js     # Firebase hook
│   └── usePersonalizedAlert.js   # Personalized hook
│
├── components/                   # Demo Components
│   ├── AIAlertDemo.js            # AI alert demo
│   ├── PersonalizedAlertDemo.js  # Personalized demo
│   └── FirebaseSensorsMonitor.js # Sensors demo
│
└── pages/
    └── APIDemo.js                # Main demo page
```

---

## 🗂️ Backend Architecture (MVC)

```
Backend/
├── src/
│   ├── index.js                  # Main entry point
│   │
│   ├── configs/                  # Configuration
│   │   ├── index.js              # Env validation
│   │   └── serviceAccountKey.json
│   │
│   ├── routes/                   # Routes layer
│   │   ├── index.js
│   │   ├── alertRoutes.js
│   │   └── firebaseRoutes.js
│   │
│   ├── controllers/              # Controllers layer
│   │   ├── alertController.js
│   │   ├── firebaseController.js
│   │   └── personalizedAlertController.js
│   │
│   ├── services/                 # Services layer
│   │   ├── weatherService.js
│   │   ├── floodPredictionService.js
│   │   └── personalizedAlertService.js
│   │
│   └── integrations/             # External APIs
│       ├── geminiClient.js
│       ├── firebaseClient.js
│       └── emailService.js
│
└── .env                          # Environment vars
```

---

## 📡 API Request/Response Flow

### **Request Flow:**

```
Frontend Component
      ↓
React Hook (useState, useCallback)
      ↓
API Service (emailApi, aiAlertApi, etc.)
      ↓
Axios Client (interceptors)
      ↓
HTTP Request (POST/GET)
      ↓
Backend Express Server
      ↓
Middleware (CORS, JSON parser, Logger)
      ↓
Router (alertRoutes, firebaseRoutes)
      ↓
Controller (validate, process)
      ↓
Service (business logic)
      ↓
Integration (external APIs)
      ↓
Return Response
```

### **Response Flow:**

```
External API (Firebase, Gemini, etc.)
      ↓
Service (process data)
      ↓
Controller (format response)
      ↓
Express Router
      ↓
HTTP Response (JSON)
      ↓
Axios Client (interceptor)
      ↓
API Service (parse)
      ↓
React Hook (setState)
      ↓
Component Re-render
      ↓
UI Update
```

---

## 🔌 Integration Points

### **1. Frontend → Backend**
- Protocol: HTTP/HTTPS
- Format: JSON
- Library: Axios
- Base URL: `http://localhost:3001`

### **2. Backend → Firebase**
- SDK: Firebase Admin SDK
- Database: Realtime Database
- Paths: `iotData/`, `userProfiles/`

### **3. Backend → Gemini AI**
- API: Google Generative AI
- Model: `gemini-2.5-flash`
- Temperature: 0.7
- Retry: 3 attempts

### **4. Backend → OpenWeather**
- API: OpenWeatherMap 2.5
- Endpoints: `/weather`, `/forecast`
- Interval: 3-hour data

### **5. Backend → Email (SMTP)**
- Service: Nodemailer
- SMTP: Gmail
- Port: 465 (SSL)

---

## 🔐 Security Architecture

```
┌─────────────────────────────────────┐
│     Environment Variables           │
│  (.env, .env.local - gitignored)    │
│                                     │
│  • GEMINI_API_KEY                   │
│  • OPENWEATHER_API_KEY              │
│  • FIREBASE_SERVICE_ACCOUNT_KEY     │
│  • EMAIL_USER, EMAIL_PASS           │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│      Backend API Server             │
│  (Server-side only, not exposed)    │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│     External Services               │
│  • Firebase (Admin SDK)             │
│  • Gemini AI                        │
│  • OpenWeather                      │
│  • Gmail SMTP                       │
└─────────────────────────────────────┘
```

**Security Best Practices:**
✅ No API keys in frontend
✅ All sensitive operations in backend
✅ Environment variables for secrets
✅ CORS enabled for allowed origins
✅ Input validation
✅ Error messages don't expose internals

---

## ⚡ Performance Optimization

### **Frontend:**
- `useCallback` - Memoize functions
- `useMemo` - Memoize values
- Conditional `useEffect` - Only run when needed
- Debounced API calls
- Loading states

### **Backend:**
- Connection pooling (Firebase)
- Retry logic với exponential backoff
- Error handling không block
- Async/await for I/O operations

### **Caching (Future):**
- React Query for data caching
- LocalStorage for user preferences
- Session storage for temporary data

---

## 📈 Scalability Considerations

### **Current Architecture:**
- ✅ Modular design
- ✅ Separation of concerns
- ✅ Easy to add new APIs
- ✅ Easy to add new components

### **Future Scaling:**
- [ ] Load balancer for Backend
- [ ] Redis for caching
- [ ] Websockets for real-time
- [ ] Message queue (RabbitMQ)
- [ ] Microservices architecture
- [ ] CDN for static assets

---

## 🧪 Testing Strategy

### **Unit Tests (Future):**
```
Frontend:
  - API clients (mock axios)
  - Hooks (React Testing Library)
  - Components (Jest + RTL)

Backend:
  - Services (Jest)
  - Controllers (Supertest)
  - Integration tests
```

### **E2E Tests (Future):**
```
- Playwright / Cypress
- Test complete user flows
- Test API integrations
```

---

## 📊 Monitoring & Logging

### **Current Logging:**
```javascript
// Frontend
console.log('🚀 API Request:', method, url);
console.log('✅ API Response:', data);
console.error('❌ API Error:', error);

// Backend
console.log('[METHOD] /api/path');
console.log('✅ User locations found:', count);
console.error('❌ Error:', error.message);
```

### **Future Monitoring:**
- [ ] Sentry for error tracking
- [ ] Google Analytics for usage
- [ ] LogRocket for session replay
- [ ] Custom logging service

---

## 🚀 Deployment Architecture

### **Development:**
```
Backend:  http://localhost:3001
Frontend: http://localhost:3000
```

### **Production (Future):**
```
Backend:  https://api.floodalert.com
Frontend: https://floodalert.com

CDN: CloudFlare
Hosting: 
  - Backend: Heroku / Railway / AWS
  - Frontend: Vercel / Netlify
  - Database: Firebase (managed)
```

---

## 📝 Summary

**Architecture Type:** Client-Server (3-tier)
- **Presentation Layer:** React Frontend
- **Application Layer:** Node.js Backend (API)
- **Data Layer:** Firebase, External APIs

**Communication:** RESTful APIs (JSON over HTTP)

**Key Patterns:**
- MVC (Backend)
- Component-based (Frontend)
- Custom Hooks (Reusability)
- Service Layer (Business Logic)
- Integration Layer (External APIs)

---

**This architecture ensures:**
✅ Modularity
✅ Scalability
✅ Maintainability
✅ Security
✅ Performance
✅ Developer Experience

---

**Made with ❤️ for Hackathon Flood Alert System**

