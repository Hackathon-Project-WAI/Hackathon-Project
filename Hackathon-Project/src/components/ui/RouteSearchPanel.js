/**
 * RouteSearchPanel Component - MODERN UI
 * Panel tìm kiếm điểm đầu/cuối và chọn phương tiện
 * Giữ nguyên chức năng, chỉ thay đổi giao diện
 */

import React, { useState, useEffect, useRef } from "react";
import { useHereSearch } from "../hooks/useHereSearch";
import { TRANSPORT_MODES } from "../utils/routeConstants";
import {
  Car,
  Bike,
  Navigation,
  X,
  MapPin,
  ArrowRightLeft,
  Route,
} from "lucide-react";
import "./RouteSearchPanel.css";

// Convert TRANSPORT_MODES to new format with icons
const VEHICLE_MODES = [
  { id: "car", icon: <Car size={20} />, label: "Ô tô", enabled: true },
  {
    id: "walk",
    icon: <Navigation size={20} className="rotate-90" />,
    label: "Đi bộ",
    enabled: true,
  },
  { id: "bike", icon: <Bike size={20} />, label: "Xe đạp", enabled: true },
  { id: "motor", icon: <Car size={20} />, label: "Xe máy", enabled: true },
];

const RouteSearchPanel = ({
  apiKey,
  onRouteCalculate,
  userLocation,
  routeStart,
  routeEnd,
  loading,
}) => {
  const [startQuery, setStartQuery] = useState("");
  const [endQuery, setEndQuery] = useState("");
  const [activeInput, setActiveInput] = useState(null);
  const [selectedMode, setSelectedMode] = useState("car");
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);

  const startInputRef = useRef(null);
  const endInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const hasAutoFilledRef = useRef(false);

  const { suggestions, autocomplete, lookup, clearSuggestions } =
    useHereSearch(apiKey);

  // Auto-fill vị trí hiện tại (chỉ 1 lần)
  useEffect(() => {
    if (userLocation && !startQuery && !hasAutoFilledRef.current) {
      setStartQuery("Vị trí của bạn");
      setStartPoint({
        lat: userLocation.lat,
        lng: userLocation.lng,
        name: "Vị trí của bạn",
      });
      hasAutoFilledRef.current = true;
    }
  }, [userLocation, startQuery]);

  // Handle input change
  const handleInputChange = (type, value) => {
    if (type === "start") {
      setStartQuery(value);
      setStartPoint(null);
    } else {
      setEndQuery(value);
      setEndPoint(null);
    }

    if (value.length >= 2) {
      autocomplete(value, userLocation || { lat: 16.0544, lng: 108.2022 });
    } else {
      clearSuggestions();
    }
  };

  // Handle suggestion select
  const handleSelectSuggestion = async (suggestion) => {
    let position = suggestion.position;

    if (!position && suggestion.locationId) {
      const lookupResult = await lookup(suggestion.locationId);
      if (lookupResult) {
        position = { lat: lookupResult.lat, lng: lookupResult.lng };
      } else {
        alert("Không thể lấy tọa độ cho địa điểm này");
        return;
      }
    }

    if (!position) {
      alert("Không thể lấy tọa độ cho địa điểm này");
      return;
    }

    const point = {
      lat: position.lat,
      lng: position.lng,
      name: suggestion.title,
      address: suggestion.address,
    };

    if (activeInput === "start") {
      setStartQuery(suggestion.title);
      setStartPoint(point);
      endInputRef.current?.focus();
    } else {
      setEndQuery(suggestion.title);
      setEndPoint(point);
    }

    clearSuggestions();
    setActiveInput(null);
  };

  // Handle use current location
  const handleUseCurrentLocation = () => {
    if (userLocation) {
      setStartQuery("Vị trí của bạn");
      setStartPoint({
        lat: userLocation.lat,
        lng: userLocation.lng,
        name: "Vị trí của bạn",
      });
      clearSuggestions();
      setActiveInput(null);
    }
  };

  // Handle swap points
  const handleSwap = () => {
    const tempQuery = startQuery;
    const tempPoint = startPoint;

    setStartQuery(endQuery);
    setStartPoint(endPoint);

    setEndQuery(tempQuery);
    setEndPoint(tempPoint);
  };

  // Handle calculate route
  const handleCalculateRoute = () => {
    if (!startPoint || !endPoint) {
      alert("Vui lòng nhập điểm đầu và điểm cuối");
      return;
    }

    onRouteCalculate(startPoint, endPoint, selectedMode);
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is on any input
      const clickedOnInput =
        startInputRef.current?.contains(event.target) ||
        endInputRef.current?.contains(event.target);

      // Only clear if clicked outside both inputs and suggestions
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        !clickedOnInput
      ) {
        clearSuggestions();
        // Don't set activeInput to null here - let onFocus handle it
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [clearSuggestions]);

  return (
    <div className="modern-route-search-panel">
      <div className="glass-panel routing-card">
        <div className="routing-header">
          <h3 className="routing-title">
            <Route size={20} /> Dẫn đường tránh ngập
          </h3>
        </div>

        {/* Vehicle Selector */}
        <div className="vehicle-selector">
          {VEHICLE_MODES.map((v) => (
            <button
              key={v.id}
              onClick={() => v.enabled && setSelectedMode(v.id)}
              disabled={!v.enabled}
              className={`vehicle-btn ${
                selectedMode === v.id ? "active" : ""
              } ${!v.enabled ? "disabled" : ""}`}
              title={!v.enabled ? "Sắp ra mắt" : v.label}
            >
              {v.icon}
            </button>
          ))}
        </div>

        {/* Route Inputs */}
        <div className="route-inputs">
          <div className="route-connector"></div>

          {/* Start Input */}
          <div className="route-input-wrapper">
            <div className="route-marker start"></div>
            <input
              ref={startInputRef}
              type="text"
              value={startQuery}
              onChange={(e) => handleInputChange("start", e.target.value)}
              onFocus={() => {
                console.log("🟢 Start input focused, query:", startQuery);
                setActiveInput("start");
                if (startQuery.length >= 2) {
                  autocomplete(
                    startQuery,
                    userLocation || { lat: 16.0544, lng: 108.2022 }
                  );
                } else {
                  clearSuggestions();
                }
              }}
              placeholder="Điểm xuất phát"
              className="glass-input"
            />
            {startQuery && (
              <button
                className="clear-input-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setStartQuery("");
                  setStartPoint(null);
                  clearSuggestions();
                  // Reset flag để có thể auto-fill lại khi bấm locate
                  hasAutoFilledRef.current = false;
                }}
                type="button"
              >
                <X size={14} />
              </button>
            )}

            {/* Start Input Dropdown */}
            {(() => {
              const shouldRender =
                suggestions.length > 0 && activeInput === "start";
              console.log("🟢 Start dropdown:", {
                shouldRender,
                suggestionsCount: suggestions.length,
                activeInput,
              });
              return (
                shouldRender && (
                  <div className="suggestions-dropdown" ref={suggestionsRef}>
                    {userLocation && (
                      <div
                        className="suggestion-item current-location"
                        onClick={handleUseCurrentLocation}
                      >
                        <div className="suggestion-icon">📍</div>
                        <div className="suggestion-content">
                          <div className="suggestion-title">Vị trí của bạn</div>
                          <div className="suggestion-address">
                            Sử dụng vị trí hiện tại
                          </div>
                        </div>
                      </div>
                    )}

                    {suggestions.map((suggestion, index) => (
                      <div
                        key={suggestion.id || index}
                        className="suggestion-item"
                        onClick={() => handleSelectSuggestion(suggestion)}
                      >
                        <div className="suggestion-icon">📍</div>
                        <div className="suggestion-content">
                          <div className="suggestion-title">
                            {suggestion.title}
                          </div>
                          {suggestion.address && (
                            <div className="suggestion-address">
                              {suggestion.address}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              );
            })()}
          </div>

          {/* End Input */}
          <div className="route-input-wrapper">
            <MapPin size={16} className="route-marker end" />
            <input
              ref={endInputRef}
              type="text"
              value={endQuery}
              onChange={(e) => handleInputChange("end", e.target.value)}
              onFocus={() => {
                console.log("🔴 End input focused, query:", endQuery);
                setActiveInput("end");
                if (endQuery.length >= 2) {
                  autocomplete(
                    endQuery,
                    userLocation || { lat: 16.0544, lng: 108.2022 }
                  );
                } else {
                  clearSuggestions();
                }
              }}
              placeholder="Điểm đến"
              className="glass-input"
            />
            <button className="swap-btn" onClick={handleSwap}>
              <ArrowRightLeft size={14} className="rotate-90" />
            </button>
            {endQuery && (
              <button
                className="clear-input-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setEndQuery("");
                  setEndPoint(null);
                  clearSuggestions();
                }}
                type="button"
              >
                <X size={14} />
              </button>
            )}

            {/* End Input Dropdown */}
            {(() => {
              const shouldRender =
                suggestions.length > 0 && activeInput === "end";
              console.log("🔴 End dropdown:", {
                shouldRender,
                suggestionsCount: suggestions.length,
                activeInput,
              });
              return (
                shouldRender && (
                  <div className="suggestions-dropdown">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={suggestion.id || index}
                        className="suggestion-item"
                        onClick={() => handleSelectSuggestion(suggestion)}
                      >
                        <div className="suggestion-icon">📍</div>
                        <div className="suggestion-content">
                          <div className="suggestion-title">
                            {suggestion.title}
                          </div>
                          {suggestion.address && (
                            <div className="suggestion-address">
                              {suggestion.address}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              );
            })()}
          </div>
        </div>

        <button
          onClick={handleCalculateRoute}
          disabled={!startPoint || !endPoint || loading}
          className="search-route-btn"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Đang tìm kiếm...
            </>
          ) : (
            <>Tìm lộ trình an toàn</>
          )}
        </button>
      </div>
    </div>
  );
};

export default RouteSearchPanel;
