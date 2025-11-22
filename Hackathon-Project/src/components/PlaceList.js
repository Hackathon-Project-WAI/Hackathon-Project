import React from "react";
import "./PlaceList.css";

const PlaceList = ({ places, onPlaceClick }) => {
  if (!places || places.length === 0) {
    return (
      <div className="no-places">
        <span className="no-places-icon">🔍</span>
        <p>Không tìm thấy địa điểm nào</p>
      </div>
    );
  }

  return (
    <div className="place-list">
      <div className="place-list-header">
        <h2>Đã tìm thấy {places.length} địa điểm</h2>
      </div>

      <div className="places-grid">
        {places.map((place, index) => (
          <div
            key={place.id || index}
            className="place-card"
            onClick={() => onPlaceClick && onPlaceClick(place, index)}
          >
            <div className="place-number">{index + 1}</div>

            <div className="place-header">
              <h3 className="place-title">{place.title}</h3>
            </div>

            <div className="place-content">
              <p className="place-address">
                <span className="place-icon">📍</span>
                {place.address?.label || "Không có địa chỉ"}
              </p>

              {place.position && (
                <p className="place-coordinates">
                  <span className="place-icon">🌐</span>
                  {place.position.lat.toFixed(4)},{" "}
                  {place.position.lng.toFixed(4)}
                </p>
              )}

              {place.distance && (
                <p className="place-distance">
                  <span className="place-icon">📏</span>
                  Khoảng cách:{" "}
                  <strong>{(place.distance / 1000).toFixed(2)} km</strong>
                </p>
              )}

              {place.categories && place.categories.length > 0 && (
                <div className="place-categories">
                  {place.categories.map((cat, idx) => (
                    <span key={idx} className="category-tag">
                      {cat.name}
                    </span>
                  ))}
                </div>
              )}

              {place.resultType && (
                <p className="place-type">
                  <span className="place-icon">🏷️</span>
                  Loại: {place.resultType}
                </p>
              )}
            </div>

            <div className="place-footer">
              <button className="view-on-map-btn">
                <span>📍</span>
                Xem trên bản đồ
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlaceList;
