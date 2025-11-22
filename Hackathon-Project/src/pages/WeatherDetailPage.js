import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import WeatherDisplay from "../components/WeatherDisplay";
import PersonalizedAlertDemo from "../components/PersonalizedAlertDemo";
import FirebaseSensorsMonitor from "../components/FirebaseSensorsMonitor";
import AIAlertDemo from "../components/AIAlertDemo";
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
      console.log('🔵 Loading locations for user:', user.uid);
      fetchLocations(user.uid);
    }
  }, [user?.uid, fetchLocations]);
  
  // Get sensors data for real-time monitoring
  const { dangerousSensors } = useFirebaseSensors(false, 10000); // ✅ TẮT auto-refresh

  const renderFeatureContent = () => {
    switch (activeFeature) {
      case 'location-alerts':
        return (
          <div className="feature-content-wrapper">
            <div className="flex items-center justify-between mb-6">
              <button 
                className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors font-medium"
                onClick={() => setActiveFeature(null)}
              >
                <i className="fa-solid fa-arrow-left"></i> Quay lại
              </button>
              <h2 className="text-xl font-bold text-slate-800">📍 Cảnh báo khu vực của bạn</h2>
            </div>
            <PersonalizedAlertDemo currentUserId={user?.uid} />
          </div>
        );
      
      case 'realtime-alerts':
        return (
          <div className="feature-content-wrapper">
            <div className="flex items-center justify-between mb-6">
              <button 
                className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors font-medium"
                onClick={() => setActiveFeature(null)}
              >
                <i className="fa-solid fa-arrow-left"></i> Quay lại
              </button>
              <h2 className="text-xl font-bold text-slate-800">⚡ Thông báo thời gian thực</h2>
            </div>
            <FirebaseSensorsMonitor />
          </div>
        );
      
      case 'early-warning':
        return (
          <div className="feature-content-wrapper">
            <div className="flex items-center justify-between mb-6">
              <button 
                className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors font-medium"
                onClick={() => setActiveFeature(null)}
              >
                <i className="fa-solid fa-arrow-left"></i> Quay lại
              </button>
              <h2 className="text-xl font-bold text-slate-800">🔔 Cảnh báo sớm cá nhân</h2>
            </div>
            <AIAlertDemo />
          </div>
        );
      
      case 'auto-alert':
        return (
          <AutoAlertSystem onBack={() => setActiveFeature(null)} />
        );
      
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
              <h1 className="text-2xl font-bold text-slate-800">Thời tiết Đà Nẵng</h1>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <i className="fa-solid fa-location-dot text-blue-500"></i> Cập nhật: {new Date().toLocaleTimeString('vi-VN')}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="p-1 glass-card rounded-xl flex">
            <button
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === "weather" 
                  ? "bg-white text-blue-600 shadow-sm" 
                  : "text-slate-500 hover:text-blue-600"
              }`}
              onClick={() => setActiveTab("weather")}
            >
              <i className="fa-solid fa-sun"></i> Thời Tiết
            </button>
            <button
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === "flood" 
                  ? "bg-white text-blue-600 shadow-sm" 
                  : "text-slate-500 hover:text-blue-600"
              }`}
              onClick={() => setActiveTab("flood")}
            >
              <i className="fa-solid fa-flask"></i> Đang phát triển
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="w-full">
          {activeTab === "weather" ? (
            <WeatherDisplay />
          ) : activeFeature ? (
            renderFeatureContent()
          ) : (
            /* Features Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {/* Feature Card 1 */}
               <div 
                className="glass-card rounded-2xl p-6 cursor-pointer group"
                onClick={() => setActiveFeature('location-alerts')}
              >
                <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-map-location-dot text-xl"></i>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Cảnh báo khu vực</h3>
                <p className="text-sm text-slate-500 mb-4">Nhận cảnh báo ngập lụt cho các địa điểm quan trọng của bạn.</p>
                {user && locations.length > 0 && (
                   <span className="px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold border border-red-100">
                     {locations.length} địa điểm
                   </span>
                )}
              </div>

              {/* Feature Card 2 */}
              <div 
                className="glass-card rounded-2xl p-6 cursor-pointer group"
                onClick={() => setActiveFeature('realtime-alerts')}
              >
                <div className="w-12 h-12 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-bolt text-xl"></i>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Real-time IoT</h3>
                <p className="text-sm text-slate-500 mb-4">Theo dõi dữ liệu cảm biến mực nước theo thời gian thực.</p>
                {dangerousSensors.length > 0 && (
                   <span className="px-3 py-1 rounded-full bg-yellow-50 text-yellow-600 text-xs font-bold border border-yellow-100 animate-pulse">
                     {dangerousSensors.length} cảnh báo
                   </span>
                )}
              </div>

              {/* Feature Card 3 */}
              <div 
                className="glass-card rounded-2xl p-6 cursor-pointer group"
                onClick={() => setActiveFeature('early-warning')}
              >
                 <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-robot text-xl"></i>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">AI Cảnh báo sớm</h3>
                <p className="text-sm text-slate-500 mb-4">Sử dụng Gemini AI để phân tích và dự báo rủi ro ngập lụt.</p>
                <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-bold border border-purple-100">
                  AI-Powered
                </span>
              </div>

              {/* Feature Card 4 */}
              <div 
                className="glass-card rounded-2xl p-6 cursor-pointer group border-2 border-blue-400/30 bg-blue-50/50"
                onClick={() => setActiveFeature('auto-alert')}
              >
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-cogs text-xl"></i>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Hệ thống tự động</h3>
                <p className="text-sm text-slate-500 mb-4">Tự động quét và gửi cảnh báo qua email 24/7.</p>
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-bold border border-blue-200">
                  Premium
                </span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default WeatherDetailPage;
