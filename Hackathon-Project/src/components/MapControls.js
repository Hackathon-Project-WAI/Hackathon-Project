/**
 * MapControls Component - MODERN UI
 * Control panel for map layers (flood zones, weather, routing)
 * Giữ nguyên chức năng, chỉ thay đổi giao diện
 */

import React, { useState } from "react";
import {
  Layers,
  AlertTriangle,
  CloudRain,
  Shield,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import "./MapControls.css";

const MapControls = ({
  onToggleFloodZones,
  floodZonesVisible = true,
  floodZonesCount = 0,
  onToggleWeatherOverlay,
  weatherOverlayVisible = false,
  onToggleRouting,
  routingMode = false,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [isExpanded, setIsExpanded] = useState(!isCollapsed);

  // Sync với prop isCollapsed từ parent
  React.useEffect(() => {
    setIsExpanded(!isCollapsed);
  }, [isCollapsed]);

  return (
    <div className="modern-map-controls">
      <div className="glass-panel layers-card">
        <div
          className="layers-header"
          onClick={() => {
            const newExpanded = !isExpanded;
            setIsExpanded(newExpanded);
            if (onToggleCollapse) {
              onToggleCollapse(!newExpanded);
            }
          }}
        >
          <h3 className="layers-title">
            <Layers size={16} className="text-indigo-600" /> Lớp phủ & Tiện ích
          </h3>
          {isExpanded ? (
            <ChevronUp size={16} className="chevron" />
          ) : (
            <ChevronDown size={16} className="chevron" />
          )}
        </div>

        <div
          className={`layers-list-container ${
            isExpanded ? "expanded" : "collapsed"
          }`}
        >
          <div className="layers-list">
            {/* Flood Markers Toggle */}
            <div
              className="layer-item"
              onClick={() => onToggleFloodZones(!floodZonesVisible)}
            >
              <div className="layer-info">
                <div className="layer-icon blue">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <p className="layer-name">Các điểm ngập</p>
                  <p className="layer-desc">{floodZonesCount} điểm phát hiện</p>
                </div>
              </div>
              <Switch
                checked={floodZonesVisible}
                onChange={() => onToggleFloodZones(!floodZonesVisible)}
              />
            </div>

            {/* Rain Overlay Toggle */}
            <div
              className="layer-item"
              onClick={() => onToggleWeatherOverlay(!weatherOverlayVisible)}
            >
              <div className="layer-info">
                <div className="layer-icon purple">
                  <CloudRain size={18} />
                </div>
                <div>
                  <p className="layer-name">Hiển thị lượng mưa</p>
                  <p className="layer-desc">Realtime radar</p>
                </div>
              </div>
              <Switch
                checked={weatherOverlayVisible}
                onChange={() => onToggleWeatherOverlay(!weatherOverlayVisible)}
              />
            </div>

            {/* Routing Feature Toggle */}
            <div
              className={`layer-item feature ${routingMode ? "active" : ""}`}
              onClick={() => onToggleRouting(!routingMode)}
            >
              <div className="layer-info">
                <div className="layer-icon-feature">
                  <Shield size={14} />
                </div>
                <span className="feature-name">Dẫn đường tránh ngập</span>
              </div>
              <Switch
                checked={routingMode}
                onChange={() => onToggleRouting(!routingMode)}
                activeColor="indigo"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Switch Component
const Switch = ({ checked, onChange, activeColor = "indigo" }) => {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`switch ${checked ? "checked" : ""} ${activeColor}`}
    >
      <div className="switch-thumb"></div>
    </div>
  );
};

export default MapControls;
