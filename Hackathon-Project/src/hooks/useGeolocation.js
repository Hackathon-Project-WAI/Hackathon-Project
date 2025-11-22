/**
 * useGeolocation Hook
 * Hook để quản lý geolocation
 */

import { useState, useCallback } from 'react';
import { GEOLOCATION_CONFIG, PERMISSION_STATES } from '../utils/routeConstants';

export const useGeolocation = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(PERMISSION_STATES.PROMPT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Request user's current location
   */
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ Geolocation!');
      setLocationPermission(PERMISSION_STATES.DENIED);
      return Promise.reject(new Error('Geolocation not supported'));
    }

    setLoading(true);
    setError(null);
    console.log('📍 Đang yêu cầu vị trí người dùng...');

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };

          setUserLocation(userPos);
          setLocationPermission(PERMISSION_STATES.GRANTED);
          setLoading(false);

          console.log('✅ Vị trí người dùng:', userPos);
          resolve(userPos);
        },
        (err) => {
          console.error('❌ Lỗi geolocation:', err);
          setLocationPermission(PERMISSION_STATES.DENIED);
          setLoading(false);

          let message = 'Không thể lấy vị trí của bạn. ';
          switch (err.code) {
            case err.PERMISSION_DENIED:
              message += 'Bạn đã từ chối chia sẻ vị trí.';
              break;
            case err.POSITION_UNAVAILABLE:
              message += 'Thông tin vị trí không khả dụng.';
              break;
            case err.TIMEOUT:
              message += 'Timeout khi lấy vị trí.';
              break;
            default:
              message += 'Lỗi không xác định.';
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

        setUserLocation(userPos);
        setLocationPermission(PERMISSION_STATES.GRANTED);

        if (onLocationUpdate) {
          onLocationUpdate(userPos);
        }
      },
      (err) => {
        console.error('❌ Watch location error:', err);
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
    watchLocation,
    resetLocation,
  };
};






