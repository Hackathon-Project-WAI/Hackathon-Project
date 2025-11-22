/**
 * Custom Hook - usePersonalizedAlert
 * Hook để quản lý personalized alerts cho user
 */
import { useState, useCallback, useEffect } from 'react';
import { personalizedAlertApi } from '../api';
import { getFloodZonesAtPoint } from '../utils/floodCalculations';
import floodData from '../data/floodProneAreas.json';

export const usePersonalizedAlert = (userId = null, autoFetch = false) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locations, setLocations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);

  /**
   * Fetch user locations
   */
  const fetchLocations = useCallback(async (uid = userId) => {
    if (!uid) {
      setError('User ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await personalizedAlertApi.getUserLocations(uid);
      const rawLocations = result.locations || [];
      
      // Kiểm tra và cập nhật status cho mỗi location
      const updatedLocations = rawLocations.map((loc) => {
        // Kiểm tra vùng ngập cho location này
        const floodZones = getFloodZonesAtPoint(
          loc.coords.lat,
          loc.coords.lon,
          floodData.floodPrones || []
        );

        console.log(`🔍 [Hook] Check location "${loc.name}":`, {
          coords: loc.coords,
          floodZones: floodZones.length,
          currentStatus: loc.last_alert_status,
        });

        // Tính toán status mới
        let newStatus = null;
        if (floodZones.length > 0) {
          const hasHighRisk = floodZones.some((z) => z.riskLevel === "high");
          const hasMediumRisk = floodZones.some((z) => z.riskLevel === "medium");

          if (hasHighRisk) {
            newStatus = "critical";
          } else if (hasMediumRisk) {
            newStatus = "danger";
          } else {
            newStatus = "warning";
          }
        }
        // Nếu không có flood zone thì để null (sẽ hiển thị là safe)

        console.log(`✅ [Hook] Updated status cho "${loc.name}": ${newStatus || "safe"}`);

        return {
          ...loc,
          last_alert_status: newStatus,
        };
      });
      
      setLocations(updatedLocations);
      return result;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Check locations và gửi alerts
   */
  const checkLocationsAndAlert = useCallback(
    async (minRiskLevel = 1, sendEmail = true, uid = userId) => {
      if (!uid) {
        setError('User ID is required');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await personalizedAlertApi.checkUserLocationsAndAlert(
          uid,
          minRiskLevel,
          sendEmail
        );
        setAlerts(result.alerts || []);
        return result;
      } catch (err) {
        setError(err.response?.data?.error || err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  /**
   * Get location stats
   */
  const fetchLocationStats = useCallback(
    async (uid = userId) => {
      if (!uid) {
        setError('User ID is required');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await personalizedAlertApi.getUserLocationStats(uid);
        setStats(result);
        return result;
      } catch (err) {
        setError(err.response?.data?.error || err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  /**
   * Check single location
   */
  const checkSingleLocation = useCallback(
    async (locationId, sendEmail = true, uid = userId) => {
      if (!uid) {
        setError('User ID is required');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await personalizedAlertApi.checkSingleLocation(
          uid,
          locationId,
          sendEmail
        );
        return result;
      } catch (err) {
        setError(err.response?.data?.error || err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  /**
   * Auto fetch locations when userId changes (chỉ khi autoFetch = true)
   */
  useEffect(() => {
    if (!autoFetch) {
      console.log('⏭️ User Locations: Không fetch (autoFetch = false)');
      return;
    }
    
    if (userId) {
      console.log('📍 User Locations: Fetch locations cho user...');
      fetchLocations(userId);
    }
  }, [userId, autoFetch, fetchLocations]);

  /**
   * Reset states
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setLocations([]);
    setAlerts([]);
    setStats(null);
  }, []);

  return {
    loading,
    error,
    locations,
    alerts,
    stats,
    fetchLocations,
    checkLocationsAndAlert,
    fetchLocationStats,
    checkSingleLocation,
    reset,
  };
};

export default usePersonalizedAlert;

