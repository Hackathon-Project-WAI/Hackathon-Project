/**
 * useGeolocation Hook
 * Hook để quản lý geolocation
 */

import { useState, useCallback } from "react";
import { GEOLOCATION_CONFIG, PERMISSION_STATES } from "../utils/routeConstants";

export const useGeolocation = (apiKey = null) => {
  const [userLocation, setUserLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(
    PERMISSION_STATES.PROMPT
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * 🌟 HERE Positioning API - Độ chính xác cao hơn navigator.geolocation
   * Sử dụng HERE's WiFi/Cell database (tương tự Google Geolocation API)
   */
  const requestLocationWithHERE = useCallback(async () => {
    if (!apiKey) {
      console.warn("⚠️ No HERE API key - falling back to browser geolocation");
      return requestLocation();
    }

    setLoading(true);
    setError(null);
    console.log("🗺️ Đang dùng HERE Positioning API...");

    try {
      // HERE Positioning API endpoint
      const response = await fetch(
        `https://positioning.hereapi.com/v2/locate?apiKey=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // Yêu cầu sử dụng tất cả các nguồn có sẵn
            fallback: "any",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HERE API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.location) {
        const userPos = {
          lat: data.location.lat,
          lng: data.location.lng,
          accuracy: data.location.accuracy || 100,
          source: "HERE Positioning API 🗺️",
        };

        // Debug output
        let positionSource = "HERE API 🗺️";
        if (userPos.accuracy < 50) {
          positionSource += " (GPS-level)";
        } else if (userPos.accuracy < 500) {
          positionSource += " (WiFi-level)";
        } else {
          positionSource += " (Cell/IP-level)";
        }

        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📍 HERE POSITIONING API DEBUG:");
        console.log("   Nguồn:", positionSource);
        console.log(
          "   Tọa độ:",
          userPos.lat.toFixed(6),
          ",",
          userPos.lng.toFixed(6)
        );
        console.log("   Độ chính xác:", userPos.accuracy.toFixed(1), "m");
        console.log("   Location ID:", data.location.locationId || "N/A");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        setUserLocation(userPos);
        setLocationPermission(PERMISSION_STATES.GRANTED);
        setLoading(false);

        return userPos;
      } else {
        throw new Error("No location data from HERE API");
      }
    } catch (err) {
      console.error("❌ HERE Positioning API error:", err);
      console.log("🔄 Fallback to browser geolocation...");

      // Fallback to browser geolocation
      setLoading(false);
      console.log("⚠️ Falling back to standard requestLocation");
      throw err; // Let caller handle fallback
    }
  }, [apiKey]);

  /**
   * Request user's current location với retry + watchPosition strategy
   * Giống Google Maps: Lấy vị trí đầu tiên nhanh, sau đó cải thiện bằng watchPosition
   */
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Trình duyệt không hỗ trợ Geolocation!");
      setLocationPermission(PERMISSION_STATES.DENIED);
      return Promise.reject(new Error("Geolocation not supported"));
    }

    setLoading(true);
    setError(null);
    console.log("📍 Đang yêu cầu vị trí người dùng...");
    console.log("🔄 Strategy: Quick first + Watch for better accuracy");

    return new Promise((resolve, reject) => {
      let resolved = false;
      let bestAccuracy = Infinity;
      let watchId = null;
      const maxWatchTime = 5000; // Theo dõi thêm 5s để cải thiện độ chính xác

      // Timeout tổng thể
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          console.warn("⏰ Timeout - Không thể cải thiện độ chính xác thêm");
          if (watchId) navigator.geolocation.clearWatch(watchId);
          setLoading(false);
        }
      }, GEOLOCATION_CONFIG.timeout + maxWatchTime);

      // BƯỚC 1: Lấy vị trí đầu tiên NHANH (dù WiFi cũng được)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };

          // 🔍 DEBUG: Phát hiện nguồn định vị dựa vào độ chính xác
          let positionSource = "UNKNOWN";
          if (position.coords.accuracy < 50) {
            positionSource = "GPS 📡"; // Độ chính xác cao < 50m = GPS
          } else if (position.coords.accuracy < 500) {
            positionSource = "WiFi 📶"; // 50-500m = WiFi positioning
          } else {
            positionSource = "IP/Cell Tower 🗼"; // > 500m = IP hoặc cell tower
          }

          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          console.log("📍 GEOLOCATION DEBUG:");
          console.log("   Nguồn định vị:", positionSource);
          console.log(
            "   Tọa độ:",
            userPos.lat.toFixed(6),
            ",",
            userPos.lng.toFixed(6)
          );
          console.log(
            "   Độ chính xác:",
            position.coords.accuracy.toFixed(1),
            "m"
          );
          console.log("   Altitude:", position.coords.altitude || "N/A");
          console.log("   Heading:", position.coords.heading || "N/A");
          console.log("   Speed:", position.coords.speed || "N/A");
          console.log(
            "   Timestamp:",
            new Date(position.timestamp).toLocaleString()
          );
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

          setUserLocation(userPos);
          setLocationPermission(PERMISSION_STATES.GRANTED);
          setLoading(false);

          // Hiển thị thông báo cho user
          const accuracyText =
            position.coords.accuracy < 50
              ? `Độ chính xác cao (${position.coords.accuracy.toFixed(0)}m)`
              : `Độ chính xác thấp (${position.coords.accuracy.toFixed(0)}m)`;
          console.log(`✅ Vị trí ban đầu: ${positionSource} - ${accuracyText}`);

          bestAccuracy = position.coords.accuracy;

          // Resolve ngay để user thấy vị trí nhanh
          if (!resolved) {
            resolved = true;
            resolve(userPos);
          }

          // BƯỚC 2: Nếu độ chính xác chưa tốt, dùng watchPosition để cải thiện
          if (position.coords.accuracy > 50) {
            console.log(
              "🔄 Đang cố gắng cải thiện độ chính xác bằng watchPosition..."
            );

            watchId = navigator.geolocation.watchPosition(
              (watchPosition) => {
                if (watchPosition.coords.accuracy < bestAccuracy) {
                  const improvedPos = {
                    lat: watchPosition.coords.latitude,
                    lng: watchPosition.coords.longitude,
                    accuracy: watchPosition.coords.accuracy,
                  };

                  let improvedSource =
                    watchPosition.coords.accuracy < 50 ? "GPS 📡" : "WiFi 📶";
                  console.log(
                    `⬆️ Cải thiện: ${improvedSource} - ${watchPosition.coords.accuracy.toFixed(
                      1
                    )}m (tốt hơn ${(
                      bestAccuracy - watchPosition.coords.accuracy
                    ).toFixed(1)}m)`
                  );

                  bestAccuracy = watchPosition.coords.accuracy;
                  setUserLocation(improvedPos);

                  // Nếu đạt GPS chính xác, dừng watch
                  if (watchPosition.coords.accuracy < 50) {
                    console.log("✅ Đã đạt độ chính xác GPS tốt!");
                    navigator.geolocation.clearWatch(watchId);
                    clearTimeout(timeoutId);
                    setLoading(false);
                  }
                }
              },
              (err) => {
                console.warn("⚠️ Watch position error:", err.message);
              },
              {
                ...GEOLOCATION_CONFIG,
                maximumAge: 0,
              }
            );

            // Dừng watch sau maxWatchTime
            setTimeout(() => {
              if (watchId) {
                navigator.geolocation.clearWatch(watchId);
                setLoading(false);
                console.log("⏹️ Dừng theo dõi vị trí");
              }
            }, maxWatchTime);
          } else {
            // Đã có độ chính xác tốt, không cần watch
            clearTimeout(timeoutId);
            setLoading(false);
          }
        },
        (err) => {
          console.error("❌ Lỗi geolocation:", err);
          clearTimeout(timeoutId);
          setLocationPermission(PERMISSION_STATES.DENIED);
          setLoading(false);

          let message = "Không thể lấy vị trí của bạn. ";
          switch (err.code) {
            case err.PERMISSION_DENIED:
              message += "Bạn đã từ chối chia sẻ vị trí.";
              break;
            case err.POSITION_UNAVAILABLE:
              message += "Thông tin vị trí không khả dụng.";
              break;
            case err.TIMEOUT:
              message += "Timeout khi lấy vị trí.";
              break;
            default:
              message += "Lỗi không xác định.";
          }

          setError(message);
          reject(err);
        },
        GEOLOCATION_CONFIG
      );
    });
  }, []);

  /**
   * Watch user's location continuously
   */
  const watchLocation = useCallback((onLocationUpdate) => {
    if (!navigator.geolocation) {
      return null;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const userPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };

        // 🔍 DEBUG cho watch position
        let positionSource = "UNKNOWN";
        if (position.coords.accuracy < 50) {
          positionSource = "GPS 📡";
        } else if (position.coords.accuracy < 500) {
          positionSource = "WiFi 📶";
        } else {
          positionSource = "IP/Cell Tower 🗼";
        }

        console.log(
          `🔄 [WATCH] ${positionSource} - Accuracy: ${position.coords.accuracy.toFixed(
            1
          )}m`
        );

        setUserLocation(userPos);
        setLocationPermission(PERMISSION_STATES.GRANTED);

        if (onLocationUpdate) {
          onLocationUpdate(userPos);
        }
      },
      (err) => {
        console.error("❌ Watch location error:", err);
        setLocationPermission(PERMISSION_STATES.DENIED);
      },
      GEOLOCATION_CONFIG
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  /**
   * Reset location state
   */
  const resetLocation = useCallback(() => {
    setUserLocation(null);
    setLocationPermission(PERMISSION_STATES.PROMPT);
    setError(null);
    setLoading(false);
  }, []);

  return {
    userLocation,
    locationPermission,
    loading,
    error,
    requestLocation,
    requestLocationWithHERE, // 🌟 NEW: HERE Positioning API
    watchLocation,
    resetLocation,
  };
};
