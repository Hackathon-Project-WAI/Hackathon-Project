import React, { useState } from 'react';
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
  ArrowRight,
  Sparkles,
  Shield,
  Clock
} from 'lucide-react';

const TelegramBotPopup = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("t.me/AquarouteAI_bot");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 font-sans">
        <button 
          onClick={() => setIsOpen(true)}
          className="group relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-bold shadow-2xl shadow-blue-500/30 transition-all transform hover:scale-105 hover:shadow-blue-500/50 flex items-center gap-3 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <MessageCircle className="w-6 h-6 relative z-10" />
          <span className="relative z-10">Mở Bot Telegram</span>
          <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900/20 via-blue-900/10 to-purple-900/20 p-4 backdrop-blur-md font-sans">
      {/* Main Container - Modern Glass Morphism Design */}
      <div className="relative w-full max-w-[900px] bg-white/95 backdrop-blur-xl rounded-[40px] shadow-2xl shadow-blue-500/20 overflow-hidden animate-pop-in border border-white/50 flex flex-col md:flex-row">
        
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50 opacity-50"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        {/* Close Button */}
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-6 right-6 z-30 bg-white/80 hover:bg-white backdrop-blur-sm text-slate-500 hover:text-slate-700 p-2.5 rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-110 group"
        >
          <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>

        {/* LEFT COLUMN: Visual & QR (Gradient Theme) */}
        <div className="w-full md:w-[45%] bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-8 md:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,white_1px,transparent_1px)] bg-[length:40px_40px]"></div>
          </div>
          
          {/* Floating Elements */}
          <div className="absolute top-10 right-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-float"></div>
          <div className="absolute bottom-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-float-delayed"></div>

          <div className="relative z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-6 shadow-lg border border-white/30">
              <Sparkles size={14} className="animate-pulse" />
              <span>Kết nối Bot</span>
            </div>

            {/* Title */}
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-3 drop-shadow-lg">
              Chat với<br/>
              <span className="bg-gradient-to-r from-yellow-200 to-white bg-clip-text text-transparent">
                Aquaroute AI
              </span>
            </h2>
            <p className="text-blue-100 text-sm font-medium flex items-center gap-2">
              <Shield size={16} />
              Trợ lý cảnh báo ngập lụt 24/7
            </p>
          </div>

          {/* QR Code Area - Enhanced */}
          <div className="relative z-10 mt-8 flex-1 flex flex-col items-center justify-center">
            <div className="relative group">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              
              {/* QR Container */}
              <div className="relative bg-white p-4 rounded-3xl shadow-2xl border-4 border-white/50 transform transition-all duration-500 group-hover:scale-105 group-hover:rotate-1">
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://t.me/AquarouteAI_bot&color=1e3a8a&bgcolor=ffffff&margin=1" 
                  alt="QR Code"
                  className="w-44 h-44 object-contain"
                />
              </div>

              {/* Animated Ring */}
              <div className="absolute inset-0 rounded-3xl border-2 border-white/30 animate-ping"></div>
            </div>

            {/* Bot Username */}
            <div className="flex items-center gap-2 text-white font-bold bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-full text-sm mt-6 shadow-lg border border-white/30 group hover:bg-white/30 transition-all">
              <Send size={16} className="group-hover:translate-x-1 transition-transform" />
              <span>@AquarouteAI_bot</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Instructions & Actions */}
        <div className="w-full md:w-[55%] p-8 md:p-10 flex flex-col justify-center bg-white/50 backdrop-blur-sm relative z-10">
          
          {/* Section Header */}
          <div className="mb-8">
            <h3 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <QrCode size={20} className="text-white" />
              </div>
              <span>Hướng dẫn nhanh</span>
            </h3>
            <p className="text-slate-500 text-sm">Kết nối chỉ trong 2 bước đơn giản</p>
          </div>

          {/* Steps Grid - Enhanced */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-3xl border-2 border-blue-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200/20 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
                  <span className="font-black text-lg">1</span>
                </div>
                <p className="text-slate-800 text-sm font-bold mb-1">Tìm Bot</p>
                <p className="text-slate-600 text-xs leading-relaxed">Mở Telegram và tìm biểu tượng QR ở thanh tìm kiếm</p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-3xl border-2 border-purple-100 hover:border-purple-300 hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200/20 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
                  <span className="font-black text-lg">2</span>
                </div>
                <p className="text-slate-800 text-sm font-bold mb-1">Quét & Start</p>
                <p className="text-slate-600 text-xs leading-relaxed">Quét mã QR bên cạnh và nhấn nút Start</p>
              </div>
            </div>
          </div>

          {/* Link Section - Enhanced */}
          <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-3xl p-2 flex items-center border-2 border-slate-200 mb-8 shadow-inner hover:shadow-lg transition-all group">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-lg text-white group-hover:scale-110 transition-transform">
              <ExternalLink size={18} />
            </div>
            <input 
              readOnly 
              value="t.me/AquarouteAI_bot"
              className="bg-transparent border-none text-sm text-slate-700 w-full focus:ring-0 font-semibold px-4 outline-none"
            />
            <button 
              onClick={handleCopy}
              className={`${
                copied 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
              } px-6 py-3 rounded-2xl transition-all font-bold text-sm shadow-lg hover:shadow-xl flex items-center gap-2 transform hover:scale-105`}
            >
              {copied ? (
                <>
                  <Check size={16} className="animate-bounce" />
                  <span>Đã chép!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Features Footer - Enhanced */}
          <div className="pt-6 border-t-2 border-slate-200">
            <p className="text-xs font-black text-slate-400 uppercase mb-4 tracking-wider flex items-center gap-2">
              <Sparkles size={12} />
              Tính năng nổi bật
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="group relative bg-gradient-to-br from-cyan-50 to-blue-50 px-4 py-3 rounded-2xl border-2 border-cyan-200 hover:border-cyan-400 hover:shadow-lg transition-all overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/0 to-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-2 shadow-md group-hover:scale-110 transition-transform">
                    <Droplets size={18} className="text-white" />
                  </div>
                  <span className="text-xs font-bold text-cyan-700">Cảnh báo ngập</span>
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-pink-50 to-rose-50 px-4 py-3 rounded-2xl border-2 border-pink-200 hover:border-pink-400 hover:shadow-lg transition-all overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-400/0 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mb-2 shadow-md group-hover:scale-110 transition-transform">
                    <MapPin size={18} className="text-white" />
                  </div>
                  <span className="text-xs font-bold text-pink-700">Đa điểm</span>
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-amber-50 to-orange-50 px-4 py-3 rounded-2xl border-2 border-amber-200 hover:border-amber-400 hover:shadow-lg transition-all overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/0 to-amber-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-2 shadow-md group-hover:scale-110 transition-transform">
                    <Zap size={18} className="text-white" />
                  </div>
                  <span className="text-xs font-bold text-amber-700">Khẩn cấp</span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 flex items-center gap-2 text-slate-500 text-xs">
            <Clock size={14} />
            <span>Phản hồi tức thì • Hoạt động 24/7</span>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes popIn {
          0% { 
            opacity: 0; 
            transform: scale(0.9) translateY(20px) rotate(-2deg); 
          }
          100% { 
            opacity: 1; 
            transform: scale(1) translateY(0) rotate(0deg); 
          }
        }

        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg); 
          }
          50% { 
            transform: translateY(-20px) rotate(5deg); 
          }
        }

        @keyframes floatDelayed {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg); 
          }
          50% { 
            transform: translateY(15px) rotate(-5deg); 
          }
        }

        .animate-pop-in {
          animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: floatDelayed 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default TelegramBotPopup;

