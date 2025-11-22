/**
 * MapControls Component
 * Control panel for map layers (flood zones, weather, etc.)
 */

import React, { useState } from "react";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import "./MapControls.css";

const MapControls = ({
  onToggleFloodZones,
  floodZonesVisible = true,
  floodZonesCount = 0,
  onToggleWeatherOverlay,
  weatherOverlayVisible = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="map-controls-container">
      <div
        className="map-controls-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="controls-header-content">
          <span className="controls-icon">🗂️</span>
          <h3 className="controls-title">Chức năng</h3>
        </div>
        <button className="controls-toggle-btn">
          <span className={`toggle-arrow ${isExpanded ? "expanded" : ""}`}>
            ▼
          </span>
        </button>
      </div>

      {isExpanded && (
        <div className="map-controls-content">
          {/* Các điểm ngập - Active */}
          <div className="control-item">
            <div className="control-item-info">
              <span className="control-icon flood-icon">🌊</span>
              <div className="control-label-group">
                <Label htmlFor="flood-zones-toggle" className="control-label">
                  Các điểm đen dễ ngập
                </Label>
                <span className="control-count">({floodZonesCount})</span>
              </div>
            </div>
            <Switch
              id="flood-zones-toggle"
              checked={floodZonesVisible}
              onCheckedChange={onToggleFloodZones}
            />
          </div>

          {/* Hiển thị lượng mưa - Now Active */}
          <div className="control-item">
            <div className="control-item-info">
              <span className="control-icon">🌧️</span>
              <div className="control-label-group">
                <Label htmlFor="rainfall-toggle" className="control-label">
                  Hiển thị lượng mưa
                </Label>
              </div>
            </div>
            <Switch
              id="rainfall-toggle"
              checked={weatherOverlayVisible}
              onCheckedChange={onToggleWeatherOverlay}
            />
          </div>

          {/* Thông báo điểm ngập gần */}
          <div className="control-item disabled">
            <div className="control-item-info">
              <span className="control-icon">🔔</span>
              <div className="control-label-group">
                <Label htmlFor="notification-toggle" className="control-label">
                  Thông báo điểm ngập gần bạn
                </Label>
              </div>
            </div>
            <Switch id="notification-toggle" checked={false} disabled={true} />
          </div>

          {/* Dẫn đường tránh ngập - Disabled */}
          <div className="control-item disabled">
            <div className="control-item-info">
              <span className="control-icon">🗺️</span>
              <div className="control-label-group">
                <Label htmlFor="routing-toggle" className="control-label">
                  Dẫn đường tránh ngập
                </Label>
              </div>
            </div>
            <Switch id="routing-toggle" checked={false} disabled={true} />
          </div>
        </div>
      )}
    </div>
  );
};

export default MapControls;
