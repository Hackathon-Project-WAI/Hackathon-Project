import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CloudRain,
  Map,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import authService from "../services/authService";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await authService.login(email, password);
      if (result.success) {
        navigate("/");
      } else {
        setError(result.error || "Đăng nhập thất bại");
      }
    } catch (err) {
      setError("Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await authService.loginWithGoogle();
      if (result.success) {
        navigate("/");
      } else {
        setError(result.error || "Đăng nhập Google thất bại");
      }
    } catch (err) {
      setError("Đã có lỗi xảy ra với Google Login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 overflow-hidden font-sans text-slate-700 selection:bg-indigo-100 selection:text-indigo-900 bg-[#EEF2FF]">
      {/* --- BACKGROUND EFFECTS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Đổi màu blob nền sang tông xanh cho hợp chủ đề */}
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-300/40 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-300/40 rounded-full blur-[120px] animate-pulse delay-1000"></div>
        <div className="absolute top-[40%] left-[60%] w-[400px] h-[400px] bg-indigo-300/30 rounded-full blur-[100px] animate-pulse delay-500"></div>
      </div>

      {/* --- MAIN CONTAINER (SPLIT LAYOUT) --- */}
      <div className="w-full max-w-6xl relative z-10">
        <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/10 border border-white/60 bg-white/40 grid grid-cols-1 md:grid-cols-12 min-h-[700px]">
          {/* --- LEFT SIDE: LOGIN FORM (5 Cols) --- */}
          <div className="md:col-span-5 p-8 md:p-12 flex flex-col justify-between relative bg-white/30">
            {/* Top Nav */}
            <div className="flex justify-between items-center mb-8">
              <Link
                to="/"
                className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft size={16} /> Trang chủ
              </Link>
              <Link
                to="/register"
                className="text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 transition-all hover:shadow-sm"
              >
                Đăng ký
              </Link>
            </div>

            {/* Form Content */}
            <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <CloudRain className="text-blue-600" size={28} />
                  <h2 className="text-xl font-bold text-slate-800">
                    Hệ thống Cảnh báo Ngập
                  </h2>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  Đăng nhập
                </h1>
                <p className="text-slate-500 text-sm">
                  Truy cập vào hệ thống để sử dụng đầy đủ tính năng.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2">
                  <AlertTriangle size={16} /> {error}
                </div>
              )}

              <form className="space-y-5" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">
                    Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <Mail size={20} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="glass-input w-full !pl-14 pr-4 py-3.5 rounded-xl text-slate-700 font-medium placeholder-slate-400 bg-white/50 border border-white/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                      placeholder="example@email.com"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">
                    Mật khẩu
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <Lock size={20} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="glass-input w-full !pl-14 pr-12 py-3.5 rounded-xl text-slate-700 font-medium placeholder-slate-400 bg-white/50 border border-white/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                      placeholder="••••••••"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Nút đăng nhập đổi sang màu xanh biển */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold text-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span>Đang xử lý...</span>
                  ) : (
                    <>
                      <Lock size={18} /> Đăng nhập
                    </>
                  )}
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-300/50"></div>
                  <span className="flex-shrink mx-4 text-slate-400 text-xs font-medium uppercase">
                    hoặc
                  </span>
                  <div className="flex-grow border-t border-slate-300/50"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-white/60 border border-white hover:bg-white hover:scale-[1.01] transition-all shadow-sm flex items-center justify-center gap-3 text-slate-700 font-semibold text-sm group disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Đăng nhập bằng Google
                </button>
              </form>
            </div>

            <div className="mt-8 text-center">
              <p className="text-slate-400 text-xs">
                © 2025 Hackathon WAI Team. All rights reserved.
              </p>
            </div>
          </div>

          {/* --- RIGHT SIDE: INFO HERO (WATER THEME) --- */}
          <div className="md:col-span-7 hidden md:flex flex-col justify-center items-center p-12 relative bg-gradient-to-br from-blue-600/90 to-cyan-600/90 text-white overflow-hidden">
            {/* Decor Background */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-20%] left-[-20%] w-[500px] h-[500px] bg-cyan-400/20 rounded-full blur-[100px]"></div>

            <div className="relative z-10 max-w-lg text-center">
              {/* Main Icon */}
              <div className="w-24 h-24 bg-white/10 backdrop-blur-lg rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl border border-white/20 animate-float">
                <CloudRain size={48} className="text-white drop-shadow-md" />
              </div>

              <h2 className="text-4xl font-bold mb-4">
                Hệ thống Cảnh báo <br /> Ngập Lụt
              </h2>
              <p className="text-blue-50 text-lg mb-10 leading-relaxed">
                Giám sát thời tiết thực tế và cảnh báo ngập lụt chính xác cho
                khu vực của bạn.
              </p>

              {/* Feature List */}
              <div className="space-y-4 w-full text-left">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-4 hover:bg-white/20 transition-colors cursor-default">
                  <div className="p-3 bg-blue-500/30 rounded-xl text-blue-100">
                    <Map size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Bản đồ tương tác</h4>
                    <p className="text-sm text-blue-100 opacity-80">
                      Xem các điểm ngập lụt trực quan trên bản đồ
                    </p>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-4 hover:bg-white/20 transition-colors cursor-default">
                  <div className="p-3 bg-yellow-500/30 rounded-xl text-yellow-100">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">
                      Cảnh báo thời gian thực
                    </h4>
                    <p className="text-sm text-blue-100 opacity-80">
                      Nhận thông báo ngay khi có nguy cơ ngập
                    </p>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-4 hover:bg-white/20 transition-colors cursor-default">
                  <div className="p-3 bg-emerald-500/30 rounded-xl text-emerald-100">
                    <BarChart3 size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Dự báo thông minh</h4>
                    <p className="text-sm text-blue-100 opacity-80">
                      Phân tích dữ liệu mưa và dự đoán ngập lụt
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- STYLES --- */}
      <style>{`
        .glass-panel {
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
        }
        .glass-input::placeholder {
            color: #94a3b8;
        }
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        .animate-float {
            animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Login;
