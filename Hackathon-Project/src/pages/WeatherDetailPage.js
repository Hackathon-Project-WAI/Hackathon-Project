import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import WeatherDisplay from "../components/WeatherDisplay";
import PersonalizedAlertDemo from "../components/PersonalizedAlertDemo";
import FirebaseSensorsMonitor from "../components/FirebaseSensorsMonitor";
import AutoAlertSystem from "../components/AutoAlertSystem";
import { usePersonalizedAlert } from "../hooks/usePersonalizedAlert";
import { useFirebaseSensors } from "../hooks/useFirebaseSensors";
import authService from "../services/authService";
import "./WeatherDetailPage.css";

const WeatherDetailPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("weather");
  const [activeFeature, setActiveFeature] = useState(null);
  const [user, setUser] = useState(null);

  // Get current user
  useEffect(() => {
    const unsubscribe = authService.onAuthChange((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Get user data for personalized alerts
  const { locations, fetchLocations } = usePersonalizedAlert(user?.uid, false);

  // ✅ Tự động load locations khi user đăng nhập
  useEffect(() => {
    if (user?.uid) {
      console.log("🔵 Loading locations for user:", user.uid);
      fetchLocations(user.uid);
    }
  }, [user?.uid, fetchLocations]);

  // Get sensors data for real-time monitoring
  const { dangerousSensors } = useFirebaseSensors(false, 10000); // ✅ TẮT auto-refresh

  const renderFeatureContent = () => {
    switch (activeFeature) {
      case "location-alerts":
        return (
          <div className="feature-content-wrapper">
            <div className="flex items-center justify-between mb-6">
              <button
                className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors font-medium"
                onClick={() => setActiveFeature(null)}
              >
                <i className="fa-solid fa-arrow-left"></i> Quay lại
              </button>
              <h2 className="text-xl font-bold text-slate-800">
                📍 Cảnh báo khu vực của bạn
              </h2>
            </div>
            <PersonalizedAlertDemo currentUserId={user?.uid} />
          </div>
        );

      case "realtime-alerts":
        return (
          <div className="feature-content-wrapper">
            <div className="flex items-center justify-between mb-6">
              <button
                className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors font-medium"
                onClick={() => setActiveFeature(null)}
              >
                <i className="fa-solid fa-arrow-left"></i> Quay lại
              </button>
              <h2 className="text-xl font-bold text-slate-800">
                ⚡ Thông báo thời gian thực
              </h2>
            </div>
            <FirebaseSensorsMonitor />
          </div>
        );

      case "auto-alert":
        return <AutoAlertSystem onBack={() => setActiveFeature(null)} />;

      default:
        return null;
    }
  };

  return (
    <div className="h-screen overflow-y-auto custom-scrollbar p-4 md:p-8 relative bg-[#EEF2FF]">
      {/* Blobs - Fixed position to stay during scroll */}
      <div className="fixed top-[-10%] left-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob z-0"></div>
      <div className="fixed top-[-10%] right-[-10%] w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 z-0"></div>
      <div className="fixed bottom-[-10%] left-[20%] w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000 z-0"></div>

      <main className="glass-panel w-full max-w-7xl mx-auto rounded-3xl p-6 md:p-8 relative z-10 bg-white/40 backdrop-blur-xl border border-white/50 shadow-xl pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-white transition-all"
            >
              <i className="fa-solid fa-arrow-left"></i>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Thời tiết Đà Nẵng
              </h1>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <i className="fa-solid fa-location-dot text-blue-500"></i> Cập
                nhật: {new Date().toLocaleTimeString("vi-VN")}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="w-full">
          <WeatherDisplay />
        </div>
      </main>
    </div>
  );
};

export default WeatherDetailPage;
