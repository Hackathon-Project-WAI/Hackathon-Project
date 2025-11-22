import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  MapPin,
  Settings,
  LogOut,
  Calendar,
  Mail,
  ShieldCheck,
  Home,
  Plus,
  Trash2,
  Activity,
  Bell,
  ChevronRight,
  ArrowLeft,
  X,
  Briefcase,
  GraduationCap,
  Stethoscope,
  Store,
  Dumbbell,
  Coffee,
  Users,
  MoreHorizontal,
  AlertTriangle,
} from "lucide-react";
import authService from "../services/authService";
import userProfileService from "../services/userProfileService";
import { useHereSearch } from "../hooks/useHereSearch";
import { getFloodZonesAtPoint } from "../utils/floodCalculations";
import floodData from "../data/floodProneAreas.json";
import "./Profile.css";

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("overview");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("home");

  // Data states
  const [locations, setLocations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Form states for adding location
  const [newLocName, setNewLocName] = useState("");
  const [newLocAddress, setNewLocAddress] = useState("");
  const [isAddingLoc, setIsAddingLoc] = useState(false);

  // HERE Maps autocomplete states
  const [addressQuery, setAddressQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [floodWarning, setFloodWarning] = useState(null);
  const addressInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Notification Settings
  const [emailNotification, setEmailNotification] = useState(null);
  const [telegramNotification, setTelegramNotification] = useState(null);
  const [notificationLoaded, setNotificationLoaded] = useState(false);

  // HERE Maps API
  const API_KEY = process.env.REACT_APP_HERE_API_KEY || "";
  const { suggestions, autocomplete, lookup, clearSuggestions } =
    useHereSearch(API_KEY);

  // Location Categories configuration
  const locationCategories = [
    { id: "home", label: "Nhà", icon: <Home size={20} /> },
    { id: "work", label: "Công ty", icon: <Briefcase size={20} /> },
    { id: "school", label: "Trường học", icon: <GraduationCap size={20} /> },
    { id: "hospital", label: "Bệnh viện", icon: <Stethoscope size={20} /> },
    { id: "store", label: "Cửa hàng", icon: <Store size={20} /> },
    { id: "gym", label: "Phòng Gym", icon: <Dumbbell size={20} /> },
    { id: "cafe", label: "Quán Cafe", icon: <Coffee size={20} /> },
    { id: "family", label: "Nhà người thân", icon: <Users size={20} /> },
    { id: "other", label: "Khác", icon: <MoreHorizontal size={20} /> },
  ];

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate("/login");
      return;
    }
    setUser(currentUser);
    loadUserProfile(currentUser.uid);
  }, [navigate]);

  useEffect(() => {
    if (user?.uid) {
      if (activeTab === "overview") {
        loadLocations();
      } else if (activeTab === "activity") {
        loadActivities();
      }
    }
  }, [user, activeTab]);

  const loadUserProfile = async (userId) => {
    setLoading(true);
    try {
      const result = await userProfileService.getUserProfile(userId);
      if (result.success) {
        setProfile(result.data);
        // Load notification settings
        if (result.data.notificationSettings) {
          setEmailNotification(result.data.notificationSettings.email ?? true);
          setTelegramNotification(
            result.data.notificationSettings.telegram ?? false
          );
        } else {
          // Default settings nếu chưa có
          setEmailNotification(true);
          setTelegramNotification(false);
        }
        setNotificationLoaded(true);
      } else {
        // Default profile
        setProfile({
          stats: { savedLocationsCount: 0, alertsReceived: 0, floodReports: 0 },
        });
        setEmailNotification(true);
        setTelegramNotification(false);
        setNotificationLoaded(true);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      // Fallback to default
      setEmailNotification(true);
      setTelegramNotification(false);
      setNotificationLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    if (!user?.uid) return;
    setLoadingLocations(true);
    const result = await userProfileService.getLocations(user.uid);
    if (result.success) {
      setLocations(result.data);
    }
    setLoadingLocations(false);
  };

  const loadActivities = async () => {
    if (!user?.uid) return;
    setLoadingActivities(true);
    const result = await userProfileService.getActivityHistory(user.uid);
    if (result.success) {
      setActivities(result.data);
    }
    setLoadingActivities(false);
  };

  const saveNotificationSettings = async (email, telegram) => {
    if (!user?.uid) return;
    try {
      const result = await userProfileService.updateNotificationSettings(
        user.uid,
        {
          email,
          telegram,
        }
      );
      if (result.success) {
        console.log("✅ Notification settings saved");
      }
    } catch (error) {
      console.error("❌ Error saving notification settings:", error);
    }
  };

  const handleEmailToggle = () => {
    const newValue = !emailNotification;
    setEmailNotification(newValue);
    saveNotificationSettings(newValue, telegramNotification);
  };

  const handleTelegramToggle = () => {
    const newValue = !telegramNotification;
    setTelegramNotification(newValue);
    saveNotificationSettings(emailNotification, newValue);
  };

  const handleLogout = async () => {
    const result = await authService.logout();
    if (result.success) {
      navigate("/login");
    }
  };

  // Handle address input change with HERE Maps autocomplete
  const handleAddressChange = (value) => {
    console.log("🔍 Address input changed:", value);
    setAddressQuery(value);
    setNewLocAddress(value);
    setSelectedLocation(null);

    if (value.length >= 2) {
      console.log("🔎 Calling autocomplete for:", value);
      autocomplete(value, { lat: 16.0544, lng: 108.2022 });
      setShowSuggestions(true);
    } else {
      clearSuggestions();
      setShowSuggestions(false);
    }
  };

  // Handle suggestion select
  const handleSelectSuggestion = async (suggestion) => {
    console.log("📍 Selected suggestion:", suggestion);

    let position = suggestion.position;

    if (!position && suggestion.locationId) {
      const lookupResult = await lookup(suggestion.locationId);
      if (lookupResult) {
        position = { lat: lookupResult.lat, lng: lookupResult.lng };
      }
    }

    if (!position) {
      alert("Không thể lấy tọa độ cho địa điểm này");
      return;
    }

    // Dùng địa chỉ gốc từ HERE Maps
    const fullAddress = suggestion.address || suggestion.title;

    console.log("🗺️ Địa chỉ đã chọn:", {
      fullAddress,
      lat: position.lat,
      lng: position.lng,
    });

    // Check nếu địa điểm nằm trong vùng ngập
    const floodZones = getFloodZonesAtPoint(
      position.lat,
      position.lng,
      floodData.floodPrones || []
    );

    console.log("🔍 Kết quả check vùng ngập:", {
      totalFloodZones: floodData.floodPrones?.length || 0,
      foundFloodZones: floodZones.length,
      floodZones: floodZones,
    });

    if (floodZones.length > 0) {
      console.log("⚠️ CẢNH BÁO: Địa điểm nằm trong vùng ngập!", floodZones);
      setFloodWarning({
        zones: floodZones,
        message: `Địa điểm này nằm trong ${floodZones.length} vùng ngập lụt!`,
      });

      // Hiển thị alert để user nhận biết
      const zoneNames = floodZones.map((z) => z.name).join(", ");
      alert(
        `⚠️ CẢNH BÁO VÙNG NGẬP!\n\nĐịa điểm này nằm trong ${floodZones.length} vùng ngập lụt:\n${zoneNames}\n\nHãy cân nhắc kỹ trước khi lưu.`
      );
    } else {
      console.log("✅ Địa điểm an toàn, không nằm trong vùng ngập");
      setFloodWarning(null);
    }

    setAddressQuery(fullAddress);
    setNewLocAddress(fullAddress);
    setSelectedLocation({
      lat: position.lat,
      lng: position.lng,
      address: fullAddress,
      floodZones: floodZones,
    });

    clearSuggestions();
    setShowSuggestions(false);
  };

  // Handle add location
  const handleAddLocation = async (e) => {
    e.preventDefault();
    if (!newLocName || !newLocAddress) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (!selectedLocation) {
      alert("Vui lòng chọn địa chỉ từ danh sách gợi ý");
      return;
    }

    setIsAddingLoc(true);

    // Xác định status dựa trên flood zones
    let locationStatus = "safe";
    let alertStatus = null;

    console.log(
      "💾 Đang lưu location với floodZones:",
      selectedLocation.floodZones
    );

    if (selectedLocation.floodZones && selectedLocation.floodZones.length > 0) {
      // Có vùng ngập - xác định mức độ nguy hiểm cao nhất
      const hasHighRisk = selectedLocation.floodZones.some(
        (z) => z.riskLevel === "high"
      );
      const hasMediumRisk = selectedLocation.floodZones.some(
        (z) => z.riskLevel === "medium"
      );

      if (hasHighRisk) {
        locationStatus = "critical";
        alertStatus = "critical";
      } else if (hasMediumRisk) {
        locationStatus = "danger";
        alertStatus = "danger";
      } else {
        locationStatus = "warning";
        alertStatus = "warning";
      }

      console.log(
        `🚨 Địa điểm có ${selectedLocation.floodZones.length} vùng ngập - Status: ${locationStatus}`
      );
    } else {
      console.log("✅ Lưu địa điểm an toàn - Status: safe");
    }

    const newLocation = {
      name: newLocName,
      address: newLocAddress,
      type: selectedCategory,
      coords: {
        lat: selectedLocation.lat,
        lon: selectedLocation.lng,
      },
      alertRadius: 1000,
      priority: "medium",
      last_alert_status: alertStatus, // Thêm status cho PersonalizedAlertDemo
    };

    console.log("🔵 Đang lưu địa điểm:", newLocation);

    const result = await userProfileService.addLocation(user.uid, newLocation);
    console.log("🔵 Kết quả lưu:", result);

    if (result.success) {
      await userProfileService.addActivity(user.uid, {
        type: "location_added",
        title: `Thêm địa điểm "${newLocName}"`,
        description: `Đã lưu địa điểm mới vào danh sách theo dõi`,
      });

      loadLocations();
      loadUserProfile(user.uid);
      setShowAddModal(false);
      setNewLocName("");
      setNewLocAddress("");
      setAddressQuery("");
      setSelectedLocation(null);
      setSelectedCategory("home");
      alert("✅ Đã lưu địa điểm thành công!");
    } else {
      console.error("❌ Lỗi lưu địa điểm:", result.error);
      alert(`❌ Không thể lưu: ${result.error}`);
    }
    setIsAddingLoc(false);
  };

  const handleDeleteLocation = async (locationId, locationName) => {
    if (!window.confirm(`Bạn có chắc muốn xóa địa điểm "${locationName}"?`))
      return;

    const result = await userProfileService.deleteLocation(
      user.uid,
      locationId
    );
    if (result.success) {
      await userProfileService.addActivity(user.uid, {
        type: "location_deleted",
        title: `Xóa địa điểm "${locationName}"`,
        description: `Đã xóa khỏi danh sách theo dõi`,
      });
      loadLocations();
      loadUserProfile(user.uid);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Gần đây";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days === 0) return "Hôm nay";
    if (days === 1) return "Hôm qua";
    if (days < 7) return `${days} ngày trước`;
    return `${Math.floor(days / 30)} tháng trước`;
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EEF2FF]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative p-4 md:p-8 font-sans text-slate-700 selection:bg-indigo-100 selection:text-indigo-900 bg-[#EEF2FF]">
      {/* --- LIGHT BACKGROUND EFFECTS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-400/30 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-400/30 rounded-full blur-[100px] animate-pulse delay-1000"></div>
        <div className="absolute top-[40%] left-[40%] w-80 h-80 bg-pink-400/20 rounded-full blur-[80px] animate-pulse delay-500"></div>
      </div>

      {/* --- MAIN CONTAINER --- */}
      <div className="w-full max-w-6xl mx-auto relative z-10 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/60 hover:bg-white text-slate-600 font-bold transition-all backdrop-blur-md shadow-sm border border-white/60"
          >
            <ArrowLeft size={18} /> Quay lại bản đồ
          </button>
          <h1 className="text-2xl font-bold text-indigo-900 hidden md:block">
            Trung tâm cá nhân
          </h1>
          <div className="w-[100px]"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* --- LEFT COLUMN: USER INFO --- */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="glass-panel rounded-3xl p-8 relative overflow-hidden text-center group bg-white/40 border border-white/60">
              {/* Header Banner Gradient */}
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-100/50 to-transparent"></div>

              <div className="relative mx-auto w-32 h-32 mb-4">
                <div className="absolute inset-0 bg-indigo-300 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="User Avatar"
                    className="relative w-full h-full rounded-full border-4 border-white shadow-xl object-cover bg-indigo-50"
                  />
                ) : (
                  <div className="relative w-full h-full rounded-full border-4 border-white shadow-xl bg-indigo-50 flex items-center justify-center text-indigo-400">
                    <User size={48} />
                  </div>
                )}

                <div className="absolute bottom-1 right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md text-indigo-600 cursor-pointer hover:bg-indigo-50 border border-slate-100">
                  <Settings size={16} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-1">
                {user.displayName || "Người dùng"}
              </h2>
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-4">
                <Mail size={14} /> {user.email}
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-indigo-600 font-medium bg-indigo-50 py-1.5 px-4 rounded-full inline-flex mb-8 mx-auto border border-indigo-100">
                <Calendar size={12} /> Tham gia: Tháng 11, 2025
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                <div className="p-3 rounded-2xl bg-white/60 border border-white/60 shadow-sm hover:shadow-md transition-all">
                  <div className="text-xl font-bold text-indigo-600">
                    {profile?.stats?.savedLocationsCount || 0}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                    Địa điểm
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-white/60 border border-white/60 shadow-sm hover:shadow-md transition-all">
                  <div className="text-xl font-bold text-orange-500">
                    {profile?.stats?.alertsReceived || 0}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                    Cảnh báo
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-white/60 border border-white/60 shadow-sm hover:shadow-md transition-all">
                  <div className="text-xl font-bold text-blue-500">
                    {profile?.stats?.floodReports || 0}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                    Báo cáo
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button className="w-full py-3 rounded-xl bg-white/70 border border-white/60 text-slate-600 font-bold text-sm hover:bg-white hover:text-indigo-600 hover:shadow-md transition-all flex items-center justify-center gap-2">
                  <Settings size={18} /> Cài đặt tài khoản
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold text-sm shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  <LogOut size={18} /> Đăng xuất
                </button>
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN: TABS & CONTENT --- */}
          <div className="lg:col-span-8">
            <div className="glass-panel rounded-3xl min-h-[600px] flex flex-col overflow-hidden bg-white/40 border border-white/60">
              {/* Tab Navigation */}
              <div className="flex border-b border-slate-200/60 px-6 pt-6 bg-white/30 backdrop-blur-sm">
                {["overview", "activity", "settings"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 px-6 text-sm font-bold relative transition-colors capitalize ${
                      activeTab === tab
                        ? "text-indigo-600"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {tab === "overview"
                      ? "Tổng quan"
                      : tab === "activity"
                      ? "Hoạt động"
                      : "Cài đặt"}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>
                    )}
                  </button>
                ))}
              </div>

              <div className="p-6 md:p-8 flex-1">
                {activeTab === "overview" && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Section Header */}
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <MapPin className="text-indigo-500" size={20} /> Địa
                        điểm đã lưu
                      </h3>

                      {/* Content Container */}
                      <div className="mt-4 space-y-4">
                        {loadingLocations ? (
                          <div className="text-center py-10 text-slate-500">
                            Đang tải địa điểm...
                          </div>
                        ) : (
                          <>
                            {/* Saved Location Items */}
                            {locations.map((loc) => {
                              const category =
                                locationCategories.find(
                                  (c) => c.id === loc.type
                                ) || locationCategories[0];
                              return (
                                <div
                                  key={loc.id}
                                  className="group bg-white/60 border border-white/60 rounded-2xl p-4 flex items-center justify-between hover:bg-white hover:shadow-lg hover:scale-[1.01] transition-all duration-300 cursor-pointer"
                                >
                                  <div className="flex items-center gap-4">
                                    <div
                                      className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-sm border border-white/50 ${
                                        loc.status === "safe"
                                          ? "bg-green-50 text-green-600"
                                          : "bg-orange-50 text-orange-600"
                                      }`}
                                    >
                                      {category.icon}
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-slate-800 text-lg">
                                        {loc.name}
                                      </h4>
                                      <p className="text-sm text-slate-500">
                                        {loc.address}
                                      </p>
                                      <div className="mt-2">
                                        {loc.status === "safe" ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-100 border border-green-200 text-green-700 text-[10px] font-bold uppercase">
                                            <ShieldCheck size={10} /> An toàn
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-100 border border-orange-200 text-orange-700 text-[10px] font-bold uppercase">
                                            <Activity size={10} /> Cảnh báo
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                                    <button className="p-2.5 rounded-xl text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                      <Settings size={20} />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteLocation(loc.id, loc.name)
                                      }
                                      className="p-2.5 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                    >
                                      <Trash2 size={20} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Add New Button */}
                            <button
                              onClick={() => setShowAddModal(true)}
                              className="w-full py-4 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 text-indigo-500 font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 hover:border-indigo-300 transition-all group"
                            >
                              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                <Plus size={18} />
                              </div>
                              <span>Thêm địa điểm mới</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "activity" && (
                  <div className="h-full animate-in fade-in zoom-in-95 duration-300">
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Activity className="text-indigo-500" size={20} /> Lịch
                        sử hoạt động
                      </h3>
                    </div>

                    {loadingActivities ? (
                      <div className="text-center py-10 text-slate-500">
                        Đang tải hoạt động...
                      </div>
                    ) : activities.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
                        <div className="w-20 h-20 bg-white/50 rounded-full flex items-center justify-center mb-4 border border-white/60 shadow-sm">
                          <Activity size={32} />
                        </div>
                        <p>Chưa có hoạt động nào gần đây.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activities.map((activity) => (
                          <div
                            key={activity.id}
                            className="relative pl-8 pb-4 border-l-2 border-indigo-100 last:border-0"
                          >
                            <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-indigo-500 border-4 border-indigo-100"></div>
                            <div className="bg-white/60 border border-white/60 rounded-xl p-4 shadow-sm">
                              <h4 className="font-bold text-slate-800">
                                {activity.title}
                              </h4>
                              <p className="text-sm text-slate-600">
                                {activity.description}
                              </p>
                              <span className="text-xs text-slate-400 mt-2 block">
                                {formatTimestamp(activity.timestamp)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "settings" && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                    {/* Notification Settings Card */}
                    <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/60">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                          <Bell className="text-white" size={20} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">
                            Thông báo
                          </h3>
                          <p className="text-xs text-slate-500">
                            Cấu hình kênh nhận cảnh báo
                          </p>
                        </div>
                      </div>

                      {!notificationLoaded ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Email Toggle */}
                          <div className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-slate-200/50 hover:border-indigo-300 transition-all">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
                                <Mail className="text-white" size={20} />
                              </div>
                              <div>
                                <div className="font-bold text-slate-800">
                                  Email
                                </div>
                                <div className="text-xs text-slate-500">
                                  Nhận cảnh báo qua email
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={handleEmailToggle}
                              className={`relative w-16 h-8 rounded-full transition-colors duration-300 shadow-inner ${
                                emailNotification
                                  ? "bg-gradient-to-r from-green-400 to-emerald-500"
                                  : "bg-slate-300"
                              }`}
                            >
                              <div
                                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                                  emailNotification
                                    ? "translate-x-8"
                                    : "translate-x-0"
                                }`}
                              ></div>
                            </button>
                          </div>

                          {/* Telegram Toggle */}
                          <div className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-slate-200/50 hover:border-blue-300 transition-all">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-md">
                                <svg
                                  className="w-6 h-6 text-white"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                                </svg>
                              </div>
                              <div>
                                <div className="font-bold text-slate-800">
                                  Telegram
                                </div>
                                <div className="text-xs text-slate-500">
                                  Nhận cảnh báo qua Telegram Bot
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={handleTelegramToggle}
                              className={`relative w-16 h-8 rounded-full transition-colors duration-300 shadow-inner ${
                                telegramNotification
                                  ? "bg-gradient-to-r from-blue-400 to-cyan-500"
                                  : "bg-slate-300"
                              }`}
                            >
                              <div
                                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                                  telegramNotification
                                    ? "translate-x-8"
                                    : "translate-x-0"
                                }`}
                              ></div>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Status Info */}
                      {notificationLoaded &&
                        (emailNotification || telegramNotification) && (
                          <div className="mt-4 p-3 bg-indigo-50/50 border border-indigo-200/50 rounded-xl">
                            <div className="flex items-start gap-2 text-xs text-indigo-700">
                              <ShieldCheck
                                size={14}
                                className="mt-0.5 flex-shrink-0"
                              />
                              <span>
                                Bạn đang nhận cảnh báo qua:{" "}
                                <span className="font-bold">
                                  {emailNotification && telegramNotification
                                    ? "Email & Telegram"
                                    : emailNotification
                                    ? "Email"
                                    : "Telegram"}
                                </span>
                              </span>
                            </div>
                          </div>
                        )}

                      {notificationLoaded &&
                        !emailNotification &&
                        !telegramNotification && (
                          <div className="mt-4 p-3 bg-amber-50/50 border border-amber-200/50 rounded-xl">
                            <div className="flex items-start gap-2 text-xs text-amber-700">
                              <Bell
                                size={14}
                                className="mt-0.5 flex-shrink-0"
                              />
                              <span className="font-medium">
                                Bạn chưa bật kênh thông báo nào. Hãy chọn ít
                                nhất 1 kênh để nhận cảnh báo!
                              </span>
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Account Settings Card */}
                    <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/60">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-700 rounded-xl flex items-center justify-center shadow-md">
                          <Settings className="text-white" size={20} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">
                            Tài khoản
                          </h3>
                          <p className="text-xs text-slate-500">
                            Quản lý thông tin cá nhân
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                        <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center mb-3 border border-white/60 shadow-sm">
                          <Settings size={28} />
                        </div>
                        <p className="text-sm">
                          Các tùy chọn khác đang được phát triển
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === ADD LOCATION MODAL with HERE Maps Autocomplete === */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-md transition-opacity"
            onClick={() => {
              setShowAddModal(false);
              setNewLocName("");
              setNewLocAddress("");
              setAddressQuery("");
              setSelectedLocation(null);
              setSelectedCategory("home");
              clearSuggestions();
              setShowSuggestions(false);
            }}
          ></div>

          {/* Modal Content */}
          <div className="bg-white/80 backdrop-blur-2xl w-full max-w-lg rounded-3xl shadow-2xl border border-white/60 p-0 relative z-10 animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200/50 flex justify-between items-center bg-white/50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="text-indigo-600" size={20} /> Thêm địa điểm
                mới
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewLocName("");
                  setNewLocAddress("");
                  setAddressQuery("");
                  setSelectedLocation(null);
                  setSelectedCategory("home");
                  clearSuggestions();
                  setShowSuggestions(false);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors bg-white/50 p-1 rounded-lg hover:bg-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form className="space-y-5" onSubmit={handleAddLocation}>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">
                    Tên địa điểm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newLocName}
                    onChange={(e) => setNewLocName(e.target.value)}
                    placeholder="Ví dụ: Nhà riêng, Công ty..."
                    className="glass-input w-full px-4 py-3 rounded-xl text-slate-700 font-semibold placeholder-slate-400 bg-white/50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  />
                </div>

                <div className="relative">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">
                    Địa chỉ <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={addressInputRef}
                    type="text"
                    value={addressQuery}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    onFocus={() => {
                      if (addressQuery.length >= 2) {
                        autocomplete(addressQuery, {
                          lat: 16.0544,
                          lng: 108.2022,
                        });
                        setShowSuggestions(true);
                      }
                    }}
                    placeholder="Nhập địa chỉ hoặc chọn trên bản đồ"
                    className="glass-input w-full px-4 py-3 rounded-xl text-slate-700 font-medium placeholder-slate-400 bg-white/50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  />

                  {/* Suggestions Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div
                      ref={suggestionsRef}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border-2 border-indigo-200 shadow-xl max-h-64 overflow-y-auto z-50"
                    >
                      {suggestions.map((suggestion, index) => (
                        <div
                          key={suggestion.id || index}
                          className="flex items-start gap-3 p-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors"
                          onClick={() => handleSelectSuggestion(suggestion)}
                        >
                          <MapPin
                            size={16}
                            className="text-indigo-600 mt-1 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-slate-800 text-sm">
                              {suggestion.title}
                            </div>
                            {suggestion.address && (
                              <div className="text-xs text-slate-500 mt-0.5 truncate">
                                {suggestion.address}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {showSuggestions &&
                    suggestions.length === 0 &&
                    addressQuery.length >= 2 && (
                      <div
                        ref={suggestionsRef}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border-2 border-slate-200 shadow-xl p-4 text-center text-slate-500 text-sm z-50"
                      >
                        Không tìm thấy địa điểm
                      </div>
                    )}
                </div>

                {/* Flood Warning Box */}
                {floodWarning && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 shadow-lg animate-pulse">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 shadow-md">
                        <AlertTriangle size={20} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-bold text-orange-900 mb-1">
                          ⚠️ Cảnh báo vùng ngập lụt
                        </h4>
                        <p className="text-sm text-orange-800 font-semibold mb-2">
                          {floodWarning.message}
                        </p>
                        <div className="space-y-1.5 mt-2">
                          {floodWarning.zones.map((zone, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-xs bg-white/60 p-2 rounded-lg border border-orange-200"
                            >
                              <span className="font-bold text-orange-700">
                                {zone.name || `Vùng ${idx + 1}`}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-white font-bold ${
                                  zone.riskLevel === "high"
                                    ? "bg-red-500"
                                    : zone.riskLevel === "medium"
                                    ? "bg-orange-500"
                                    : "bg-yellow-500"
                                }`}
                              >
                                {zone.riskLevel === "high"
                                  ? "Nguy hiểm cao"
                                  : zone.riskLevel === "medium"
                                  ? "Nguy hiểm trung bình"
                                  : "Cảnh báo"}
                              </span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-orange-700 mt-2 font-medium">
                          💡 Địa điểm này có nguy cơ ngập lụt. Hãy cân nhắc thêm
                          bán kính cảnh báo lớn hơn.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Category Grid */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-3 tracking-wide">
                    Loại địa điểm
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {locationCategories.map((cat) => (
                      <div
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border cursor-pointer transition-all duration-200 ${
                          selectedCategory === cat.id
                            ? "bg-indigo-50 border-indigo-500 shadow-md shadow-indigo-100 scale-105"
                            : "bg-white/50 border-transparent hover:bg-white hover:border-indigo-200 hover:shadow-sm"
                        }`}
                      >
                        <div
                          className={`p-2 rounded-full ${
                            selectedCategory === cat.id
                              ? "bg-indigo-500 text-white"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {cat.icon}
                        </div>
                        <span
                          className={`text-xs font-medium ${
                            selectedCategory === cat.id
                              ? "text-indigo-700"
                              : "text-slate-500"
                          }`}
                        >
                          {cat.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200/50 bg-white/50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewLocName("");
                  setNewLocAddress("");
                  setAddressQuery("");
                  setSelectedLocation(null);
                  setSelectedCategory("home");
                  clearSuggestions();
                  setShowSuggestions(false);
                }}
                className="px-6 py-2.5 rounded-xl text-slate-500 font-bold hover:bg-white hover:text-slate-700 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleAddLocation}
                disabled={isAddingLoc}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingLoc ? "Đang lưu..." : "Lưu địa điểm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
