/**
 * LocateMeButton Component - Google Maps Style
 * Nút lấy vị trí hiện tại và di chuyển map đến đó
 */

import React, { useState } from "react";
import { Locate } from "lucide-react";
import "./LocateMeButton.css";

const LocateMeButton = ({ onLocate, isLocating, hasLocation }) => {
  const [isPulsing, setIsPulsing] = useState(false);

  const handleClick = () => {
    setIsPulsing(true);
    onLocate();
    setTimeout(() => setIsPulsing(false), 600);
  };

  return (
    <button
      className={`locate-me-button ${isPulsing ? "pulsing" : ""} ${
        hasLocation ? "active" : ""
      }`}
      onClick={handleClick}
      disabled={isLocating}
      title="Xác định vị trí của bạn"
      aria-label="Locate me"
    >
      <Locate
        size={20}
        className={`locate-icon ${isLocating ? "locating" : ""}`}
      />
    </button>
  );
};

export default LocateMeButton;
