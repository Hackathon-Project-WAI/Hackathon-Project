import React, { useState, useEffect, useCallback } from "react";
import {
  User as UserIcon,
  Mail,
  MapPin,
  Activity,
  Settings,
  Clock,
  Waves,
  AlertTriangle,
  Bot,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import { usePersonalizedAlert } from "../hooks/usePersonalizedAlert";
import { useFirebaseSensors } from "../hooks/useFirebaseSensors";
import { aiAlertApi, personalizedAlertApi } from "../api";
import authService from "../services/authService";
import userProfileService from "../services/userProfileService";
import "./AutoAlertSystem.css";

const AutoAlertSystem = ({ onBack }) => {
  // --- Existing Logic State ---
  const [user, setUser] = useState(null);
  const [isWeatherAlertEnabled, setIsWeatherAlertEnabled] = useState(null); // 🌦️ Cảnh báo thời tiết
  const [isSensorAlertEnabled, setIsSensorAlertEnabled] = useState(null); // 🌊 Cảnh báo sensor
  const [checkInterval, setCheckInterval] = useState(null); // 15 minutes default
  const [waterLevelThreshold, setWaterLevelThreshold] = useState(null); // 50cm default
  const [riskLevelThreshold, setRiskLevelThreshold] = useState(null); // 1 = warning and above
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // 🔍 DEBUG: Log initial state
  console.log("🐛 AutoAlertSystem mounted with checkInterval:", checkInterval);

  // Stats & Logic State (Hidden from UI but kept for functionality)
  const [lastCheck, setLastCheck] = useState(null);
  const [nextCheck, setNextCheck] = useState(null);
  const [alertHistory, setAlertHistory] = useState([]);
  const [stats, setStats] = useState({
    totalChecks: 0,
    alertsSent: 0,
    alertsSkipped: 0,
    lastAlertTime: null,
  });

  // Notification Settings - khởi tạo null để đợi load từ DB
  const [emailNotification, setEmailNotification] = useState(null);
  const [telegramNotification, setTelegramNotification] = useState(null);
  const [notificationLoaded, setNotificationLoaded] = useState(false);

  const { checkLocationsAndAlert, locations, fetchLocations } =
    usePersonalizedAlert(user?.uid, false); // Không auto-fetch, sẽ fetch thủ công

  const { sensors, dangerousSensors } = useFirebaseSensors(
    isSensorAlertEnabled,
    5000
  ); // ✅ Chỉ fetch khi bật sensor alert

  // ✅ Fetch locations khi user đăng nhập (để hiển thị số lượng)
  useEffect(() => {
    if (user?.uid) {
      console.log("🔵 AutoAlertSystem: Loading locations for user:", user.uid);
      fetchLocations(user.uid);
    }
  }, [user?.uid, fetchLocations]);

  // Get current user
  useEffect(() => {
    const unsubscribe = authService.onAuthChange((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        console.log(`👤 User đăng nhập: ${currentUser.email}`);
        loadNotificationSettings(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  // Load notification settings và auto-alert settings
  const loadNotificationSettings = async (userId) => {
    try {
      const result = await userProfileService.getUserProfile(userId);
      if (result.success) {
        // Load notification settings
        if (result.data.notificationSettings) {
          const emailSetting = result.data.notificationSettings.email ?? true;
          const telegramSetting =
            result.data.notificationSettings.telegram ?? false;
          console.log("📧 Loaded notification settings:", {
            email: emailSetting,
            telegram: telegramSetting,
          });
          setEmailNotification(emailSetting);
          setTelegramNotification(telegramSetting);
        } else {
          setEmailNotification(true);
          setTelegramNotification(false);
        }

        // Load auto-alert settings
        if (result.data.autoAlertSettings) {
          const autoSettings = result.data.autoAlertSettings;
          console.log("⚙️ Loaded auto-alert settings:", autoSettings);
          setIsWeatherAlertEnabled(autoSettings.isWeatherAlertEnabled ?? false);
          setIsSensorAlertEnabled(autoSettings.isSensorAlertEnabled ?? false);
          setCheckInterval(autoSettings.checkInterval ?? 15);
          setWaterLevelThreshold(autoSettings.waterLevelThreshold ?? 50);
          setRiskLevelThreshold(autoSettings.riskLevelThreshold ?? 1);
        } else {
          // Default auto-alert settings
          console.log("⚙️ Using default auto-alert settings");
          setIsWeatherAlertEnabled(false);
          setIsSensorAlertEnabled(false);
          setCheckInterval(15);
          setWaterLevelThreshold(50);
          setRiskLevelThreshold(1);
        }

        setNotificationLoaded(true);
        setSettingsLoaded(true);
      } else {
        // Fallback to defaults
        setEmailNotification(true);
        setTelegramNotification(false);
        setIsWeatherAlertEnabled(false);
        setIsSensorAlertEnabled(false);
        setCheckInterval(15);
        setWaterLevelThreshold(50);
        setRiskLevelThreshold(1);
        setNotificationLoaded(true);
        setSettingsLoaded(true);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      // Fallback to defaults
      setEmailNotification(true);
      setTelegramNotification(false);
      setIsWeatherAlertEnabled(false);
      setIsSensorAlertEnabled(false);
      setCheckInterval(15);
      setWaterLevelThreshold(50);
      setRiskLevelThreshold(1);
      setNotificationLoaded(true);
      setSettingsLoaded(true);
    }
  };

  // Save auto-alert settings to database
  const saveAutoAlertSettings = async (overrides = {}) => {
    if (!user?.uid || !settingsLoaded) return;

    try {
      const settings = {
        isWeatherAlertEnabled:
          overrides.isWeatherAlertEnabled ?? isWeatherAlertEnabled,
        isSensorAlertEnabled:
          overrides.isSensorAlertEnabled ?? isSensorAlertEnabled,
        checkInterval: overrides.checkInterval ?? checkInterval,
        waterLevelThreshold:
          overrides.waterLevelThreshold ?? waterLevelThreshold,
        riskLevelThreshold: overrides.riskLevelThreshold ?? riskLevelThreshold,
      };

      await userProfileService.updateAutoAlertSettings(user.uid, settings);
      console.log("💾 Auto-alert settings saved to database:", settings);
    } catch (error) {
      console.error("❌ Error saving auto-alert settings:", error);
    }
  };

  // Log trạng thái khi thay đổi
  useEffect(() => {
    console.log("═══════════════════════════════════════");
    console.log("🤖 HỆ THỐNG CẢNH BÁO TỰ ĐỘNG");
    console.log("═══════════════════════════════════════");
    console.log(
      `🌦️  Cảnh báo Thời tiết: ${isWeatherAlertEnabled ? "✅ BẬT" : "❌ TẮT"}`
    );
    console.log(
      `🌊 Cảnh báo Sensor IoT: ${isSensorAlertEnabled ? "✅ BẬT" : "❌ TẮT"}`
    );
    console.log(`⏱️  Kiểm tra mỗi: ${checkInterval} phút`);
    console.log(`💧 Ngưỡng mực nước: ${waterLevelThreshold}cm`);
    console.log(`⚠️  Mức độ rủi ro tối thiểu: ${riskLevelThreshold}`);
    console.log("═══════════════════════════════════════");
  }, [
    isWeatherAlertEnabled,
    isSensorAlertEnabled,
    checkInterval,
    waterLevelThreshold,
    riskLevelThreshold,
  ]);

  // Throttle state - chỉ cho phép gọi API 1 lần mỗi phút
  const lastApiCallRef = React.useRef(null);
  const MIN_INTERVAL_MS = 60000; // 1 phút

  // Load lastApiCall từ localStorage khi mount
  React.useEffect(() => {
    const savedLastCall = localStorage.getItem("autoAlert_lastApiCall");
    if (savedLastCall) {
      lastApiCallRef.current = parseInt(savedLastCall, 10);
      console.log(
        "📥 Loaded last API call from storage:",
        new Date(lastApiCallRef.current).toLocaleTimeString()
      );
    }
  }, []);

  // Setup auto check interval
  useEffect(() => {
    const isAnyAlertEnabled = isWeatherAlertEnabled || isSensorAlertEnabled;

    if (!isAnyAlertEnabled || !user) {
      setNextCheck(null);
      return;
    }

    // ❌ KHÔNG reset throttle khi reload trang
    // ✅ CHỈ reset khi user toggle thủ công (xem toggleWeatherAlert/toggleSensorAlert)
    console.log("⏰ Bắt đầu auto check interval (giữ nguyên throttle)");

    // Đảm bảo interval không nhỏ hơn 1 phút
    const intervalMs = Math.max(checkInterval * 60 * 1000, MIN_INTERVAL_MS);

    console.log(`⏰ Interval: ${intervalMs / 1000}s (${checkInterval} phút)`);

    // ✅ Định nghĩa performAutoCheck TRONG useEffect để luôn có access đến state mới nhất
    const performAutoCheck = async () => {
      if (!user) return;

      const isAnyAlertEnabled = isWeatherAlertEnabled || isSensorAlertEnabled;
      if (!isAnyAlertEnabled) return;

      // 🚫 THROTTLE: Kiểm tra xem đã gọi trong vòng 1 phút chưa
      const now = Date.now();
      if (
        lastApiCallRef.current &&
        now - lastApiCallRef.current < MIN_INTERVAL_MS
      ) {
        console.log("⏸️ Throttled: Chờ 1 phút trước khi gọi API tiếp theo");
        return;
      }

      console.log("🔄 Auto checking alerts...");
      console.log(
        `📊 Trạng thái: Weather=${
          isWeatherAlertEnabled ? "✅" : "❌"
        }, Sensor=${isSensorAlertEnabled ? "✅" : "❌"}`
      );
      lastApiCallRef.current = now; // Cập nhật thời gian gọi API
      localStorage.setItem("autoAlert_lastApiCall", now.toString()); // Lưu vào localStorage

      const checkTime = new Date();
      setLastCheck(checkTime);

      try {
        let locationAlerts = 0;
        let sensorAlerts = [];
        let skippedSensors = 0;

        // ============================================
        // 1️⃣ CHECK WEATHER-BASED ALERTS (Nếu bật)
        // ============================================
        if (isWeatherAlertEnabled) {
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          console.log(
            "🌦️ AUTO ALERT - WEATHER: Đang kiểm tra từ OpenWeather API..."
          );
          const locationResult = await checkLocationsAndAlert(
            riskLevelThreshold,
            true
          );
          locationAlerts = locationResult.alerts?.length || 0;
          console.log(
            `✅ AUTO ALERT - WEATHER: ${locationAlerts} cảnh báo đã gửi`
          );
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        } else {
          console.log("⏭️ AUTO ALERT - WEATHER: Đã tắt, bỏ qua");
        }

        // ============================================
        // 2️⃣ CHECK SENSOR ALERTS (Nếu bật)
        // ============================================
        if (isSensorAlertEnabled) {
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          console.log(
            "🌊 AUTO ALERT - SENSOR: Kiểm tra locations gần sensors..."
          );

          try {
            // ✅ Gọi API kiểm tra locations với sensor data
            const sensorResult =
              await personalizedAlertApi.checkSensorBasedAlert(
                user.uid,
                true // sendEmail
              );

            const affectedLocations = sensorResult.affectedLocations || 0;
            console.log(
              `✅ AUTO ALERT - SENSOR: ${affectedLocations} locations bị ảnh hưởng`
            );
            sensorAlerts = sensorResult.alerts || [];
          } catch (err) {
            console.error("❌ AUTO ALERT - SENSOR: Lỗi kiểm tra:", err);
          }

          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        } else if (isSensorAlertEnabled) {
          console.log("⏭️ AUTO ALERT - SENSOR: Bật nhưng đang kiểm tra...");
        } else {
          console.log("⏭️ AUTO ALERT - SENSOR: Đã tắt, bỏ qua");
        }

        // Update stats
        const totalAlerts = locationAlerts + sensorAlerts.length;

        setStats((prev) => ({
          totalChecks: prev.totalChecks + 1,
          alertsSent: prev.alertsSent + totalAlerts,
          alertsSkipped: prev.alertsSkipped + skippedSensors,
          lastAlertTime: totalAlerts > 0 ? checkTime : prev.lastAlertTime,
        }));

        console.log(
          `✅ Auto check hoàn thành: ${totalAlerts} cảnh báo đã gửi (Weather: ${locationAlerts}, Sensor: ${sensorAlerts.length})`
        );
      } catch (error) {
        console.error("❌ Auto check failed:", error);
      }
    };

    // Chỉ chạy check đầu tiên
    performAutoCheck();

    // Setup interval cho các lần sau
    const intervalId = setInterval(() => {
      console.log(`🔔 Đã đến lúc check (sau ${checkInterval} phút)`);
      performAutoCheck();
    }, intervalMs);

    return () => {
      console.log("🛑 Stopping auto check interval");
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isWeatherAlertEnabled,
    isSensorAlertEnabled,
    user,
    checkInterval,
    riskLevelThreshold,
  ]); // ❌ Bỏ checkLocationsAndAlert vì gây re-render liên tục!

  // Handlers for UI
  const toggleWeatherAlert = () => {
    if (!user) {
      alert("Vui lòng đăng nhập để sử dụng tính năng này!");
      return;
    }

    // Chờ notification settings load xong
    if (!notificationLoaded) {
      alert("⏳ Đang tải cài đặt thông báo, vui lòng đợi...");
      return;
    }

    // ⚠️ Kiểm tra notification settings
    if (!isWeatherAlertEnabled && !emailNotification && !telegramNotification) {
      alert(
        "❌ Bạn phải bật ít nhất 1 dịch vụ thông báo (Email hoặc Telegram) trong trang Cài đặt trước khi bật cảnh báo tự động!"
      );
      return;
    }

    // ✅ Weather alert KHÔNG cần locations, chỉ cần API thời tiết
    const newState = !isWeatherAlertEnabled;
    setIsWeatherAlertEnabled(newState);
    console.log(`🌦️ Cảnh báo Thời tiết: ${newState ? "✅ BẬT" : "❌ TẮT"}`);

    // 🔄 RESET throttle khi bật/tắt thủ công
    if (newState) {
      lastApiCallRef.current = null;
      localStorage.removeItem("autoAlert_lastApiCall");
      console.log("🔄 Reset throttle - Sẽ check ngay khi bật");
    }

    // Lưu vào database
    saveAutoAlertSettings({ isWeatherAlertEnabled: newState });
  };

  const toggleSensorAlert = () => {
    if (!user) {
      alert("Vui lòng đăng nhập để sử dụng tính năng này!");
      return;
    }

    // Chờ notification settings load xong
    if (!notificationLoaded) {
      alert("⏳ Đang tải cài đặt thông báo, vui lòng đợi...");
      return;
    }

    // ⚠️ Kiểm tra notification settings
    if (!isSensorAlertEnabled && !emailNotification && !telegramNotification) {
      alert(
        "❌ Bạn phải bật ít nhất 1 dịch vụ thông báo (Email hoặc Telegram) trong trang Cài đặt trước khi bật cảnh báo tự động!"
      );
      return;
    }

    // ✅ Sensor alert CẦN locations để kiểm tra khoảng cách
    if (!isSensorAlertEnabled && locations.length === 0) {
      alert(
        "Bạn chưa có địa điểm nào! Vui lòng thêm địa điểm trong trang Cảnh báo khu vực để nhận cảnh báo từ sensor."
      );
      return;
    }
    const newState = !isSensorAlertEnabled;
    setIsSensorAlertEnabled(newState);
    console.log(`🌊 Cảnh báo Sensor IoT: ${newState ? "✅ BẬT" : "❌ TẮT"}`);

    // 🔄 RESET throttle khi bật/tắt thủ công
    if (newState) {
      lastApiCallRef.current = null;
      localStorage.removeItem("autoAlert_lastApiCall");
      console.log("🔄 Reset throttle - Sẽ check ngay khi bật");
    }

    // Lưu vào database
    saveAutoAlertSettings({ isSensorAlertEnabled: newState });
  };

  // Helper to map risk level to string for UI
  const getAlertLevelString = () => {
    if (riskLevelThreshold === 1) return "warning";
    if (riskLevelThreshold === 2) return "danger";
    if (riskLevelThreshold === 3) return "emergency";
    return "warning";
  };

  const handleAlertLevelChange = (level) => {
    let newThreshold;
    if (level === "warning") newThreshold = 1;
    if (level === "danger") newThreshold = 2;
    if (level === "emergency") newThreshold = 3;

    setRiskLevelThreshold(newThreshold);

    // Lưu vào database ngay với giá trị mới
    saveAutoAlertSettings({ riskLevelThreshold: newThreshold });
  };

  return (
    <div className="w-full relative flex flex-col items-center justify-center p-0 font-sans text-slate-800 selection:bg-indigo-200 selection:text-indigo-900">
      {/* Loading State */}
      {!settingsLoaded && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="glass-panel p-8 rounded-3xl flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-slate-600 font-medium">Đang tải cài đặt...</p>
          </div>
        </div>
      )}

      {/* --- MAIN CONTAINER --- */}
      <div className="w-full relative z-10">
        {/* 1. SYSTEM STATUS CARD (Top) */}
        <div className="glass-panel w-full rounded-3xl p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:shadow-indigo-200/40 hover:shadow-2xl">
          <div className="flex items-center gap-5 w-full md:w-auto">
            {/* Robot Icon Container */}
            <div
              className={`relative w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${
                isWeatherAlertEnabled || isSensorAlertEnabled
                  ? "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/30"
                  : "bg-slate-200"
              }`}
            >
              <div className="absolute inset-0 bg-white/20 rounded-2xl backdrop-blur-[1px]"></div>
              <img
                src={`https://api.dicebear.com/7.x/bottts/svg?seed=${
                  isWeatherAlertEnabled || isSensorAlertEnabled
                    ? "HappyBot"
                    : "SleepyBot"
                }`}
                alt="Robot"
                className="w-16 h-16 relative z-10 drop-shadow-md transition-transform duration-300 hover:scale-110"
              />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-1">
                Hệ thống Cảnh báo Tự động
              </h2>
              <p className="text-slate-500 text-sm font-medium">
                Robot sẽ tự động quét dữ liệu và gửi email khi đạt ngưỡng.
              </p>
            </div>
          </div>

          {/* Toggle Switches - 2 separate toggles */}
          <div className="flex flex-col gap-3">
            {/* Weather Alert Toggle */}
            <div className="flex items-center gap-3 bg-white/40 px-4 py-2 rounded-xl border border-white/60 backdrop-blur-md shadow-sm">
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-700">
                  🌦️ Cảnh báo Thời tiết
                </div>
                <div className="text-[10px] text-slate-500">
                  API OpenWeather
                </div>
              </div>
              <button
                onClick={toggleWeatherAlert}
                className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-300 flex items-center ${
                  isWeatherAlertEnabled ? "bg-blue-500" : "bg-slate-300"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                    isWeatherAlertEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                ></div>
              </button>
            </div>

            {/* Sensor Alert Toggle */}
            <div className="flex items-center gap-3 bg-white/40 px-4 py-2 rounded-xl border border-white/60 backdrop-blur-md shadow-sm">
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-700">
                  🌊 Cảnh báo Sensor
                </div>
                <div className="text-[10px] text-slate-500">ESP32 IoT</div>
              </div>
              <button
                onClick={toggleSensorAlert}
                className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-300 flex items-center ${
                  isSensorAlertEnabled ? "bg-cyan-500" : "bg-slate-300"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                    isSensorAlertEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                ></div>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* 2. USER PROFILE CARD (Left - 5 Cols) */}
          <div className="md:col-span-5 glass-panel rounded-3xl p-8 flex flex-col h-full relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:scale-110"></div>

            <h3 className="text-lg font-bold text-slate-700 mb-8 flex items-center gap-2">
              <UserIcon size={20} className="text-indigo-500" /> Hồ sơ người
              dùng
            </h3>
            <div className="flex-1 flex flex-col items-center justify-center mb-8">
              <div className="w-28 h-28 rounded-full p-1.5 bg-gradient-to-tr from-indigo-400 to-pink-400 mb-4 shadow-lg shadow-indigo-200">
                <div className="w-full h-full rounded-full bg-white p-1 overflow-hidden">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center">
                      <UserIcon size={48} className="text-slate-400" />
                    </div>
                  )}
                </div>
              </div>
              <h4 className="text-2xl font-bold text-slate-800 mb-1">
                {user?.displayName || user?.email?.split("@")[0] || "Guest"}
              </h4>
              <div className="px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-medium flex items-center gap-2">
                <Mail size={14} />
                {user?.email || "No email"}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-200/60">
              <div className="bg-white/50 rounded-2xl p-4 text-center border border-white/60 hover:bg-white/80 transition-colors">
                <div className="text-3xl font-bold text-slate-800 mb-1">
                  {locations.length}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
                  <MapPin size={10} /> Địa điểm
                </div>
              </div>
              <div className="bg-white/50 rounded-2xl p-4 text-center border border-white/60 hover:bg-white/80 transition-colors">
                <div
                  className={`text-lg font-bold mb-1 ${
                    isWeatherAlertEnabled || isSensorAlertEnabled
                      ? "text-green-600"
                      : "text-slate-400"
                  }`}
                >
                  {isWeatherAlertEnabled || isSensorAlertEnabled
                    ? "Active"
                    : "Inactive"}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
                  <Activity size={10} /> Trạng thái
                </div>
              </div>
            </div>
          </div>

          {/* 3. SETTINGS CARD (Right - 7 Cols) */}
          <div className="md:col-span-7 glass-panel rounded-3xl p-8 h-full">
            <h3 className="text-lg font-bold text-slate-700 mb-8 flex items-center gap-2">
              <Settings size={20} className="text-indigo-500" /> Thiết lập thông
              số
            </h3>
            <div className="space-y-8">
              {/* Frequency Input */}
              <div className="group">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">
                  Tần suất kiểm tra
                </label>
                <div
                  className="flex items-center gap-3 px-4 py-4 rounded-xl transition-all hover:bg-white/60"
                  style={{
                    background: "rgba(255, 255, 255, 0.4)",
                    border: "1px solid rgba(255, 255, 255, 0.5)",
                  }}
                >
                  <Clock size={18} className="text-indigo-500 flex-shrink-0" />
                  <select
                    value={checkInterval}
                    onChange={(e) => {
                      const newValue = Number(e.target.value);
                      console.log(
                        "🔄 User changed checkInterval from",
                        checkInterval,
                        "to",
                        newValue,
                        "minutes"
                      );
                      setCheckInterval(newValue);
                      saveAutoAlertSettings({ checkInterval: newValue });
                    }}
                    disabled={isWeatherAlertEnabled || isSensorAlertEnabled}
                    className="flex-1 bg-transparent text-slate-700 font-semibold appearance-none cursor-pointer outline-none border-none disabled:opacity-50"
                  >
                    <option value="1">Mỗi 1 phút</option>
                    <option value="3">Mỗi 3 phút</option>
                    <option value="5">Mỗi 5 phút</option>
                    <option value="15">Mỗi 15 phút</option>
                    <option value="30">Mỗi 30 phút</option>
                    <option value="60">Mỗi 1 giờ</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="text-slate-400 flex-shrink-0"
                  />
                </div>
              </div>

              {/* Water Level Input - CHỈ cho Sensor Alert */}
              <div className="group">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">
                  🌊 Ngưỡng nước kích hoạt (cm) - Sensor IoT
                </label>
                <div
                  className="flex items-center gap-3 px-4 py-4 rounded-xl transition-all hover:bg-white/60"
                  style={{
                    background: "rgba(255, 255, 255, 0.4)",
                    border: "1px solid rgba(255, 255, 255, 0.5)",
                  }}
                >
                  <Waves size={18} className="text-cyan-500 flex-shrink-0" />
                  <input
                    type="number"
                    value={waterLevelThreshold}
                    onChange={(e) => {
                      const newValue = Number(e.target.value);
                      setWaterLevelThreshold(newValue);
                      saveAutoAlertSettings({ waterLevelThreshold: newValue });
                    }}
                    disabled={isSensorAlertEnabled}
                    className="flex-1 bg-transparent text-slate-700 font-bold placeholder-slate-400 outline-none border-none disabled:opacity-50"
                  />
                  <span className="text-sm font-bold text-slate-400 flex-shrink-0">
                    cm
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 ml-1">
                  Áp dụng cho cảnh báo từ sensor ESP32 trong Firebase
                </p>
              </div>

              {/* Alert Level Selector - CHỈ cho Weather Alert */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">
                  🌦️ Mức độ cảnh báo - Thời tiết
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {/* Level 1: Warning */}
                  <button
                    onClick={() => handleAlertLevelChange("warning")}
                    disabled={isWeatherAlertEnabled}
                    className={`relative overflow-hidden py-3 px-2 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center gap-1 disabled:opacity-50 ${
                      riskLevelThreshold === 1
                        ? "bg-yellow-100/80 border-yellow-400 text-yellow-700 shadow-sm"
                        : "bg-white/40 border-white/60 text-slate-500 hover:bg-white/60"
                    }`}
                  >
                    <span className="text-sm font-bold">Cảnh báo+</span>
                    {riskLevelThreshold === 1 && (
                      <div className="absolute bottom-0 w-full h-1 bg-yellow-400"></div>
                    )}
                  </button>

                  {/* Level 2: Danger */}
                  <button
                    onClick={() => handleAlertLevelChange("danger")}
                    disabled={isWeatherAlertEnabled}
                    className={`relative overflow-hidden py-3 px-2 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center gap-1 disabled:opacity-50 ${
                      riskLevelThreshold === 2
                        ? "bg-orange-100/80 border-orange-400 text-orange-700 shadow-sm"
                        : "bg-white/40 border-white/60 text-slate-500 hover:bg-white/60"
                    }`}
                  >
                    <span className="text-sm font-bold">Nguy hiểm+</span>
                    {riskLevelThreshold === 2 && (
                      <div className="absolute bottom-0 w-full h-1 bg-orange-400"></div>
                    )}
                  </button>

                  {/* Level 3: Emergency */}
                  <button
                    onClick={() => handleAlertLevelChange("emergency")}
                    disabled={isWeatherAlertEnabled}
                    className={`relative overflow-hidden py-3 px-2 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center gap-1 disabled:opacity-50 ${
                      riskLevelThreshold === 3
                        ? "bg-red-100/80 border-red-400 text-red-700 shadow-sm"
                        : "bg-white/40 border-white/60 text-slate-500 hover:bg-white/60"
                    }`}
                  >
                    <span className="text-sm font-bold">Khẩn cấp</span>
                    {riskLevelThreshold === 3 && (
                      <div className="absolute bottom-0 w-full h-1 bg-red-400"></div>
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 ml-1">
                  Chọn cảnh báo và bật tính năng " Cảnh báo thời tiết " để áp
                  dụng
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- CSS IN JS (For specific glass effects) --- */}
      <style>{`
        .glass-panel {
          background: rgba(255, 255, 255, 0.65);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.05);
        }
        .glass-input {
          background: rgba(255, 255, 255, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.5);
          outline: none;
        }
        .glass-input:focus {
          border-color: #818cf8;
          box-shadow: 0 0 0 4px rgba(129, 140, 248, 0.1);
        }
      `}</style>
    </div>
  );
};

export default AutoAlertSystem;
