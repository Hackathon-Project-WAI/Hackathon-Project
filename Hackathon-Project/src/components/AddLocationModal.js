/**
 * AddLocationModal Component
 * Modal để thêm địa điểm mới
 */

import React, { useState } from "react";
import { X } from "lucide-react";
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

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const location = {
      ...formData,
      coords: {
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
    setErrors({});
    onClose();
  };

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

          {/* Địa chỉ */}
          <div className="form-group">
            <label>
              Địa chỉ <span className="required">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: 123 Nguyễn Tri Phương, Hải Châu, Đà Nẵng"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className={errors.address ? "error" : ""}
            />
            {errors.address && (
              <span className="error-message">{errors.address}</span>
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
