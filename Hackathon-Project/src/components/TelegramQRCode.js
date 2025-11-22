/**
 * TelegramQRCode Component
 * Hiển thị QR code để người dùng quét và truy cập Telegram Bot
 */

import React, { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  getTelegramQRInfo,
  getBotInfo,
  checkTelegramStatus,
} from "../api/telegramApi";
import { 
  X, 
  Smartphone, 
  Copy, 
  Check, 
  Send, 
  QrCode, 
  Droplets,
  MapPin,
  Zap,
  ExternalLink,
  MessageCircle,
  ArrowRight
} from 'lucide-react';
import "./TelegramQRCode.css";

const TelegramQRCode = ({ showModal = false, onClose }) => {
  const [qrData, setQrData] = useState("");
  const [botInfo, setBotInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const pollingIntervalRef = useRef(null);
  const userIdRef = useRef(null);

  useEffect(() => {
    if (showModal) {
      loadBotInfo();
      startPolling();
    } else {
      stopPolling();
      // Reset states khi đóng modal
      setIsLinked(false);
      setLinkSuccess(false);
    }

    return () => {
      stopPolling();
    };
  }, [showModal]);

  const loadBotInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      // Lấy userId từ Firebase Auth (imported from configs)
      const { auth } = await import("../configs/firebase");
      const currentUser = auth.currentUser;
      const userId = currentUser?.uid;

      console.log("🔐 Current user ID for QR:", userId);
      userIdRef.current = userId; // Lưu userId để polling

      // Lấy thông tin QR với userId để auto-link
      const qrResponse = await getTelegramQRInfo(userId);
      if (qrResponse.success) {
        setQrData(qrResponse.data.qrData);
        console.log("✅ QR data loaded:", qrResponse.data.qrData);
      }

      // Lấy thông tin chi tiết bot
      const infoResponse = await getBotInfo();
      if (infoResponse.success) {
        setBotInfo(infoResponse.data);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error loading bot info:", err);
      setError("Không thể tải thông tin bot. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  // Polling để kiểm tra trạng thái liên kết
  const startPolling = () => {
    console.log("🔄 Bắt đầu polling kiểm tra liên kết Telegram...");

    pollingIntervalRef.current = setInterval(async () => {
      if (!userIdRef.current) return;

      try {
        const response = await checkTelegramStatus(userIdRef.current);

        if (response.success && response.data.isLinked) {
          console.log("✅ Phát hiện liên kết thành công!", response.data);
          setIsLinked(true);
          setLinkSuccess(true);
          stopPolling();

          // Tự động đóng modal sau 2 giây để user thấy thông báo thành công
          setTimeout(() => {
            onClose();
          }, 2000);
        }
      } catch (error) {
        console.error("❌ Lỗi khi polling:", error);
      }
    }, 2000); // Kiểm tra mỗi 2 giây
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      console.log("⏹️ Dừng polling");
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(qrData || `t.me/${botInfo?.username || 'AquarouteAI_bot'}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!showModal) {
    return null;
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 font-sans fixed inset-0"
      onClick={onClose}
      style={{
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        animation: 'fadeIn 0.3s ease',
        zIndex: 99999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* Main Container */}
      <div 
        className="relative w-full max-w-[750px] bg-white rounded-[32px] shadow-2xl shadow-blue-100/50 overflow-hidden animate-pop-in border border-white flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          zIndex: 100000,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-slate-100 hover:bg-slate-200 text-slate-500 p-2 rounded-full transition-all"
        >
          <X size={18} />
        </button>

        {/* LEFT COLUMN: Visual & QR (Blue Theme) */}
        <div className="w-full md:w-5/12 bg-blue-50/50 p-6 flex flex-col justify-between relative overflow-hidden">
          {/* Background decor */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-100/50 to-transparent z-0"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 shadow-sm">
              <Smartphone size={12} />
              <span>Kết nối Bot</span>
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight mb-1">
              Chat với<br/>Aquaroute AI
            </h2>
            <p className="text-slate-500 text-xs font-medium">Trợ lý cảnh báo ngập lụt 24/7</p>
          </div>

          {/* QR Code Area - Fixed & Prominent */}
          <div className="relative z-10 mt-4 flex-1 flex flex-col items-center justify-center">
            {loading ? (
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <p className="text-blue-600 text-sm font-medium">Đang tải...</p>
              </div>
            ) : error ? (
              <div className="text-center p-4">
                <p className="text-red-600 text-sm mb-3">❌ {error}</p>
                <button 
                  onClick={loadBotInfo}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                >
                  Thử lại
                </button>
              </div>
            ) : linkSuccess ? (
              <div className="text-center">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <Check size={40} className="text-white" />
                </div>
                <h3 className="text-xl font-black text-green-600 mb-2">Liên kết thành công!</h3>
                <p className="text-sm text-slate-600">Modal sẽ tự động đóng...</p>
              </div>
            ) : (
              <>
                <div className="bg-white p-3 rounded-2xl shadow-lg shadow-blue-100 border border-white transform transition-transform hover:scale-105 duration-300">
                  {qrData ? (
                    <QRCodeSVG
                      value={qrData}
                      size={144}
                      level="H"
                      includeMargin={true}
                    />
                  ) : (
                    <div className="w-36 h-36 flex items-center justify-center bg-slate-100 rounded-xl">
                      <QrCode size={48} className="text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-blue-600 font-semibold bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs mt-3 shadow-sm border border-blue-100/50">
                  <Send size={12} />
                  <span>@{botInfo?.username || 'AquarouteAI_bot'}</span>
                </div>
                
                {/* Polling Status */}
                <div className="mt-4 flex items-center gap-2 text-xs text-blue-500">
                  <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                  <span>Đang chờ bạn quét mã...</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Instructions & Actions */}
        <div className="w-full md:w-7/12 p-6 md:p-8 flex flex-col justify-center bg-white">
          
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <QrCode size={14} /> Hướng dẫn nhanh
          </h3>

          {/* Grid Steps - Compact */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 hover:bg-blue-50/50 hover:border-blue-100 transition-colors group">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <span className="font-bold text-xs">1</span>
              </div>
              <p className="text-slate-700 text-xs font-bold mb-0.5">Tìm Bot</p>
              <p className="text-slate-500 text-[10px] leading-tight">Mở Telegram và tìm biểu tượng QR</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 hover:bg-purple-50/50 hover:border-purple-100 transition-colors group">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <span className="font-bold text-xs">2</span>
              </div>
              <p className="text-slate-700 text-xs font-bold mb-0.5">Quét & Start</p>
              <p className="text-slate-500 text-[10px] leading-tight">Quét mã bên cạnh và nhấn Start</p>
            </div>
          </div>

          {/* Link Section - Horizontal Bar */}
          <div className="bg-slate-50 rounded-2xl p-1.5 flex items-center border border-slate-100 mb-6 shadow-inner">
            <div className="bg-white p-2 rounded-xl shadow-sm text-blue-600">
              <ExternalLink size={16} />
            </div>
            <input 
              readOnly 
              value={qrData ? qrData.replace('https://', '').replace('http://', '') : `t.me/${botInfo?.username || 'AquarouteAI_bot'}`}
              className="bg-transparent border-none text-xs text-slate-600 w-full focus:ring-0 font-semibold px-3 outline-none"
            />
            <button 
              onClick={handleCopy}
              className={`${copied ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'} px-4 py-2 rounded-xl transition-all font-bold text-xs shadow-md flex items-center gap-1.5`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Đã chép' : 'Copy'}
            </button>
          </div>

          {/* Features Footer - Compact Row */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Tính năng nổi bật</p>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 bg-cyan-50 px-3 py-2 rounded-xl border border-cyan-100/50">
                <Droplets size={14} className="text-cyan-600" />
                <span className="text-[10px] font-bold text-cyan-700">Cảnh báo ngập</span>
              </div>
              <div className="flex items-center gap-2 bg-pink-50 px-3 py-2 rounded-xl border border-pink-100/50">
                <MapPin size={14} className="text-pink-600" />
                <span className="text-[10px] font-bold text-pink-700">Đa điểm</span>
              </div>
              <div className="flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-xl border border-amber-100/50">
                <Zap size={14} className="text-amber-600" />
                <span className="text-[10px] font-bold text-amber-700">Khẩn cấp</span>
              </div>
            </div>
          </div>

          {/* Bot Info Toggle - Optional */}
          {botInfo && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowDetail(!showDetail)}
                className="w-full text-left text-xs text-slate-500 hover:text-slate-700 font-semibold"
              >
                {showDetail ? "▼" : "▶"} Thông tin chi tiết
              </button>

              {showDetail && (
                <div className="mt-2 p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-semibold">Bot ID:</span>
                    <span className="text-slate-800">{botInfo.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-semibold">Username:</span>
                    <span className="text-slate-800">@{botInfo.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-semibold">Tên:</span>
                    <span className="text-slate-800">{botInfo.firstName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-semibold">Người dùng:</span>
                    <span className="text-blue-600 font-bold">{botInfo.registeredUsers} người</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.95) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-pop-in {
          animation: popIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
};

export default TelegramQRCode;
