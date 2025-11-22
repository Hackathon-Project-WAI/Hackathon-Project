/**
 * RouteResultsPanel Component - MODERN UI với Accordion & AI
 * Panel hiển thị kết quả routing dạng accordion với AI analysis
 */

import React, { useState } from "react";
import {
  Route as RouteIcon,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import "./RouteResultsPanel.css";

// Gemini AI Configuration
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || "";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const RouteResultsPanel = ({
  routes,
  selectedIndex,
  onSelectRoute,
  onClearRoute,
}) => {
  const [aiAdvice, setAiAdvice] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState({});

  if (!routes || routes.length === 0) return null;

  // Handle AI Analysis
  const handleAnalyzeRoute = async (route, index) => {
    setIsAnalyzing((prev) => ({ ...prev, [index]: true }));

    // Build detailed prompt with route information
    const floodInfo =
      route.floodCount > 0
        ? `Lưu ý: Tuyến đường này đi qua ${route.floodCount} vùng ngập lụt. `
        : `Tuyến đường này không đi qua vùng ngập. `;

    const routeRank =
      index === 0
        ? "nhanh nhất"
        : index === 1
        ? "thứ 2"
        : index === 2
        ? "thứ 3"
        : `thứ ${index + 1}`;

    const prompt = `Bạn là chuyên gia phân tích giao thông và an toàn đường bộ ở Đà Nẵng.

Thông tin lộ trình ${routeRank}:
- Khoảng cách: ${route.distance.toFixed(2)} km
- Thời gian dự kiến: ${Math.round(route.duration)} phút
- ${floodInfo}

Hãy đưa ra đánh giá ngắn gọn về:
1. Mức độ an toàn của tuyến đường này
2. Những rủi ro cần lưu ý (nếu có)
3. Khuyến nghị có nên chọn tuyến này không

Trả lời bằng tiếng Việt, tối đa 50 từ, ngắn gọn và dễ hiểu.`;

    try {
      const response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });
      const data = await response.json();
      const advice =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Không thể kết nối AI. Vui lòng kiểm tra API key.";
      setAiAdvice((prev) => ({ ...prev, [index]: advice }));
    } catch (error) {
      console.error("AI Analysis Error:", error);
      setAiAdvice((prev) => ({
        ...prev,
        [index]: "Lỗi kết nối AI. Vui lòng kiểm tra API key trong file .env",
      }));
    } finally {
      setIsAnalyzing((prev) => ({ ...prev, [index]: false }));
    }
  };

  return (
    <div className="route-results-panel-wrapper">
      {/* Header */}
      <div className="glass-panel results-header-compact">
        <div>
          <h3 className="results-title-compact">
            <RouteIcon size={16} className="text-indigo-600" /> {routes.length}{" "}
            tuyến đường
          </h3>
        </div>
        <button onClick={onClearRoute} className="clear-btn-compact">
          <Trash2 size={12} /> Xóa
        </button>
      </div>

      {/* Accordion Route Cards */}
      <div className="route-accordion-list">
        {routes.map((route, index) => {
          const isSelected = index === selectedIndex;
          const hasFlood = route.floodCount > 0;
          const hasAiAdvice = aiAdvice[index];
          const isAnalyzingRoute = isAnalyzing[index];

          return (
            <div
              key={index}
              onClick={() => onSelectRoute(index)}
              className={`route-accordion-card ${isSelected ? "selected" : ""}`}
            >
              {/* Card Header */}
              <div className="route-card-header">
                <div className="route-card-header-left">
                  <div
                    className={`route-number-circle ${
                      isSelected ? "active" : ""
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <div className="route-card-time-distance">
                      <span className="route-time">
                        {Math.round(route.duration)} phút
                      </span>
                      <span className="route-distance-small">
                        ({route.distance.toFixed(2)} km)
                      </span>
                    </div>
                    <div className="route-card-status">
                      {hasFlood ? (
                        <span className="status-badge-warning">
                          <AlertTriangle size={10} /> Có {route.floodCount} vùng
                          ngập
                        </span>
                      ) : (
                        <span className="status-badge-safe">
                          <CheckCircle2 size={10} /> An toàn
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronDown
                  size={16}
                  className={`chevron-icon ${isSelected ? "rotated" : ""}`}
                />
              </div>

              {/* Expanded Content (Accordion) */}
              <div
                className={`route-card-content ${isSelected ? "expanded" : ""}`}
              >
                <div className="route-card-inner">
                  {/* AI Analysis Section */}
                  <div className="ai-analysis-section">
                    {!hasAiAdvice ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAnalyzeRoute(route, index);
                        }}
                        disabled={isAnalyzingRoute}
                        className="ai-analyze-btn"
                      >
                        {isAnalyzingRoute ? (
                          <div className="ai-spinner"></div>
                        ) : (
                          <Sparkles size={14} />
                        )}
                        {isAnalyzingRoute
                          ? "Đang phân tích..."
                          : "Hỏi Gemini về rủi ro"}
                      </button>
                    ) : (
                      <div className="ai-advice-box">
                        <div className="ai-advice-header">
                          <Sparkles size={10} /> Gemini AI
                        </div>
                        <p className="ai-advice-text">{hasAiAdvice}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RouteResultsPanel;
