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
import { analyzeRoutesWithGemini } from "../services/geminiRouteAnalyzer";

export const useRouting = (getRoutingService, floodZones) => {
  const [routeStart, setRouteStart] = useState(null);
  const [routeEnd, setRouteEnd] = useState(null);
  const [allRoutes, setAllRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [geminiRecommendation, setGeminiRecommendation] = useState(null);
  const [useGeminiSelection, setUseGeminiSelection] = useState(true); // Toggle Gemini AI

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
      console.log("🌊 STRATEGY: Gọi 2 API → Route ngắn + Route tránh ngập");

      // Chuẩn bị zones để tránh (chỉ dùng cho request 2)
      const zonesToAvoid = selectFloodZonesToAvoid(
        floodZones,
        start,
        end,
        ROUTING_CONFIG.avoidRiskLevels,
        ROUTING_CONFIG.maxAvoidAreas
      );

      const baseParams = {
        routingMode: modeConfig.routingMode || ROUTING_CONFIG.routingMode,
        transportMode: modeConfig.apiValue || transportMode,
        origin: `${start.lat},${start.lng}`,
        destination: `${end.lat},${end.lng}`,
        return: ROUTING_CONFIG.returnValues,
        alternatives: 3, // Mỗi loại lấy 3 routes
        spans: "names,length,duration",
      };

      // 📍 REQUEST 1: Routes NGẮN NHẤT (không tránh)
      const shortRouteParams = { ...baseParams };

      // 📍 REQUEST 2: Routes TRÁNH NGẬP (có avoid)
      const safeRouteParams = { ...baseParams };
      if (zonesToAvoid.length > 0) {
        const avoidAreasString = convertFloodZonesToAvoidAreas(
          zonesToAvoid,
          ROUTING_CONFIG.floodBufferMeters
        );
        if (avoidAreasString) {
          safeRouteParams["avoid[areas]"] = avoidAreasString;
        }
      }

      console.log(`📊 Gọi 2 requests: 3 routes ngắn + 3 routes an toàn...`);

      // Wrap trong Promise và return
      return new Promise((resolve, reject) => {
        // Gọi song song cả 2 requests
        Promise.all([
          new Promise((res, rej) =>
            router.calculateRoute(shortRouteParams, res, rej)
          ),
          new Promise((res, rej) =>
            router.calculateRoute(safeRouteParams, res, rej)
          ),
        ])
          .then(([shortResult, safeResult]) => {
            console.log("✅ Nhận routes từ 2 requests");
            console.log(`   - Ngắn: ${shortResult.routes?.length || 0} routes`);
            console.log(
              `   - An toàn: ${safeResult.routes?.length || 0} routes`
            );

            // Merge routes từ cả 2 requests
            const allRoutes = [
              ...(shortResult.routes || []),
              ...(safeResult.routes || []),
            ];

            if (allRoutes.length === 0) {
              setLoading(false);
              setError("Không tìm thấy route");
              reject(new Error("No routes found"));
              return;
            }

            console.log(
              `📊 Tổng: ${allRoutes.length} routes → Phân tích & sort...`
            );

            // Analyze all routes for flood
            const analyzedRoutes = analyzeRoutesFlood(allRoutes, floodZones);

            // ✅ KIỂM TRA: Nếu tất cả routes đều ngập
            if (analyzedRoutes.allUnsafe) {
              console.error("❌", analyzedRoutes.message);
              setLoading(false);
              setError(analyzedRoutes.message);
              setAllRoutes([]);
              // ✅ KHÔNG reject - resolve với mảng rỗng để UI hiển thị thông báo
              resolve([]);
              return;
            }

            // ✅ KIỂM TRA: Nếu không có routes an toàn nào
            if (!analyzedRoutes || analyzedRoutes.length === 0) {
              console.error("❌ Không tìm thấy tuyến đường an toàn");
              const errorMessage =
                "Không tìm thấy tuyến đường an toàn. Tất cả các đường đều đi qua vùng ngập lụt.";
              setLoading(false);
              setError(errorMessage);
              setAllRoutes([]);
              // ✅ KHÔNG reject - resolve với mảng rỗng để UI hiển thị thông báo
              resolve([]);
              return;
            }

            // Log analysis với chi tiết
            console.log("🔍 Kết quả phân tích các tuyến đường AN TOÀN:");
            analyzedRoutes.forEach((analysis, index) => {
              console.log(
                `  ${index + 1}. ${analysis.distance.toFixed(
                  2
                )} km, ${Math.round(analysis.duration)} phút - ✅ An toàn`
              );
            });

            // Select best route (route đầu tiên sau khi sort)
            let bestRoute = selectBestRoute(analyzedRoutes);

            // 🤖 Gemini AI: Phân tích thông minh để chọn route tốt nhất
            const processGeminiAnalysis = async () => {
              if (useGeminiSelection) {
                console.log("🤖 Bật Gemini AI Route Analyzer...");
                try {
                  const geminiResult = await analyzeRoutesWithGemini(
                    analyzedRoutes,
                    {
                      prioritySafety: true, // Ưu tiên an toàn
                      prioritySpeed: transportMode === "car",
                      priorityDistance: transportMode === "pedestrian",
                    }
                  );

                  if (geminiResult.success) {
                    console.log("✅ Gemini recommend:", geminiResult);
                    setGeminiRecommendation(geminiResult);

                    // Override bestRoute với recommendation từ Gemini
                    bestRoute = {
                      ...analyzedRoutes[geminiResult.recommendedIndex],
                      bestIndex: geminiResult.recommendedIndex,
                      aiReasoning: geminiResult.reasoning,
                      aiSafetyScore: geminiResult.safetyScore,
                    };
                  } else {
                    console.log("⚠️ Gemini failed, using algorithm selection");
                  }
                } catch (geminiError) {
                  console.error("❌ Gemini error:", geminiError);
                  console.log("🔄 Fallback to algorithm selection");
                }
              } else {
                console.log("ℹ️ Gemini disabled, using algorithm selection");
                setGeminiRecommendation(null);
              }

              return bestRoute;
            };

            // Execute Gemini analysis then finalize route
            processGeminiAnalysis()
              .then((finalBestRoute) => {
                // ✅ Tất cả routes đã được lọc là AN TOÀN (floodCount = 0)
                console.log(
                  `✅ Đề xuất route AN TOÀN ${
                    finalBestRoute.bestIndex + 1
                  }: ${finalBestRoute.distance.toFixed(2)} km, ${Math.round(
                    finalBestRoute.duration
                  )} phút - ✅ Không đi qua vùng ngập`
                );

                setAllRoutes(analyzedRoutes);
                setSelectedRouteIndex(finalBestRoute.bestIndex);
                setRouteStart(start);
                setRouteEnd(end);
                setLoading(false);

                resolve(analyzedRoutes);
              })
              .catch((error) => {
                console.error("❌ Error in Gemini processing:", error);
                // Fallback: use algorithm selection
                setAllRoutes(analyzedRoutes);
                setSelectedRouteIndex(bestRoute.bestIndex);
                setRouteStart(start);
                setRouteEnd(end);
                setLoading(false);
                resolve(analyzedRoutes);
              });
          })
          .catch((err) => {
            console.error("❌ Routing error:", err);
            setLoading(false);
            setError("Không thể tính toán đường đi");
            reject(err);
          });
      }); // End of outer Promise
    },
    [getRoutingService, floodZones, useGeminiSelection]
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
    setGeminiRecommendation(null);
    console.log("🗑️ Routes cleared");
  }, []);

  /**
   * Toggle Gemini AI selection
   */
  const toggleGeminiSelection = useCallback((enabled) => {
    setUseGeminiSelection(enabled);
    console.log(
      `🤖 Gemini AI Route Selection: ${enabled ? "ENABLED" : "DISABLED"}`
    );
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
    geminiRecommendation,
    useGeminiSelection,
    calculateRoute,
    selectRoute,
    clearRoute,
    toggleGeminiSelection,
    setRouteStart,
    setRouteEnd,
  };
};
