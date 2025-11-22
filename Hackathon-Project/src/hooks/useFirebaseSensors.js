/**
 * Custom Hook - useFirebaseSensors
 * Hook để lấy và theo dõi Firebase sensors
 */
import { useState, useEffect, useCallback } from 'react';
import { firebaseApi } from '../api';

export const useFirebaseSensors = (autoRefresh = false, refreshInterval = 5000) => {
  const [sensors, setSensors] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  /**
   * Fetch all sensors
   */
  const fetchSensors = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await firebaseApi.getAllSensors();
      setSensors(result.data);
      setLastUpdate(new Date());
      return result;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch 1 sensor cụ thể
   */
  const fetchSensorById = useCallback(async (sensorId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await firebaseApi.getSensorById(sensorId);
      return result.data;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Check dangerous sensors
   */
  const checkDangerousSensors = useCallback(() => {
    if (!sensors) return [];
    return firebaseApi.checkDangerousSensors({ data: sensors });
  }, [sensors]);

  /**
   * Auto refresh sensors
   */
  useEffect(() => {
    // ✅ CHỈ fetch khi autoRefresh = true
    if (!autoRefresh) {
      console.log('⏭️ Firebase Sensors: Không fetch (đã tắt)');
      // Clear sensors khi tắt
      setSensors(null);
      return;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔥 FIREBASE SENSORS: Bắt đầu fetch dữ liệu sensor IoT');
    console.log(`⏱️  Interval: ${refreshInterval / 1000}s`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Initial fetch
    fetchSensors();

    // Setup auto refresh với cleanup
    let cleanupFn = null;
    cleanupFn = firebaseApi.watchAllSensors((data) => {
      setSensors(data.data);
      setLastUpdate(new Date());
    }, refreshInterval);

    // Cleanup khi unmount hoặc autoRefresh thay đổi
    return () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🛑 FIREBASE SENSORS: Dừng watch interval');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      if (cleanupFn) {
        cleanupFn();
      }
    };
  }, [autoRefresh, refreshInterval, fetchSensors]);

  return {
    sensors,
    loading,
    error,
    lastUpdate,
    fetchSensors,
    fetchSensorById,
    checkDangerousSensors,
    dangerousSensors: checkDangerousSensors(),
  };
};

export default useFirebaseSensors;

