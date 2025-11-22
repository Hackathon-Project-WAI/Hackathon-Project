/**
 * AddLocationModal Component
 * Modal để thêm địa điểm mới với HERE Maps Autocomplete
 */

import React, { useState, useRef, useEffect } from "react";
import { X, MapPin } from "lucide-react";
import { useHereSearch } from "../hooks/useHereSearch";
import "./AddLocationModal.css";

const AddLocationModal = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    icon: "🏠",
    alertRadius: 1000,
    priority: "high",
  });

  const [errors, setErrors] = useState({});
  const [addressQuery, setAddressQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addressInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Get API Key from environment
  const API_KEY = process.env.REACT_APP_HERE_API_KEY || "";

  // Use HERE Maps search hook
  const { suggestions, autocomplete, lookup, clearSuggestions } =
    useHereSearch(API_KEY);

  const locationTypes = [
    { icon: "🏠", label: "Nhà", value: "home" },
    { icon: "🏢", label: "Công ty", value: "work" },
    { icon: "🎓", label: "Trường học", value: "school" },
    { icon: "🏥", label: "Bệnh viện", value: "hospital" },
    { icon: "🏪", label: "Cửa hàng", value: "shop" },
    { icon: "💪", label: "Phòng gym", value: "gym" },
    { icon: "☕", label: "Quán cafe", value: "cafe" },
    { icon: "👨‍👩‍👦", label: "Nhà người thân", value: "family" },
    { icon: "📍", label: "Khác", value: "other" },
  ];

  const priorityOptions = [
    { value: "critical", label: "Rất quan trọng", color: "#ff4757" },
    { value: "high", label: "Quan trọng", color: "#ffa502" },
    { value: "medium", label: "Trung bình", color: "#1e90ff" },
    { value: "low", label: "Thấp", color: "#95a5a6" },
  ];

  // Handle address input change
  const handleAddressChange = (value) => {
    console.log("🔍 Address input changed:", value);
    setAddressQuery(value);
    setFormData({ ...formData, address: value });
    setSelectedLocation(null);

    if (value.length >= 2) {
      console.log("🔎 Calling autocomplete for:", value);
      autocomplete(value, { lat: 16.0544, lng: 108.2022 }); // Đà Nẵng center
      setShowSuggestions(true);
    } else {
      clearSuggestions();
      setShowSuggestions(false);
    }
  };

  // Debug: Log suggestions changes
  useEffect(() => {
    console.log("📋 Suggestions updated:", suggestions.length, suggestions);
    console.log("👁️ Show suggestions:", showSuggestions);
  }, [suggestions, showSuggestions]);

  // Handle suggestion select
  const handleSelectSuggestion = async (suggestion) => {
    console.log("📍 Selected suggestion:", suggestion);

    let position = suggestion.position;

    // If no position, lookup by locationId
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

    // Update form data
    setAddressQuery(suggestion.title);
    setFormData({
      ...formData,
      address: suggestion.address || suggestion.title,
      name: formData.name || suggestion.title, // Auto-fill name if empty
    });
    setSelectedLocation({
      lat: position.lat,
      lng: position.lng,
      address: suggestion.address || suggestion.title,
    });

    clearSuggestions();
    setShowSuggestions(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Vui lòng nhập tên địa điểm";
    }
    if (!formData.address.trim()) {
      newErrors.address = "Vui lòng nhập địa chỉ";
    }
    if (!selectedLocation) {
      newErrors.address = "Vui lòng chọn địa chỉ từ danh sách gợi ý";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const location = {
      ...formData,
      coords: selectedLocation || {
        lat: 16.0544,
        lng: 108.2022,
      },
      status: "safe", // safe, warning, danger
    };

    onAdd(location);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      name: "",
      address: "",
      icon: "🏠",
      alertRadius: 1000,
      priority: "high",
    });
    setAddressQuery("");
    setSelectedLocation(null);
    setErrors({});
    clearSuggestions();
    setShowSuggestions(false);
    onClose();
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        addressInputRef.current &&
        !addressInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📍 Thêm địa điểm mới</h2>
          <button className="close-button" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Tên địa điểm */}
          <div className="form-group">
            <label>
              Tên địa điểm <span className="required">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Nhà riêng, Công ty ABC..."
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={errors.name ? "error" : ""}
            />
            {errors.name && (
              <span className="error-message">{errors.name}</span>
            )}
          </div>

          {/* Địa chỉ với HERE Maps Autocomplete */}
          <div className="form-group">
            <label>
              Địa chỉ <span className="required">*</span>
            </label>
            <div className="address-input-wrapper">
              <input
                ref={addressInputRef}
                type="text"
                placeholder="Nhập địa chỉ hoặc chọn trên bản đồ"
                value={addressQuery}
                onChange={(e) => handleAddressChange(e.target.value)}
                onFocus={() => {
                  if (addressQuery.length >= 2) {
                    autocomplete(addressQuery, { lat: 16.0544, lng: 108.2022 });
                    setShowSuggestions(true);
                  }
                }}
                className={errors.address ? "error" : ""}
              />
              {errors.address && (
                <span className="error-message">{errors.address}</span>
              )}

              {/* Suggestions Dropdown - Debug */}
              {console.log("🎯 Render check:", {
                showSuggestions,
                suggestionsCount: suggestions.length,
              })}

              {showSuggestions && suggestions.length > 0 && (
                <div className="suggestions-dropdown" ref={suggestionsRef}>
                  {console.log(
                    "✅ Rendering suggestions dropdown with",
                    suggestions.length,
                    "items"
                  )}
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.id || index}
                      className="suggestion-item"
                      onClick={() => handleSelectSuggestion(suggestion)}
                    >
                      <div className="suggestion-icon">
                        <MapPin size={16} />
                      </div>
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
              )}

              {showSuggestions &&
                suggestions.length === 0 &&
                addressQuery.length >= 2 && (
                  <div className="suggestions-dropdown" ref={suggestionsRef}>
                    <div className="suggestions-empty">
                      Không tìm thấy địa điểm
                    </div>
                  </div>
                )}
            </div>

            {selectedLocation && (
              <div className="selected-location-info">
                ✅ Đã chọn: {selectedLocation.address}
              </div>
            )}
          </div>

          {/* Loại địa điểm */}
          <div className="form-group">
            <label>Loại địa điểm</label>
            <div className="icon-selector">
              {locationTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  className={`icon-option ${
                    formData.icon === type.icon ? "selected" : ""
                  }`}
                  onClick={() => setFormData({ ...formData, icon: type.icon })}
                  title={type.label}
                >
                  <span className="icon">{type.icon}</span>
                  <span className="label">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mức độ ưu tiên */}
          <div className="form-group">
            <label>Mức độ quan trọng</label>
            <div className="priority-selector">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`priority-option ${
                    formData.priority === option.value ? "selected" : ""
                  }`}
                  style={{
                    borderColor:
                      formData.priority === option.value
                        ? option.color
                        : "#e0e0e0",
                  }}
                  onClick={() =>
                    setFormData({ ...formData, priority: option.value })
                  }
                >
                  <div
                    className="priority-dot"
                    style={{ backgroundColor: option.color }}
                  />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bán kính cảnh báo */}
          <div className="form-group">
            <label>
              Bán kính cảnh báo: <strong>{formData.alertRadius}m</strong>
            </label>
            <input
              type="range"
              min="500"
              max="3000"
              step="100"
              value={formData.alertRadius}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  alertRadius: parseInt(e.target.value),
                })
              }
              className="range-slider"
            />
            <div className="range-labels">
              <span>500m</span>
              <span>1.5km</span>
              <span>3km</span>
            </div>
            <p className="help-text">
              Bạn sẽ nhận cảnh báo khi có ngập trong bán kính này quanh địa điểm
            </p>
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={handleClose}>
              Hủy
            </button>
            <button type="submit" className="btn-submit">
              Thêm địa điểm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLocationModal;
