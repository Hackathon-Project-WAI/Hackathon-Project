import React from "react";
import "./RainfallLegend.css";

const RainfallLegend = () => {
  // Màu sắc khớp với getRainfallColor() trong useWeatherOverlay.js
  const legendItems = [
    {
      emoji: "☀️",
      label: "Không mưa",
      color: "transparent", // Trong suốt - khớp với overlay
      range: "0 mm/h",
    },
    {
      emoji: "🌦️",
      label: "Mưa nhẹ",
      color: "rgba(129, 199, 132, 0.3)", // Xanh nhạt
      range: "< 1 mm/h",
    },
    {
      emoji: "🌧️",
      label: "Mưa vừa",
      color: "rgba(255, 193, 7, 0.35)", // Vàng
      range: "1-2.5 mm/h",
    },
    {
      emoji: "⛈️",
      label: "Mưa to",
      color: "rgba(255, 152, 0, 0.4)", // Cam
      range: "2.5-10 mm/h",
    },
    {
      emoji: "🌊",
      label: "Mưa rất to",
      color: "rgba(244, 67, 54, 0.45)", // Đỏ nhạt
      range: "≥ 10 mm/h",
    },
  ];

  return (
    <div className="rainfall-legend">
      <div className="legend-title">
        <span>🌧️</span>
        <span>Lượng mưa:</span>
      </div>
      <div className="legend-items">
        {legendItems.map((item, index) => (
          <div key={index} className="legend-item">
            <div
              className="legend-color-box"
              style={{ 
                backgroundColor: item.color,
                border: index === 0 ? '1px dashed #999' : 'none' // Viền nét đứt cho "Không mưa"
              }}
            />
            <div className="legend-label">
              <span className="legend-emoji">{item.emoji}</span>
              <span>{item.label}</span>
              <span style={{ color: "#999", fontSize: "11px" }}>
                ({item.range})
              </span>
              {item.note && (
                <span style={{ color: "#666", fontSize: "10px", fontStyle: "italic" }}>
                  {" "}{item.note}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RainfallLegend;
