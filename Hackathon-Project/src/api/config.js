/**
 * API Configuration
 * Quản lý tất cả các endpoints và base URL
 */

// Base URL cho Backend API
export const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';

// API Endpoints
export const API_ENDPOINTS = {
  // Email APIs
  SEND_TEST_EMAIL: '/api/send-test-email',
  SEND_EMAIL: '/api/send-email',
  SEND_FLOOD_ALERT: '/api/send-flood-alert',
  SEND_WEATHER_UPDATE: '/api/send-weather-update',
  
  // AI Alert APIs
  GENERATE_FLOOD_ALERT: '/api/generate-flood-alert',
  
  // Firebase APIs
  FIREBASE_SENSORS: '/api/firebase/sensors',
  FIREBASE_SENSOR_BY_ID: (sensorId) => `/api/firebase/sensors/${sensorId}`,
  
  // Personalized Alert APIs
  CHECK_USER_LOCATIONS_ALERT: '/api/check-user-locations-alert',
  GET_USER_LOCATIONS: (userId) => `/api/user-locations/${userId}`,
};

// Timeout configuration
export const API_TIMEOUT = 30000; // 30 seconds

// Retry configuration
export const API_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  API_TIMEOUT,
  API_RETRY_CONFIG,
};

