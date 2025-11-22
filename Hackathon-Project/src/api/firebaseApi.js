/**
 * Firebase API Service
 * API calls để lấy dữ liệu từ Firebase Realtime Database qua Backend
 */
import apiClient from './client';
import { API_ENDPOINTS } from './config';

/**
 * Lấy tất cả sensors từ Firebase
 * @returns {Promise<Object>} - { success, data: { SENSOR_ROAD, SENSOR_SEWER, water_level_status } }
 */
export const getAllSensors = async () => {
  try {
    console.log('📡 API REQUEST: GET /api/firebase/sensors');
    const response = await apiClient.get(API_ENDPOINTS.FIREBASE_SENSORS);
    return response.data;
  } catch (error) {
    console.error('Error fetching all sensors:', error);
    throw error;
  }
};

/**
 * Lấy dữ liệu 1 sensor cụ thể
 * @param {string} sensorId - ID của sensor (ví dụ: "SENSOR_ROAD")
 * @returns {Promise<Object>} - { success, data: { device_id, flood_status, water_level_cm, ... } }
 */
export const getSensorById = async (sensorId) => {
  try {
    const response = await apiClient.get(
      API_ENDPOINTS.FIREBASE_SENSOR_BY_ID(sensorId)
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching sensor ${sensorId}:`, error);
    throw error;
  }
};

/**
 * Theo dõi sensors (polling every N seconds)
 * @param {Function} callback - Callback function nhận data mỗi khi update
 * @param {number} interval - Polling interval (ms), default 5000ms
 * @returns {Function} - Cleanup function để stop polling
 */
export const watchAllSensors = (callback, interval = 5000) => {
  const intervalId = setInterval(async () => {
    try {
      const data = await getAllSensors();
      callback(data);
    } catch (error) {
      console.error('Error in watchAllSensors:', error);
    }
  }, interval);

  // Return cleanup function
  return () => clearInterval(intervalId);
};

/**
 * Theo dõi 1 sensor cụ thể
 * @param {string} sensorId - ID của sensor
 * @param {Function} callback - Callback function
 * @param {number} interval - Polling interval (ms)
 * @returns {Function} - Cleanup function
 */
export const watchSensor = (sensorId, callback, interval = 5000) => {
  const intervalId = setInterval(async () => {
    try {
      const data = await getSensorById(sensorId);
      callback(data);
    } catch (error) {
      console.error(`Error watching sensor ${sensorId}:`, error);
    }
  }, interval);

  return () => clearInterval(intervalId);
};

/**
 * Kiểm tra sensors có vượt ngưỡng nguy hiểm không
 * @param {Object} sensorsData - Data từ getAllSensors()
 * @returns {Array<Object>} - Danh sách sensors có nguy cơ
 */
export const checkDangerousSensors = (sensorsData) => {
  if (!sensorsData || !sensorsData.data) return [];

  const dangerousSensors = [];
  const data = sensorsData.data;

  // Check SENSOR_ROAD
  if (data.SENSOR_ROAD && data.SENSOR_ROAD.flood_status === 'DANGER') {
    dangerousSensors.push({
      id: 'SENSOR_ROAD',
      ...data.SENSOR_ROAD,
    });
  }

  // Check SENSOR_SEWER
  if (data.SENSOR_SEWER && data.SENSOR_SEWER.flood_status === 'DANGER') {
    dangerousSensors.push({
      id: 'SENSOR_SEWER',
      ...data.SENSOR_SEWER,
    });
  }

  return dangerousSensors;
};

export default {
  getAllSensors,
  getSensorById,
  watchAllSensors,
  watchSensor,
  checkDangerousSensors,
};

