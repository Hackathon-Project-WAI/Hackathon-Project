/**
 * useRouting Hook
 * Hook để quản lý routing logic
 */

import { useState, useCallback, useMemo } from "react";
import { ROUTING_CONFIG, TRANSPORT_MODES } from "../utils/routeConstants";
import {
  analyzeRoutesFlood,
  selectBestRoute,
  convertFloodZonesToAvoidAreas,
  selectFloodZonesToAvoid,
} from "../utils/floodCalculations";

export const useRouting = (getRoutingService, floodZones) => {
  const [routeStart, setRouteStart] = useState(null);
  const [routeEnd, setRouteEnd] = useState(null);
  const [allRoutes, setAllRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Current selected route info
   */
  const selectedRoute = useMemo(() => {
    if (!allRoutes || allRoutes.length === 0) return null;
    return allRoutes[selectedRouteIndex];
  }, [allRoutes, selectedRouteIndex]);

  /**
   * Route info for display
   */
  const routeInfo = useMemo(() => {
    if (!selectedRoute) return null;

    return {
      distance: `${selectedRoute.distance.toFixed(2)} km`,
      duration: `${Math.round(selectedRoute.duration)} phút`,
      safeRoute: selectedRoute.floodCount === 0,
      routeNumber: selectedRouteIndex + 1,
      totalRoutes: allRoutes.length,
      floodCount: selectedRoute.floodCount,
      affectedZones: selectedRoute.affectedZones,
    };
  }, [selectedRoute, selectedRouteIndex, allRoutes]);

  /**
   * Route warning if floods detected
   */
  const routeWarning = useMemo(() => {
    if (!selectedRoute || selectedRoute.floodCount === 0) return null;

    return {
      type: "flood_intersection",
      zones: selectedRoute.affectedZones,
      message: `⚠️ Cảnh báo: Đường đi qua ${selectedRoute.floodCount} khu vực ngập lụt!`,
      alternativesChecked: allRoutes.length,
    };
  }, [selectedRoute, allRoutes]);

  /**
   * Calculate route
   * @param {Object} start - Điểm xuất phát {lat, lng}
   * @param {Object} end - Điểm đích {lat, lng}
   * @param {string} transportMode - Phương tiện: 'car', 'pedestrian', 'bicycle', 'publicTransport'
   */
  const calculateRoute = useCallback(
    async (start, end, transportMode = "car") => {
      if (!start || !end) {
        console.error("Missing start or end point");
        return;
      }

      const router = getRoutingService();
      if (!router) {
        console.error("Routing service not available");
        return;
      }

      setLoading(true);
      setError(null);

      // Lấy config của transport mode
      const modeConfig = TRANSPORT_MODES[transportMode] || TRANSPORT_MODES.car;
      const avoidFloods = modeConfig.avoidFloods !== false;

      const modeIcon =
        {
          car: "🚗",
          pedestrian: "🚶",
          bicycle: "🚴",
          scooter: "🛵",
        }[transportMode] || "🚗";

      console.log(
        `${modeIcon} Calculating route from`,
        start,
        "to",
        end,
        `(${transportMode})`
      );
      console.log("🌊 SMART Strategy: Lọc thông minh + Tránh vùng ngập");

      // Lọc thông minh: ưu tiên vùng ngập gần route + risk level cao
      const zonesToAvoid = avoidFloods
        ? selectFloodZonesToAvoid(
            floodZones,
            start,
            end,
            ROUTING_CONFIG.avoidRiskLevels,
            ROUTING_CONFIG.maxAvoidAreas
          )
        : [];

      const routingParameters = {
        routingMode: modeConfig.routingMode || ROUTING_CONFIG.routingMode,
        transportMode: modeConfig.apiValue || transportMode,
        origin: `${start.lat},${start.lng}`,
        destination: `${end.lat},${end.lng}`,
        return: ROUTING_CONFIG.returnValues,
        alternatives: ROUTING_CONFIG.maxAlternatives,
        spans: "names,length,duration",
      };

      // Thêm avoid areas nếu có flood zones
      if (avoidFloods && zonesToAvoid.length > 0) {
        const avoidAreasString = convertFloodZonesToAvoidAreas(
          zonesToAvoid,
          ROUTING_CONFIG.floodBufferMeters
        );
        if (avoidAreasString) {
          routingParameters["avoid[areas]"] = avoidAreasString;
          console.log(
            `🚫 Tránh ${
              zonesToAvoid.length
            } vùng ngập (${ROUTING_CONFIG.avoidRiskLevels.join(", ")})`
          );
          console.log(
            `   Buffer: +${ROUTING_CONFIG.floodBufferMeters}m để an toàn`
          );
        }
      } else {
        console.log("ℹ️ Không tránh vùng ngập (chế độ so sánh)");
      }

      console.log(
        `📊 Yêu cầu ${ROUTING_CONFIG.maxAlternatives} routes alternatives...`
      );

      return new Promise((resolve, reject) => {
        router.calculateRoute(
          routingParameters,
          (result) => {
            console.log("✅ Route calculated:", result);

            if (!result.routes || result.routes.length === 0) {
              setLoading(false);
              setError("Không tìm thấy route");
              reject(new Error("No routes found"));
              return;
            }

            console.log(
              `📊 Nhận được ${result.routes.length} routes alternatives`
            );

            // Analyze all routes for flood (kiểm tra lại để chắc chắn)
            const analyzedRoutes = analyzeRoutesFlood(
              result.routes,
              floodZones
            );

            // Log analysis với chi tiết
            console.log("🔍 Kết quả phân tích các tuyến đường:");
            analyzedRoutes.forEach((analysis, index) => {
              console.log(
                `  ${index + 1}. ${analysis.distance.toFixed(
                  2
                )} km, ${Math.round(analysis.duration)} phút`
              );
              console.log(
                `     → Vùng ngập: ${
                  analysis.floodCount > 0
                    ? `⚠️ ${analysis.floodCount} zones`
                    : "✅ An toàn (không đi qua vùng ngập)"
                }`
              );
              if (analysis.floodCount > 0) {
                analysis.affectedZones.forEach((zone) => {
                  console.log(`        - ${zone.name} (${zone.riskLevel})`);
                });
              }
            });

            // Select best route (ưu tiên ít ngập nhất)
            const bestRoute = selectBestRoute(analyzedRoutes);

            if (
              avoidFloods &&
              bestRoute.floodCount > 0 &&
              zonesToAvoid.length > 0
            ) {
              console.warn(
                `⚠️ Mặc dù đã tránh ${zonesToAvoid.length} vùng ngập, route vẫn đi qua ${bestRoute.floodCount} vùng ngập khác!`
              );
              console.log(
                "💡 Có thể là: vùng ngập mức thấp (low) hoặc route quá xa"
              );
            }

            console.log(
              `✅ Đề xuất route ${
                bestRoute.bestIndex + 1
              }: ${bestRoute.distance.toFixed(2)} km, ${Math.round(
                bestRoute.duration
              )} phút - ${
                bestRoute.floodCount === 0
                  ? "✅ An toàn"
                  : `⚠️ ${bestRoute.floodCount} vùng ngập`
              }`
            );

            setAllRoutes(analyzedRoutes);
            setSelectedRouteIndex(bestRoute.bestIndex);
            setRouteStart(start);
            setRouteEnd(end);
            setLoading(false);

            resolve(analyzedRoutes);
          },
          (err) => {
            console.error("❌ Routing error:", err);
            console.error("Error details:", err.message);

            // Fallback strategy: Nếu tránh ngập thất bại, thử các phương án khác
            if (avoidFloods && routingParameters["avoid[areas]"]) {
              console.log(
                "⚠️ Không thể tính route khi tránh tất cả vùng ngập!"
              );
              console.log(
                "💡 Fallback: Tính route bình thường rồi chọn đường ít ngập nhất..."
              );

              // Thử lại không tránh để có ít nhất 1 route
              calculateRoute(start, end, false).then(resolve).catch(reject);
            } else {
              setLoading(false);
              setError(
                "Không thể tính toán đường đi. Có thể không có đường đi khả thi."
              );
              reject(err);
            }
          }
        );
      });
    },
    [getRoutingService, floodZones]
  );

  /**
   * Select specific route
   */
  const selectRoute = useCallback(
    (index) => {
      if (!allRoutes || index >= allRoutes.length || index < 0) return;

      console.log(`📍 User chọn route ${index + 1}`);
      setSelectedRouteIndex(index);
    },
    [allRoutes]
  );

  /**
   * Clear all routes
   */
  const clearRoute = useCallback(() => {
    setRouteStart(null);
    setRouteEnd(null);
    setAllRoutes([]);
    setSelectedRouteIndex(0);
    setError(null);
    console.log("🗑️ Routes cleared");
  }, []);

  return {
    routeStart,
    routeEnd,
    allRoutes,
    selectedRouteIndex,
    selectedRoute,
    routeInfo,
    routeWarning,
    loading,
    error,
    calculateRoute,
    selectRoute,
    clearRoute,
    setRouteStart,
    setRouteEnd,
  };
};
