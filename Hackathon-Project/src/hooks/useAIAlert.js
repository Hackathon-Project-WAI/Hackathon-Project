/**
 * Custom Hook - useAIAlert
 * Hook để tạo AI-generated alerts
 */
import { useState, useCallback } from 'react';
import { aiAlertApi } from '../api';

export const useAIAlert = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState(null);

  /**
   * Generate flood alert từ sensor data
   */
  const generateAlert = useCallback(async (alertData) => {
    setLoading(true);
    setError(null);
    setAlert(null);

    try {
      const result = await aiAlertApi.generateFloodAlert(alertData);
      setAlert(result.alert);
      return result;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Generate alert từ sensor object
   */
  const generateFromSensor = useCallback(async (sensorData, userEmail = null) => {
    setLoading(true);
    setError(null);
    setAlert(null);

    try {
      const result = await aiAlertApi.generateAlertFromSensor(sensorData, userEmail);
      setAlert(result.alert);
      return result;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Generate bulk alerts từ nhiều sensors
   */
  const generateBulkAlerts = useCallback(async (sensors, userEmail) => {
    setLoading(true);
    setError(null);

    try {
      const result = await aiAlertApi.generateBulkAlertsFromSensors(sensors, userEmail);
      return result;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reset states
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setAlert(null);
  }, []);

  return {
    loading,
    error,
    alert,
    generateAlert,
    generateFromSensor,
    generateBulkAlerts,
    reset,
  };
};

export default useAIAlert;

