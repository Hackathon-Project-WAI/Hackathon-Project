/**
 * Custom Hook - useEmailAlert
 * Hook để gửi email alerts dễ dàng
 */
import { useState, useCallback } from 'react';
import { emailApi } from '../api';

export const useEmailAlert = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  /**
   * Gửi test email
   */
  const sendTestEmail = useCallback(async (to) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await emailApi.sendTestEmail(to);
      setSuccess(true);
      return result;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Gửi flood alert
   */
  const sendFloodAlert = useCallback(async (to, alertData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await emailApi.sendFloodAlert(to, alertData);
      setSuccess(true);
      return result;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Gửi weather update
   */
  const sendWeatherUpdate = useCallback(async (to, weatherData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await emailApi.sendWeatherUpdate(to, weatherData);
      setSuccess(true);
      return result;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Gửi custom email
   */
  const sendCustomEmail = useCallback(async (emailData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await emailApi.sendEmail(emailData);
      setSuccess(true);
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
    setSuccess(false);
  }, []);

  return {
    loading,
    error,
    success,
    sendTestEmail,
    sendFloodAlert,
    sendWeatherUpdate,
    sendCustomEmail,
    reset,
  };
};

export default useEmailAlert;

