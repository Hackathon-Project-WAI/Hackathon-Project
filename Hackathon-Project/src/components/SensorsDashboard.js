/**
 * Sensors Dashboard - Hiển thị dữ liệu TẤT CẢ sensors từ Firebase
 */
import React, { useState, useEffect } from "react";
import {
  Waves,
  MapPin,
  Clock,
  RefreshCw,
  PauseCircle,
  PlayCircle,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  MoreVertical,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import sensorService from "../services/sensorService";

const SensorsDashboard = () => {
  const navigate = useNavigate();
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Subscribe to sensors realtime
  useEffect(() => {
    console.log("🔍 SensorsDashboard: Component mounted");
    console.log("📡 SensorsDashboard: Subscribing to sensors...");

    const unsubscribe = sensorService.subscribeSensors((sensorsData) => {
      console.log("🌊 SensorsDashboard: Received sensors data:", sensorsData);
      setSensors(sensorsData);
      setLastUpdate(new Date());
      setLoading(false);
      setError(null);
    });

    return () => {
      console.log("🛑 SensorsDashboard: Unsubscribing from sensors");
      unsubscribe();
    };
  }, []);

  const handleRefresh = async () => {
    console.log("🔄 SensorsDashboard: Manual refresh");
    setIsRefreshing(true);
    setLastUpdate(new Date());
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Helper để lấy màu sắc và status
  const getStatusInfo = (floodStatus) => {
    switch (floodStatus) {
      case "CRITICAL":
      case "DANGER":
        return {
          status: "danger",
          color: "text-red-600 bg-red-100 border-red-200",
          progressColor: "bg-gradient-to-r from-red-500 to-pink-600",
        };
      case "WARNING":
        return {
          status: "warning",
          color: "text-orange-600 bg-orange-100 border-orange-200",
          progressColor: "bg-gradient-to-r from-orange-400 to-yellow-500",
        };
      case "SAFE":
        return {
          status: "safe",
          color: "text-green-600 bg-green-100 border-green-200",
          progressColor: "bg-gradient-to-r from-green-400 to-emerald-500",
        };
      default:
        return {
          status: "unknown",
          color: "text-slate-600 bg-slate-100 border-slate-200",
          progressColor: "bg-slate-400",
        };
    }
  };

  const formatTime = (date) => {
    if (!date) return "--:--:--";
    return date.toLocaleTimeString("vi-VN");
  };

  const formatFullTime = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(parseInt(timestamp));
    return date.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Convert sensors array
  const getSensorArray = () => {
    if (!sensors || sensors.length === 0) return [];
    return sensors;
  };

  if (loading && sensors.length === 0) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white">
        <div className="text-center">
          <RefreshCw
            className="animate-spin text-blue-600 mx-auto mb-4"
            size={40}
          />
          <p className="text-slate-600 font-medium">
            Đang tải dữ liệu sensors...
          </p>
        </div>
      </div>
    );
  }

  const sensorArray = getSensorArray();

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center p-4 md:p-8 font-sans text-slate-700 selection:bg-blue-100 selection:text-blue-900 bg-gradient-to-br from-slate-50 to-slate-100">
      {/* --- BACKGROUND EFFECTS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-300/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-300/20 rounded-full blur-[120px]"></div>
      </div>

      {/* --- MAIN CONTAINER --- */}
      <div className="w-full max-w-7xl relative z-10">
        {/* 1. HEADER AREA */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button
              onClick={() => navigate("/")}
              className="p-3 rounded-xl bg-white/60 hover:bg-white border border-slate-200 text-slate-600 hover:text-blue-600 transition-all shadow-sm"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                <Waves className="text-blue-600" size={32} /> Giám sát Sensors
              </h1>
              <p className="text-sm text-slate-500 font-medium flex items-center gap-2 mt-1">
                <Clock size={14} /> Cập nhật lần cuối: {formatTime(lastUpdate)}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 bg-white/60 backdrop-blur-xl border border-slate-200 px-5 py-3 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-500 mr-2 border-r border-slate-300 pr-4">
              Trạng thái:
              <span
                className={`flex items-center gap-1 ${
                  autoRefresh ? "text-green-600" : "text-orange-500"
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    autoRefresh ? "bg-green-500 animate-pulse" : "bg-orange-500"
                  }`}
                ></span>
                {autoRefresh ? "Live" : "Paused"}
              </span>
            </div>

            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
              title={autoRefresh ? "Tạm dừng" : "Tiếp tục"}
            >
              {autoRefresh ? (
                <PauseCircle size={22} />
              ) : (
                <PlayCircle size={22} />
              )}
            </button>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:scale-[1.02] transition-all disabled:opacity-70"
            >
              <RefreshCw
                size={18}
                className={isRefreshing ? "animate-spin" : ""}
              />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-xl text-red-700 text-sm">
            ❌ {error}
          </div>
        )}

        {/* 2. SENSOR GRID - Larger cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {sensorArray.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-slate-500 text-lg">Không có dữ liệu sensor</p>
            </div>
          ) : (
            sensorArray.map((sensor) => {
              const statusInfo = getStatusInfo(sensor.flood_status);
              const percentage = Math.min(
                100,
                Math.round((sensor.water_level_cm / 100) * 100)
              );

              return (
                <div
                  key={sensor.id}
                  className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-8 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 group relative overflow-hidden"
                >
                  {/* Top Bar of Card */}
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg text-white">
                        <Waves size={28} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-xl">
                          {sensor.device_id || sensor.id}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono mt-1">
                          ID: {sensor.id}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div
                      className={`px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${statusInfo.color}`}
                    >
                      {statusInfo.status === "danger" && (
                        <AlertTriangle size={14} />
                      )}
                      {statusInfo.status === "safe" && (
                        <CheckCircle2 size={14} />
                      )}
                      {statusInfo.status === "warning" && (
                        <AlertTriangle size={14} />
                      )}
                      {sensor.flood_status || "UNKNOWN"}
                    </div>
                  </div>

                  {/* Main Metric: Water Level */}
                  <div className="mb-8 text-center relative py-6">
                    <div className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-2">
                      Mực nước hiện tại
                    </div>
                    <div className="flex justify-center items-baseline gap-2">
                      <span className="text-6xl font-bold text-slate-800">
                        {sensor.water_level_cm || 0}
                      </span>
                      <span className="text-2xl font-medium text-slate-500">
                        cm
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-400 mt-2">
                      ({percentage}% sức chứa)
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 h-4 rounded-full mb-8 overflow-hidden border border-slate-200 shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${statusInfo.progressColor}`}
                      style={{ width: `${percentage}%` }}
                    >
                      <div className="w-full h-full animate-[shimmer_2s_linear_infinite] bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem]"></div>
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 text-slate-400 font-bold">
                        <MapPin size={16} /> Vị trí
                      </div>
                      <div className="text-slate-700 font-mono text-sm">
                        {sensor.latitude?.toFixed(4)},{" "}
                        {sensor.longitude?.toFixed(4)}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 text-slate-400 font-bold">
                        <Clock size={16} /> Cập nhật
                      </div>
                      <div className="text-slate-700 font-medium text-xs">
                        {sensor.timestamp
                          ? formatFullTime(sensor.timestamp)?.split(",")[0]
                          : "N/A"}
                      </div>
                    </div>
                  </div>

                  {/* Decorative Action Menu */}
                  <button className="absolute top-6 right-6 text-slate-300 hover:text-slate-700 transition-colors opacity-0 group-hover:opacity-100">
                    <MoreVertical size={22} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* --- STYLES --- */}
      <style>{`
        .glass-panel {
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
        }
        @keyframes shimmer {
            from { background-position: 0 0; }
            to { background-position: -1rem 0; }
        }
      `}</style>
    </div>
  );
};

export default SensorsDashboard;
