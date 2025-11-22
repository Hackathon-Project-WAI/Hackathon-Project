import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue, set, push, limitToLast, query } from 'firebase/database';
import { db } from '../configs/firebase';
import { 
  LayoutDashboard, 
  Activity, 
  Settings, 
  Users, 
  LogOut, 
  Bell, 
  Cpu, 
  Terminal, 
  Wifi, 
  WifiOff,
  Droplets,
  CloudRain,
  Thermometer,
  Power,
  Save,
  Play,
  Square,
  Sliders,
  Map
} from 'lucide-react';
import './AdminPage.css';

const AdminPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isArduinoConnected, setIsArduinoConnected] = useState(false);
  const [logs, setLogs] = useState([]);
  const logEndRef = useRef(null);
  const [commandInput, setCommandInput] = useState("");

  // State cho dữ liệu cảm biến
  const [sensorData, setSensorData] = useState({
    waterLevel: 0,
    rain: 0,
    temp: 0,
    humidity: 0
  });

  const [controls, setControls] = useState({
    pump: false,
    siren: false,
    autoMode: true
  });

  // --- FIREBASE CONNECTION ---

  // 1. Lắng nghe dữ liệu cảm biến (Realtime)
  useEffect(() => {
    const sensorsRef = ref(db, 'sensors');
    const unsubscribe = onValue(sensorsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSensorData({
          waterLevel: data.waterLevel || 0,
          rain: data.rain || 0,
          temp: data.temp || 0,
          humidity: data.humidity || 0
        });
        setIsArduinoConnected(true); // Có dữ liệu nghĩa là đang kết nối
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Lắng nghe Logs (Serial Monitor)
  useEffect(() => {
    const logsRef = query(ref(db, 'logs'), limitToLast(50));
    const unsubscribe = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert object to array & sort by time
        const logArray = Object.values(data).map(item => 
          `[${new Date(item.timestamp).toLocaleTimeString()}] ${item.message}`
        );
        setLogs(logArray);
      }
    });

    return () => unsubscribe();
  }, []);

  // 3. Lắng nghe trạng thái Controls (Sync với ESP32)
  useEffect(() => {
    const controlsRef = ref(db, 'controls');
    const unsubscribe = onValue(controlsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setControls(prev => ({
          ...prev,
          pump: data.pump || false,
          siren: data.siren || false,
          autoMode: data.autoMode !== false
        }));
      }
    });
    return () => unsubscribe();
  }, []);

  // Auto scroll terminal
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // --- HANDLERS ---

  const handleControlToggle = (key) => {
    const newState = !controls[key];
    // Gửi lệnh lên Firebase
    set(ref(db, `controls/${key}`), newState);
    
    // Log command (Optional: push to logs to see your own action)
    // push(ref(db, 'logs'), {
    //   timestamp: Date.now(),
    //   message: `WEB_ADMIN: Set ${key} to ${newState ? 'ON' : 'OFF'}`
    // });
  };

  const sendSerialCommand = () => {
    if (!commandInput.trim()) return;
    
    // Gửi lệnh vào hàng đợi commands để ESP32 đọc
    push(ref(db, 'commands'), {
      command: commandInput,
      timestamp: Date.now(),
      executed: false
    });

    setCommandInput("");
  };

  const SidebarItem = ({ id, icon, label }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        activeTab === id 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
        : 'text-slate-500 hover:bg-white/50 hover:text-indigo-600'
      }`}
    >
      {icon}
      <span className="font-bold">{label}</span>
    </button>
  );

  return (
    <div className="admin-container flex gap-6 overflow-hidden relative">
       {/* --- BACKGROUND EFFECTS --- */}
       <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-300/30 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-300/30 rounded-full blur-[120px]"></div>
      </div>

      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col z-10">
        <div className="mb-8 flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <Settings size={24} />
            </div>
            <div>
                <h1 className="font-bold text-xl text-slate-800">Admin IoT</h1>
                <p className="text-xs text-slate-500">Control Center</p>
            </div>
        </div>

        <div className="space-y-2 flex-1">
            <SidebarItem id="dashboard" icon={<LayoutDashboard size={20} />} label="Tổng quan" />
            <SidebarItem id="devices" icon={<Cpu size={20} />} label="Thiết bị IoT" />
            <SidebarItem id="system" icon={<Activity size={20} />} label="Hệ thống" />
        </div>

        <button 
            onClick={() => navigate('/')}
            className="mt-auto w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
        >
            <LogOut size={20} />
            <span className="font-bold">Thoát</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-6 z-10 h-[calc(100vh-40px)] overflow-y-auto pr-2 custom-scrollbar">
        
        {/* Top Bar */}
        <div className="flex justify-between items-center admin-glass-panel p-4">
            <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${isArduinoConnected ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                    {isArduinoConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
                    {isArduinoConnected ? "ESP32 Connected" : "Disconnected"}
                </div>
                <span className="text-slate-400 text-sm">Last update: {new Date().toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center gap-3">
                <button className="p-2 rounded-full bg-white/50 hover:bg-white text-slate-600 transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border-2 border-white shadow-md"></div>
            </div>
        </div>

        {/* Content Area */}
        {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* --- SENSOR CARDS --- */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Water Level Card */}
                    <div className="admin-glass-panel p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Droplets size={100} className="text-blue-600" />
                        </div>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Mực nước</p>
                                <h3 className="text-3xl font-bold text-slate-800 mt-1">{sensorData.waterLevel.toFixed(1)} <span className="text-lg text-slate-500">cm</span></h3>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                                <Droplets size={24} />
                            </div>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                            <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-1000" 
                                style={{ width: `${Math.min(100, (sensorData.waterLevel / 200) * 100)}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-slate-500">Ngưỡng cảnh báo: 150cm</p>
                    </div>

                    {/* Rain Sensor Card */}
                    <div className="admin-glass-panel p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <CloudRain size={100} className="text-indigo-600" />
                        </div>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Cảm biến mưa</p>
                                <h3 className="text-3xl font-bold text-slate-800 mt-1">{sensorData.rain} <span className="text-lg text-slate-500">val</span></h3>
                            </div>
                            <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
                                <CloudRain size={24} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${sensorData.rain > 500 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                                {sensorData.rain > 800 ? "Mưa lớn" : sensorData.rain > 400 ? "Mưa nhỏ" : "Không mưa"}
                            </span>
                        </div>
                    </div>

                     {/* Temp & Humidity */}
                     <div className="admin-glass-panel p-6 relative overflow-hidden group">
                         <div className="flex items-center gap-4">
                             <div className="p-3 bg-orange-100 rounded-xl text-orange-600">
                                 <Thermometer size={24} />
                             </div>
                             <div>
                                 <p className="text-slate-500 font-bold text-xs uppercase">Nhiệt độ</p>
                                 <h3 className="text-2xl font-bold text-slate-800">{sensorData.temp}°C</h3>
                             </div>
                         </div>
                     </div>

                     <div className="admin-glass-panel p-6 relative overflow-hidden group">
                         <div className="flex items-center gap-4">
                             <div className="p-3 bg-cyan-100 rounded-xl text-cyan-600">
                                 <Activity size={24} />
                             </div>
                             <div>
                                 <p className="text-slate-500 font-bold text-xs uppercase">Độ ẩm</p>
                                 <h3 className="text-2xl font-bold text-slate-800">{sensorData.humidity}%</h3>
                             </div>
                         </div>
                     </div>
                </div>

                {/* --- CONTROL PANEL --- */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="admin-glass-panel p-6 h-full">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Cpu size={20} className="text-indigo-600" /> Điều khiển thiết bị
                        </h3>
                        
                        <div className="space-y-6">
                            {/* Control Item */}
                            <div className="flex items-center justify-between p-4 bg-white/40 rounded-xl border border-white/60">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${controls.pump ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                        <Power size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-700">Máy bơm</p>
                                        <p className="text-xs text-slate-500">{controls.pump ? 'Đang chạy' : 'Đã tắt'}</p>
                                    </div>
                                </div>
                                <label className="admin-switch">
                                    <input type="checkbox" checked={controls.pump} onChange={() => handleControlToggle('pump')} />
                                    <span className="admin-slider"></span>
                                </label>
                            </div>

                             {/* Control Item */}
                             <div className="flex items-center justify-between p-4 bg-white/40 rounded-xl border border-white/60">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${controls.siren ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                        <Bell size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-700">Còi báo động</p>
                                        <p className="text-xs text-slate-500">{controls.siren ? 'Đang hú' : 'Đã tắt'}</p>
                                    </div>
                                </div>
                                <label className="admin-switch">
                                    <input type="checkbox" checked={controls.siren} onChange={() => handleControlToggle('siren')} />
                                    <span className="admin-slider"></span>
                                </label>
                            </div>

                            {/* Mode Select */}
                            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                <p className="text-xs font-bold text-indigo-500 uppercase mb-3">Chế độ hoạt động</p>
                                <div className="flex gap-2 bg-white p-1 rounded-lg border border-indigo-100">
                                    <button 
                                        onClick={() => handleControlToggle('autoMode')}
                                        className={`flex-1 py-2 px-3 rounded-md text-sm font-bold transition-all ${controls.autoMode ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        Tự động
                                    </button>
                                    <button 
                                        onClick={() => handleControlToggle('autoMode')}
                                        className={`flex-1 py-2 px-3 rounded-md text-sm font-bold transition-all ${!controls.autoMode ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        Thủ công
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
        
        {/* --- SERIAL MONITOR --- */}
        <div className="admin-glass-panel p-0 overflow-hidden flex flex-col">
            <div className="bg-slate-800 p-3 flex justify-between items-center border-b border-slate-700">
                <div className="flex items-center gap-2 text-slate-300 font-mono text-sm">
                    <Terminal size={16} />
                    Serial Monitor (Live from Firebase)
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsArduinoConnected(!isArduinoConnected)}
                        className={`p-1.5 rounded hover:bg-slate-700 transition-colors ${isArduinoConnected ? 'text-green-400' : 'text-red-400'}`} title={isArduinoConnected ? "Pause" : "Resume"}
                    >
                        {isArduinoConnected ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                    </button>
                    <button 
                        onClick={() => setLogs([])}
                        className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors" title="Clear"
                    >
                        <LogOut size={14} />
                    </button>
                </div>
            </div>
            <div className="serial-monitor custom-scrollbar">
                {logs.length === 0 && <span className="text-slate-600 italic">Waiting for data stream from ESP32...</span>}
                {logs.map((log, index) => (
                    <div key={index} className="serial-line">
                        <span className="serial-time text-slate-500 text-xs">[{index}]</span>
                        <span>{log}</span>
                    </div>
                ))}
                <div ref={logEndRef} />
            </div>
            <div className="bg-slate-800 p-2 flex gap-2 border-t border-slate-700">
                <input 
                    type="text" 
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendSerialCommand()}
                    placeholder="Send command to ESP32..." 
                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1 text-white font-mono text-sm outline-none focus:border-indigo-500"
                />
                <button 
                    onClick={sendSerialCommand}
                    className="px-4 py-1 bg-indigo-600 text-white rounded text-sm font-bold hover:bg-indigo-700"
                >
                    Send
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default AdminPage;
