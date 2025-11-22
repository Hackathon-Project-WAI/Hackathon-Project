/**
 * AutoAlertPage - Trang quản lý cảnh báo tự động
 * Hiển thị AutoAlertSystem component
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AutoAlertSystem from "../components/AutoAlertSystem";
import authService from "../services/authService";
import "./AutoAlertPage.css";

const AutoAlertPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = authService.onAuthChange((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  if (!user) {
    return (
      <div className="auto-alert-page loading">
        <div className="loading-spinner"></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto custom-scrollbar p-4 md:p-8 relative bg-[#EEF2FF]">
      {/* Blobs - Fixed position */}
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
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                Cấu hình hệ thống
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Quản lý cảnh báo tự động
              </p>
            </div>
          </div>
        </div>

        {/* Auto Alert System Component */}
        <AutoAlertSystem />
      </main>
    </div>
  );
};

export default AutoAlertPage;
