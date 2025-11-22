/**
 * useRouting Hook
 * Hook để quản lý routing logic
 */

import { useState, useCallback, useMemo } from 'react';
import { ROUTING_CONFIG } from '../utils/routeConstants';
import { analyzeRoutesFlood, selectBestRoute } from '../utils/floodCalculations';

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
      type: 'flood_intersection',
      zones: selectedRoute.affectedZones,
      message: `⚠️ Cảnh báo: Đường đi qua ${selectedRoute.floodCount} khu vực ngập lụt!`,
      alternativesChecked: allRoutes.length,
    };
  }, [selectedRoute, allRoutes]);

  /**
   * Calculate route
   */
  const calculateRoute = useCallback(
    async (start, end, avoidFloods = true) => {
      if (!start || !end) {
        console.error('Missing start or end point');
        return;
      }

      const router = getRoutingService();
      if (!router) {
        console.error('Routing service not available');
        return;
      }

      setLoading(true);
      setError(null);

      console.log(`🚗 Calculating route from`, start, 'to', end);
      console.log('🌊 Avoid floods:', avoidFloods);

      // Build avoid areas from flood zones
      let avoidAreas = [];
      if (avoidFloods && floodZones && floodZones.length > 0) {
        avoidAreas = floodZones.map((zone) => {
          const lat = zone.coords?.lat || zone.lat;
          const lng = zone.coords?.lng || zone.lng;
          const radius = zone.radius || 500;
          return `${lat},${lng};r=${radius}`;
        });
        console.log(`🚫 Avoiding ${avoidAreas.length} flood zones`);
      }

      const routingParameters = {
        routingMode: ROUTING_CONFIG.routingMode,
        transportMode: ROUTING_CONFIG.transportMode,
        origin: `${start.lat},${start.lng}`,
        destination: `${end.lat},${end.lng}`,
        return: ROUTING_CONFIG.returnValues,
        alternatives: ROUTING_CONFIG.maxAlternatives,
      };

      // Add avoid areas if applicable
      if (avoidAreas.length > 0) {
        routingParameters.avoid = {
          areas: avoidAreas.slice(0, ROUTING_CONFIG.maxAvoidAreas),
        };
      }

      return new Promise((resolve, reject) => {
        router.calculateRoute(
          routingParameters,
          (result) => {
            console.log('✅ Route calculated:', result);

            if (!result.routes || result.routes.length === 0) {
              setLoading(false);
              setError('Không tìm thấy route');
              reject(new Error('No routes found'));
              return;
            }

            console.log(`📊 Nhận được ${result.routes.length} routes, đang phân tích...`);

            // Analyze all routes for flood
            const analyzedRoutes = analyzeRoutesFlood(result.routes, floodZones);

            // Log analysis
            analyzedRoutes.forEach((analysis, index) => {
              console.log(`  📍 Route ${index + 1}:`);
              console.log(`     - Khoảng cách: ${analysis.distance.toFixed(2)} km`);
              console.log(`     - Vùng ngập: ${analysis.floodCount} zones`);
            });

            // Select best route
            const bestRoute = selectBestRoute(analyzedRoutes);
            console.log(
              `✅ Tự động chọn route ${bestRoute.bestIndex + 1} (${bestRoute.floodCount} vùng ngập, ${bestRoute.distance.toFixed(2)} km)`
            );

            setAllRoutes(analyzedRoutes);
            setSelectedRouteIndex(bestRoute.bestIndex);
            setRouteStart(start);
            setRouteEnd(end);
            setLoading(false);

            resolve(analyzedRoutes);
          },
          (err) => {
            console.error('❌ Routing error:', err);

            // Retry without avoid areas if error
            if (avoidFloods && err.message && err.message.includes('avoid')) {
              console.log('⚠️ Không thể tránh tất cả vùng ngập, thử lại...');
              calculateRoute(start, end, false).then(resolve).catch(reject);
            } else {
              setLoading(false);
              setError('Không thể tính toán đường đi');
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
  const selectRoute = useCallback((index) => {
    if (!allRoutes || index >= allRoutes.length || index < 0) return;

    console.log(`📍 User chọn route ${index + 1}`);
    setSelectedRouteIndex(index);
  }, [allRoutes]);

  /**
   * Clear all routes
   */
  const clearRoute = useCallback(() => {
    setRouteStart(null);
    setRouteEnd(null);
    setAllRoutes([]);
    setSelectedRouteIndex(0);
    setError(null);
    console.log('🗑️ Routes cleared');
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






