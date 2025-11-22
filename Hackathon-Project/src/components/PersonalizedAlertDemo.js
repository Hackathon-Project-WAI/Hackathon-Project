/**
 * Personalized Alert Demo Component
 * Component để demo tính năng cảnh báo cá nhân hóa
 */
import React, { useState, useEffect } from "react";
import { usePersonalizedAlert } from "../hooks/usePersonalizedAlert";
import authService from "../services/authService";
import {
  MapPin,
  Home,
  ShieldCheck,
  AlertTriangle,
  Navigation,
  ChevronRight,
  Lock,
} from "lucide-react";
import "./PersonalizedAlertDemo.css";

const PersonalizedAlertDemo = ({ currentUserId = null }) => {
  const [user, setUser] = useState(null);

  // Get current logged-in user
  useEffect(() => {
    const unsubscribe = authService.onAuthChange((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const userId = currentUserId || user?.uid;

  const { loading, error, locations, fetchLocations, fetchLocationStats } =
    usePersonalizedAlert(userId);

  useEffect(() => {
    if (userId) {
      fetchLocations();
      fetchLocationStats();
    }
  }, [userId, fetchLocations, fetchLocationStats]);

  const getStatusColor = (status) => {
    const colors = {
      safe: "#4caf50",
      warning: "#ffc107",
      danger: "#ff9800",
      critical: "#f44336",
    };
    return colors[status] || "#9e9e9e";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "safe":
        return <ShieldCheck size={16} />;
      case "warning":
      case "danger":
      case "critical":
        return <AlertTriangle size={16} />;
      default:
        return <ShieldCheck size={16} />;
    }
  };

  return (
    <div className="personalized-alert-demo">
      {/* Check if user is logged in */}
      {!user ? (
        <div
          style={{
            padding: "48px 24px",
            borderRadius: "24px",
            background: "rgba(255, 255, 255, 0.65)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.5)",
            textAlign: "center",
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.05)",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              margin: "0 auto 24px",
              borderRadius: "24px",
              background: "linear-gradient(135deg, #ec4899, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(139, 92, 246, 0.3)",
            }}
          >
            <Lock size={40} color="white" />
          </div>
          <h3
            style={{
              fontSize: "24px",
              fontWeight: "800",
              color: "#1e293b",
              marginBottom: "12px",
            }}
          >
            Vui lòng đăng nhập
          </h3>
          <p
            style={{
              fontSize: "15px",
              color: "#64748b",
              margin: 0,
              lineHeight: "1.6",
            }}
          >
            Bạn cần đăng nhập để xem và quản lý địa điểm của mình
          </p>
        </div>
      ) : (
        <>
          {/* Hero Alert Card */}
          <div
            className="glass-panel"
            style={{
              borderRadius: "24px",
              padding: "32px",
              marginBottom: "24px",
              position: "relative",
              overflow: "hidden",
              background: "rgba(255, 255, 255, 0.65)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.5)",
              boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.05)",
            }}
          >
            {/* Decorative Background */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to right, rgba(238, 242, 255, 0.5), rgba(250, 245, 255, 0.5))",
                opacity: 0.5,
              }}
            />
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                width: "256px",
                height: "256px",
                background:
                  "radial-gradient(circle, rgba(139, 92, 246, 0.1), transparent)",
                borderRadius: "0 0 0 100%",
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                position: "relative",
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                gap: "24px",
              }}
            >
              {/* Big Icon */}
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "24px",
                  background: "linear-gradient(135deg, #ec4899, #ef4444)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 24px rgba(236, 72, 153, 0.3)",
                  flexShrink: 0,
                }}
              >
                <MapPin size={32} color="white" className="animate-bounce" />
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "8px",
                  }}
                >
                  <h2
                    style={{
                      fontSize: "24px",
                      fontWeight: "800",
                      color: "#1e293b",
                      margin: 0,
                    }}
                  >
                    📍 Cảnh báo khu vực của bạn
                  </h2>
                </div>
                <p
                  style={{
                    fontSize: "15px",
                    color: "#64748b",
                    margin: 0,
                    lineHeight: "1.6",
                  }}
                >
                  Xin chào,{" "}
                  <span style={{ fontWeight: "700", color: "#6366f1" }}>
                    {user.displayName || user.email}
                  </span>{" "}
                  - Quản lý địa điểm quan trọng của bạn để nhận thông báo sớm
                  nhất
                </p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div
              style={{
                padding: "16px 20px",
                borderRadius: "16px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "2px solid rgba(239, 68, 68, 0.3)",
                color: "#dc2626",
                fontSize: "14px",
                fontWeight: "500",
                marginBottom: "24px",
              }}
            >
              <strong>❌ Lỗi:</strong> {error}
            </div>
          )}

          {/* Locations List */}
          {locations.length > 0 && (
            <div
              className="glass-panel"
              style={{
                borderRadius: "24px",
                padding: "24px 32px",
                background: "rgba(255, 255, 255, 0.3)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.5)",
                boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.05)",
                minHeight: "300px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "24px",
                }}
              >
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "800",
                    color: "#1e293b",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    margin: 0,
                  }}
                >
                  <MapPin className="text-indigo-500" size={20} />
                  Địa điểm của bạn
                  <span
                    style={{
                      background: "#eef2ff",
                      color: "#6366f1",
                      fontSize: "12px",
                      padding: "2px 10px",
                      borderRadius: "20px",
                      fontWeight: "700",
                    }}
                  >
                    {locations.length}
                  </span>
                </h3>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {locations.map((location) => {
                  // Xác định status hiển thị
                  const displayStatus = location.last_alert_status || "safe";
                  const statusLabels = {
                    safe: "An toàn",
                    warning: "Cảnh báo",
                    danger: "Nguy hiểm",
                    critical: "Nghiêm trọng",
                  };

                  return (
                    <div
                      key={location.id}
                      className="location-card"
                      style={{
                        background: "rgba(255, 255, 255, 0.6)",
                        border: "1px solid rgba(255, 255, 255, 0.6)",
                        borderRadius: "16px",
                        padding: "20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        transition: "all 0.3s",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "white";
                        e.currentTarget.style.boxShadow =
                          "0 10px 40px rgba(139, 92, 246, 0.08)";
                        e.currentTarget.style.transform = "scale(1.01)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          "rgba(255, 255, 255, 0.6)";
                        e.currentTarget.style.boxShadow = "none";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "20px",
                        }}
                      >
                        {/* Icon Box */}
                        <div
                          className="icon-box"
                          style={{
                            width: "56px",
                            height: "56px",
                            borderRadius: "16px",
                            background: "#eef2ff",
                            border: "1px solid #e0e7ff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#6366f1",
                            transition: "all 0.3s",
                          }}
                        >
                          <Home size={24} />
                        </div>

                        {/* Text Info */}
                        <div>
                          <h4
                            style={{
                              fontSize: "18px",
                              fontWeight: "700",
                              color: "#1e293b",
                              marginBottom: "4px",
                            }}
                          >
                            {location.name}
                          </h4>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "16px",
                              fontSize: "13px",
                              color: "#64748b",
                            }}
                          >
                            <span>{location.address}</span>
                            <span
                              style={{
                                width: "4px",
                                height: "4px",
                                borderRadius: "50%",
                                background: "#cbd5e1",
                              }}
                            />
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                color: "#94a3b8",
                              }}
                            >
                              <Navigation size={12} /> Bán kính:{" "}
                              {location.alert_radius || 0} km
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge + Arrow */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                        }}
                      >
                        <span
                          style={{
                            padding: "6px 16px",
                            borderRadius: "20px",
                            fontSize: "13px",
                            fontWeight: "700",
                            color: "white",
                            backgroundColor: getStatusColor(displayStatus),
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            boxShadow: `0 4px 12px ${getStatusColor(
                              displayStatus
                            )}30`,
                          }}
                        >
                          {getStatusIcon(displayStatus)}
                          {statusLabels[displayStatus] || displayStatus}
                        </span>
                        <ChevronRight
                          size={20}
                          className="chevron-icon"
                          style={{
                            color: "#cbd5e1",
                            transition: "all 0.3s",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {user && !loading && locations.length === 0 && (
            <div
              style={{
                padding: "48px 24px",
                borderRadius: "24px",
                background: "rgba(255, 255, 255, 0.65)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.5)",
                textAlign: "center",
                boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.05)",
              }}
            >
              <div style={{ fontSize: "56px", marginBottom: "16px" }}>📍</div>
              <p
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#475569",
                  marginBottom: "8px",
                }}
              >
                Chưa có địa điểm nào
              </p>
              <p
                style={{
                  fontSize: "14px",
                  color: "#64748b",
                  margin: 0,
                  lineHeight: "1.6",
                }}
              >
                Hãy thêm địa điểm quan trọng để nhận cảnh báo ngập lụt
              </p>
            </div>
          )}
        </>
      )}

      <style>{`
        .location-card:hover .icon-box {
          background: #6366f1 !important;
          color: white !important;
        }
        .location-card:hover .chevron-icon {
          color: #6366f1 !important;
          transform: translateX(4px);
        }
      `}</style>
    </div>
  );
};

export default PersonalizedAlertDemo;
