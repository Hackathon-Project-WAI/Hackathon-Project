/**
 * Personalized Alert Demo Component
 * Component để demo tính năng cảnh báo cá nhân hóa
 */
import React, { useState, useEffect } from "react";
import { usePersonalizedAlert } from "../hooks/usePersonalizedAlert";
import authService from "../services/authService";
import "./PersonalizedAlertDemo.css";

const PersonalizedAlertDemo = ({ currentUserId = null }) => {
  const [user, setUser] = useState(null);
  const [minRiskLevel, setMinRiskLevel] = useState(1);
  const [sendEmail, setSendEmail] = useState(false);

  // Get current logged-in user
  useEffect(() => {
    const unsubscribe = authService.onAuthChange((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const userId = currentUserId || user?.uid;

  const {
    loading,
    error,
    locations,
    alerts,
    stats,
    fetchLocations,
    checkLocationsAndAlert,
    fetchLocationStats,
  } = usePersonalizedAlert(userId);

  useEffect(() => {
    if (userId) {
      fetchLocations();
      fetchLocationStats();
    }
  }, [userId, fetchLocations, fetchLocationStats]);

  const handleCheckAlerts = async () => {
    try {
      await checkLocationsAndAlert(minRiskLevel, sendEmail);
    } catch (err) {
      console.error("Failed to check alerts:", err);
    }
  };

  const getRiskLevelColor = (level) => {
    const colors = {
      0: "#4caf50",
      1: "#ffc107",
      2: "#ff9800",
      3: "#f44336",
    };
    return colors[level] || "#9e9e9e";
  };

  const getRiskLevelText = (level) => {
    const texts = {
      0: "An toàn",
      1: "Cảnh báo",
      2: "Nguy hiểm",
      3: "Nghiêm trọng",
    };
    return texts[level] || "Không xác định";
  };

  const getStatusColor = (status) => {
    const colors = {
      safe: "#4caf50",
      warning: "#ffc107",
      danger: "#ff9800",
      critical: "#f44336",
    };
    return colors[status] || "#9e9e9e";
  };

  return (
    <div className="personalized-alert-demo">
      {/* Check if user is logged in */}
      {!user ? (
        <div
          style={{
            padding: "48px 24px",
            borderRadius: "16px",
            background: "rgba(255, 255, 255, 0.7)",
            backdropFilter: "blur(10px)",
            border: "2px solid rgba(239, 68, 68, 0.2)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔒</div>
          <h3
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: "#1e293b",
              marginBottom: "12px",
            }}
          >
            Vui lòng đăng nhập
          </h3>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            Bạn cần đăng nhập để xem và quản lý địa điểm của mình
          </p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="auto-alert-header">
            <div className="header-left">
              <div className="header-icon">
                <i
                  className="fa-solid fa-map-location-dot"
                  style={{ fontSize: "32px", color: "white" }}
                ></i>
              </div>
              <div>
                <h1
                  style={{
                    fontSize: "28px",
                    fontWeight: "800",
                    color: "#1e293b",
                    margin: "0 0 4px 0",
                  }}
                >
                  📍 Cảnh báo khu vực của bạn
                </h1>
                <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                  Xin chào, {user.displayName || user.email} - Quản lý địa điểm
                  quan trọng của bạn
                </p>
              </div>
            </div>
          </div>

          {/* Settings - Glass Card */}
          <div className="compact-settings-grid">
            <div style={{ padding: "24px", borderRadius: "16px" }}>
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#1e293b",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <i className="fa-solid fa-sliders"></i> Tùy chọn kiểm tra
              </h3>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div className="form-group">
                  <label
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#475569",
                      marginBottom: "8px",
                      display: "block",
                    }}
                  >
                    Mức độ cảnh báo tối thiểu:
                  </label>
                  <select
                    value={minRiskLevel}
                    onChange={(e) => setMinRiskLevel(parseInt(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: "10px",
                      border: "2px solid rgba(139, 92, 246, 0.2)",
                      fontSize: "14px",
                      background: "rgba(255, 255, 255, 0.8)",
                      cursor: "pointer",
                    }}
                  >
                    <option value="0">Tất cả (bao gồm an toàn)</option>
                    <option value="1">Cảnh báo trở lên</option>
                    <option value="2">Nguy hiểm trở lên</option>
                    <option value="3">Chỉ nghiêm trọng</option>
                  </select>
                </div>

                <div
                  className="form-group checkbox-group"
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    id="send-email-check"
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <label
                    htmlFor="send-email-check"
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#475569",
                      cursor: "pointer",
                      margin: 0,
                    }}
                  >
                    Gửi email cảnh báo
                  </label>
                </div>

                <button
                  onClick={handleCheckAlerts}
                  disabled={loading || !userId}
                  style={{
                    width: "100%",
                    padding: "14px 24px",
                    borderRadius: "12px",
                    border: "none",
                    background:
                      loading || !userId
                        ? "linear-gradient(135deg, #cbd5e1, #94a3b8)"
                        : "linear-gradient(135deg, #ec4899, #8b5cf6)",
                    color: "white",
                    fontSize: "15px",
                    fontWeight: "700",
                    cursor: loading || !userId ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {loading ? "⏳ Đang kiểm tra..." : "🔍 Kiểm tra Cảnh Báo"}
                </button>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div
              style={{
                padding: "16px 20px",
                borderRadius: "12px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "2px solid rgba(239, 68, 68, 0.3)",
                color: "#dc2626",
                fontSize: "14px",
                fontWeight: "500",
                marginBottom: "20px",
              }}
            >
              <strong>❌ Lỗi:</strong> {error}
            </div>
          )}

          {/* Stats Section */}
          {stats && (
            <div
              className="compact-stats"
              style={{
                padding: "24px",
                borderRadius: "16px",
                marginBottom: "20px",
              }}
            >
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#1e293b",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                📊 Thống kê địa điểm
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    background:
                      "linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.05))",
                    border: "2px solid rgba(99, 102, 241, 0.2)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "32px",
                      fontWeight: "800",
                      color: "#6366f1",
                      marginBottom: "4px",
                    }}
                  >
                    {stats.total}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#64748b",
                    }}
                  >
                    Tổng số
                  </div>
                </div>
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    background:
                      "linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.05))",
                    border: "2px solid rgba(34, 197, 94, 0.2)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "32px",
                      fontWeight: "800",
                      color: "#22c55e",
                      marginBottom: "4px",
                    }}
                  >
                    {stats.active}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#64748b",
                    }}
                  >
                    Đang theo dõi
                  </div>
                </div>
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    background:
                      "linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))",
                    border: "2px solid rgba(239, 68, 68, 0.2)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "32px",
                      fontWeight: "800",
                      color: "#ef4444",
                      marginBottom: "4px",
                    }}
                  >
                    {stats.inDanger}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#64748b",
                    }}
                  >
                    Có nguy cơ
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Locations List */}
          {locations.length > 0 && (
            <div
              className="compact-history"
              style={{
                padding: "24px",
                borderRadius: "16px",
                marginBottom: "20px",
              }}
            >
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#1e293b",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                📍 Địa điểm của bạn ({locations.length})
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {locations.map((location) => (
                  <div
                    key={location.id}
                    style={{
                      padding: "16px 20px",
                      borderRadius: "12px",
                      background: location.is_active
                        ? "linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(236, 72, 153, 0.03))"
                        : "rgba(148, 163, 184, 0.1)",
                      border: location.is_active
                        ? "2px solid rgba(139, 92, 246, 0.2)"
                        : "2px solid rgba(148, 163, 184, 0.2)",
                      transition: "all 0.2s",
                      opacity: location.is_active ? 1 : 0.6,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                        marginBottom: "8px",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "16px",
                          fontWeight: "700",
                          color: "#1e293b",
                          margin: 0,
                        }}
                      >
                        {location.name}
                      </h4>
                      {location.last_alert_status && (
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "700",
                            color: "white",
                            backgroundColor: getStatusColor(
                              location.last_alert_status
                            ),
                          }}
                        >
                          {location.last_alert_status}
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#64748b",
                        margin: "0 0 12px 0",
                      }}
                    >
                      {location.address}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "12px",
                        fontSize: "12px",
                        color: "#64748b",
                      }}
                    >
                      {location.latitude && location.longitude && (
                        <span>
                          🌍 {location.latitude.toFixed(4)},{" "}
                          {location.longitude.toFixed(4)}
                        </span>
                      )}
                      <span>📡 Bán kính: {location.alert_radius || 0} km</span>
                      {location.last_checked && (
                        <span>
                          🕒 Kiểm tra:{" "}
                          {new Date(location.last_checked).toLocaleString(
                            "vi-VN"
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alerts Results */}
          {alerts && alerts.length > 0 && (
            <div
              className="compact-history"
              style={{
                padding: "24px",
                borderRadius: "16px",
                marginBottom: "20px",
              }}
            >
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#1e293b",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                ⚠️ Cảnh báo ({alerts.length})
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {alerts.map((alert, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "20px",
                      borderRadius: "12px",
                      background:
                        "linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(220, 38, 38, 0.03))",
                      border: "2px solid rgba(239, 68, 68, 0.2)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                        marginBottom: "12px",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "16px",
                          fontWeight: "700",
                          color: "#1e293b",
                          margin: 0,
                        }}
                      >
                        {alert.locationName}
                      </h4>
                      <span
                        style={{
                          padding: "6px 14px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "700",
                          color: "white",
                          backgroundColor: getRiskLevelColor(alert.floodRisk),
                        }}
                      >
                        {getRiskLevelText(alert.floodRisk)}
                      </span>
                    </div>

                    {alert.distance !== undefined && (
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#64748b",
                          margin: "0 0 12px 0",
                        }}
                      >
                        📍 Khoảng cách đến khu vực ngập:{" "}
                        {alert.distance.toFixed(2)} km
                      </p>
                    )}

                    {alert.alert && (
                      <>
                        <div
                          style={{
                            padding: "12px 16px",
                            borderRadius: "8px",
                            background: "rgba(255, 255, 255, 0.7)",
                            marginBottom: "12px",
                          }}
                        >
                          <strong
                            style={{ fontSize: "14px", color: "#1e293b" }}
                          >
                            📧 {alert.alert.subject}
                          </strong>
                        </div>
                        <div
                          style={{
                            padding: "16px",
                            borderRadius: "8px",
                            background: "rgba(255, 255, 255, 0.5)",
                            fontSize: "13px",
                            color: "#475569",
                            maxHeight: "300px",
                            overflowY: "auto",
                          }}
                          dangerouslySetInnerHTML={{
                            __html: alert.alert.htmlBody,
                          }}
                        />
                      </>
                    )}

                    <div
                      style={{
                        marginTop: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {alert.emailSent ? (
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "#22c55e",
                            background: "rgba(34, 197, 94, 0.1)",
                            border: "1px solid rgba(34, 197, 94, 0.2)",
                          }}
                        >
                          ✅ Email đã gửi
                        </span>
                      ) : (
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "#94a3b8",
                            background: "rgba(148, 163, 184, 0.1)",
                            border: "1px solid rgba(148, 163, 184, 0.2)",
                          }}
                        >
                          📭 Email chưa gửi
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State - only show when logged in */}
          {user && !loading && locations.length === 0 && (
            <div
              style={{
                padding: "48px 24px",
                borderRadius: "16px",
                background: "rgba(255, 255, 255, 0.7)",
                backdropFilter: "blur(10px)",
                border: "2px solid rgba(139, 92, 246, 0.2)",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📍</div>
              <p
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#475569",
                  marginBottom: "8px",
                }}
              >
                Chưa có địa điểm nào
              </p>
              <p style={{ fontSize: "14px", margin: 0 }}>
                Hãy thêm địa điểm quan trọng để nhận cảnh báo ngập lụt
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PersonalizedAlertDemo;
