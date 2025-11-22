import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
} from "react-router-dom";
import "./App.css";
import MapViewRefactored from "./components/MapViewRefactored";
import WeatherWidget from "./components/WeatherWidget";
import WeatherDetailPage from "./pages/WeatherDetailPage";
import WeatherDropdown from "./components/WeatherDropdown";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import AdminPage from "./pages/AdminPage";
import APIDemo from "./pages/APIDemo";
import SensorsPage from "./pages/SensorsPage";
import AutoAlertPage from "./pages/AutoAlertPage";
import authService from "./services/authService";
import floodData from "./data/floodProneAreas.json";
import TopNavigation from "./components/TopNavigation";

// Icons cho GradientTabs
const MapIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const WeatherIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
  </svg>
);

const LoginIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" x2="3" y1="12" y2="12" />
  </svg>
);

// Protected Route Component
const ProtectedRoute = ({ children, user }) => {
  console.log("🔒 ProtectedRoute check - User:", user ? user.email : "NULL");

  if (!user) {
    console.log("⛔ No user - Redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  console.log("✅ User authenticated - Rendering protected content");
  return children;
};

// 🛡️ Admin Route Component - Chỉ cho phép trantafi204@gmail.com
const AdminRoute = ({ children, user }) => {
  const ADMIN_EMAIL = "trantafi204@gmail.com";

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.email !== ADMIN_EMAIL) {
    console.warn(`⛔ Access Denied: ${user.email} is not an admin.`);
    alert("⛔ Bạn không có quyền truy cập trang Admin!");
    return <Navigate to="/" replace />;
  }

  return children;
};

// Navigation Component đã được thay thế bằng TopNavigation với UI mới

function App() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("Đà Nẵng");
  const [floodZones, setFloodZones] = useState([]);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Lấy API key từ environment variable
  const API_KEY = process.env.REACT_APP_HERE_API_KEY || "";

  // 🔐 Theo dõi auth state
  useEffect(() => {
    console.log("🔍 Checking auth state...");
    const unsubscribe = authService.onAuthChange((currentUser) => {
      console.log("📊 Auth state changed:", currentUser);
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        console.log("✅ User logged in:", currentUser.email);
      } else {
        console.log("❌ No user - should redirect to login");
      }
    });

    return () => unsubscribe();
  }, []);

  // 🗺️ Load flood zones data
  useEffect(() => {
    if (floodData && floodData.floodPrones) {
      const baseZones = floodData.floodPrones;

      // ✨ THÊM TỌA ĐỘ TEST - Bạn có thể thêm/xóa tọa độ ở đây
      const customTestZones = [
        {
          id: "TEST_001",
          name: "🧪 Test Zone - Tọa độ của bạn",
          district: "Ngũ Hành Sơn",
          coords: {
            lat: 15.982492, // Tọa độ bạn cung cấp
            lng: 108.250885,
          },
          radius: 200,
          riskLevel: "high",
          description:
            "Đây là tọa độ test tại 15.982826, 108.253585 - Khu vực ngập cao",
          rainThreshold: {
            yellow: 25,
            orange: 45,
            red: 70,
          },
        },
        {
          id: "TEST_002",
          name: "🧪 Test Zone - Medium Risk",
          district: "Sơn Trà",
          coords: {
            lat: 15.985,
            lng: 108.255,
          },
          radius: 100,
          riskLevel: "medium",
          description: "Zone test với rủi ro trung bình - màu vàng",
          rainThreshold: {
            yellow: 35,
            orange: 60,
            red: 90,
          },
        },
        {
          id: "TEST_003",
          name: "🧪 Test Zone - Low Risk",
          district: "Ngũ Hành Sơn",
          coords: {
            lat: 15.98,
            lng: 108.251,
          },
          radius: 100,
          riskLevel: "low",
          description: "Zone test với rủi ro thấp - màu xanh lá",
        },
      ];

      // Gộp data gốc với test zones
      const allZones = [...baseZones, ...customTestZones];
      setFloodZones(allZones);

      console.log(
        "✅ Loaded flood zones:",
        baseZones.length,
        "+ test zones:",
        customTestZones.length,
        "= total:",
        allZones.length
      );
      console.log("🎯 Test zone của bạn tại:", customTestZones[0].coords);
    }
  }, []);

  // Fetch places từ HERE API
  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `https://discover.search.hereapi.com/v1/discover?at=16.0544,108.2022&q=${encodeURIComponent(
            searchQuery
          )}&apiKey=${API_KEY}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.items && data.items.length > 0) {
          setPlaces(data.items);
        } else {
          setPlaces([]);
          setError("Không tìm thấy địa điểm nào");
        }
      } catch (err) {
        console.error("Lỗi khi fetch data:", err);
        setError(err.message || "Không thể tải dữ liệu");
        setPlaces([]);
      } finally {
        setLoading(false);
      }
    };

    if (API_KEY) {
      fetchPlaces();
    } else {
      setError("Thiếu API Key. Vui lòng thêm vào file .env");
      setLoading(false);
    }
  }, [API_KEY, searchQuery]);

  // Show loading khi đang check auth
  if (authLoading) {
    return (
      <div className="App">
        <div className="loading-container" style={{ height: "100vh" }}>
          <div className="loading-spinner"></div>
          <p className="loading-text">Đang kiểm tra đăng nhập...</p>
        </div>
      </div>
    );
  }

  // Logout handler
  const handleLogout = async () => {
    await authService.logout();
  };

  return (
    <Router>
      <Routes>
        {/* Login Page */}
        <Route path="/login" element={<Login />} />

        {/* Register Page */}
        <Route path="/register" element={<Register />} />

        {/* Main Page - Map with Widget - PUBLIC (Không cần login) */}
        <Route
          path="/"
          element={
            <div className="App">
              {/* Main Content - Fullscreen Map */}
              <main className="App-main fullscreen">
                {/* Loading State */}
                {loading && (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">Đang tải dữ liệu...</p>
                  </div>
                )}

                {/* Error State */}
                {error && !loading && (
                  <div className="error-container">
                    <span className="error-icon">⚠️</span>
                    <h3>Có lỗi xảy ra</h3>
                    <p className="error-message">{error}</p>
                    {!API_KEY && (
                      <p className="error-note">
                        💡 Lưu ý: Vui lòng thêm HERE API Key vào file .env
                        <br />
                        <code>REACT_APP_HERE_API_KEY=your_api_key_here</code>
                      </p>
                    )}
                  </div>
                )}

                {/* Success State - Fullscreen Map */}
                {!loading && !error && places.length > 0 && (
                  <>
                    {/* Top Navigation - Modern UI */}
                    <TopNavigation user={user} onLogout={handleLogout} />

                    <div className="map-container-fullscreen">
                      <MapViewRefactored
                        places={places}
                        apiKey={API_KEY}
                        floodZones={floodZones}
                      />
                    </div>
                  </>
                )}
              </main>

              {/* Footer */}
              <footer className="App-footer">
                <p>
                  Powered by{" "}
                  <a
                    href="https://developer.here.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    HERE Maps API
                  </a>{" "}
                  &{" "}
                  <a
                    href="https://openweathermap.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    OpenWeatherMap API
                  </a>{" "}
                  | Made with ❤️ by Hackathon WAI Team
                </p>
              </footer>
            </div>
          }
        />

        {/* Weather Detail Page - PROTECTED */}
        <Route
          path="/weather-detail"
          element={
            <ProtectedRoute user={user}>
              <WeatherDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Profile Page - PROTECTED */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute user={user}>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Admin Page - PROTECTED (Only for trantafi204@gmail.com) */}
        <Route
          path="/admin"
          element={
            <AdminRoute user={user}>
              <AdminPage />
            </AdminRoute>
          }
        />

        {/* API Demo Page - PUBLIC (for testing) */}
        <Route path="/api-demo" element={<APIDemo />} />

        {/* Sensors Page - PUBLIC - Hiển thị 2 sensors SENSOR_ROAD và SENSOR_SEWER */}
        <Route path="/sensors" element={<SensorsPage />} />

        {/* Auto Alert Page - PROTECTED */}
        <Route
          path="/auto-alert"
          element={
            <ProtectedRoute user={user}>
              <AutoAlertPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
