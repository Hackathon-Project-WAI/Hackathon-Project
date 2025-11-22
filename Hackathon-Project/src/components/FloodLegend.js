import React from "react";
import "./FloodLegend.css";

const FloodLegend = ({ isVisible }) => {
  if (!isVisible) return null;

  const floodLevels = [
    {
      level: "Cao",
      color: "rgba(244, 67, 54, 0.5)",
      stroke: "rgba(244, 67, 54, 0.8)",
      description: "Ngập sâu, rủi ro cao",
    },
    {
      level: "Trung bình",
      color: "rgba(255, 152, 0, 0.5)",
      stroke: "rgba(255, 152, 0, 0.8)",
      description: "Ngập vừa phải",
    },
    {
      level: "Thấp",
      color: "rgba(76, 175, 80, 0.4)",
      stroke: "rgba(76, 175, 80, 0.7)",
      description: "Ngập nhẹ",
    },
  ];

  return (
    <div className="flood-legend">
      <div className="flood-legend-header">
        <span className="legend-icon">⚠️</span>
        <span className="legend-title">Vùng ngập lụt</span>
      </div>
      <div className="flood-legend-items">
        {floodLevels.map((item, index) => (
          <div key={index} className="flood-legend-item">
            <div
              className="flood-color-box"
              style={{
                backgroundColor: item.color,
                border: `2px solid ${item.stroke}`,
              }}
            />
            <div className="flood-legend-text">
              <div className="flood-level">{item.level}</div>
              <div className="flood-description">{item.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FloodLegend;
