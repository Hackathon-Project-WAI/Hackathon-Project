/**
 * Custom Hook - usePersonalizedAlert
 * Hook để quản lý personalized alerts cho user
 */
import { useState, useCallback, useEffect } from 'react';
import { personalizedAlertApi } from '../api';

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
      setLocations(result.locations || []);
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

