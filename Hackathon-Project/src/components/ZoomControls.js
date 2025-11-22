/**
 * ZoomControls Component - MODERN UI
 * Bottom-right zoom controls: Plus, Minus, và Crosshair (recenter)
 */

import React from "react";
import { Plus, Minus, Crosshair } from 'lucide-react';
import "./ZoomControls.css";

const ZoomControls = ({ onZoomIn, onZoomOut, onRecenter }) => {
  return (
    <div className="zoom-controls-container">
      <div className="glass-panel zoom-panel">
        <button 
          onClick={onZoomIn}
          className="zoom-btn"
          title="Zoom in"
        >
          <Plus size={20} />
        </button>
        <div className="zoom-separator"></div>
        <button 
          onClick={onZoomOut}
          className="zoom-btn"
          title="Zoom out"
        >
          <Minus size={20} />
        </button>
      </div>
      
      <button 
        onClick={onRecenter}
        className="glass-panel recenter-btn"
        title="Về vị trí của bạn"
      >
        <Crosshair size={20} />
      </button>
    </div>
  );
};

export default ZoomControls;


