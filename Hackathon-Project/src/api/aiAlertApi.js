/**
 * AI Alert API Service
 * API calls cho tính năng AI-generated alerts
 */
import apiClient from './client';
import { API_ENDPOINTS } from './config';

/**
 * Tạo cảnh báo lũ lụt bằng Gemini AI từ dữ liệu sensor
 * @param {Object} alertData - Dữ liệu từ IoT sensor
 * @param {number} alertData.current_percent - Mức ngập hiện tại (%)
 * @param {number} alertData.previous_percent - Mức ngập trước đó (%)
 * @param {string} alertData.location - Tên vị trí/trạm
 * @param {string} alertData.timestamp - Thời gian (ISO string)
 * @param {string} alertData.to - Email người nhận (optional)
 * @returns {Promise<Object>} - { success, alert: { subject, htmlBody }, emailResult }
 */
export const generateFloodAlert = async (alertData) => {
  try {
    const response = await apiClient.post(
      API_ENDPOINTS.GENERATE_FLOOD_ALERT,
      alertData
    );
    return response.data;
  } catch (error) {
    console.error('Error generating AI flood alert:', error);
    throw error;
  }
};

/**
 * Tạo cảnh báo từ sensor data (wrapper cho generateFloodAlert)
 * @param {Object} sensorData - Dữ liệu từ Firebase IoT sensor
 * @param {string} userEmail - Email để gửi cảnh báo (optional)
 */
export const generateAlertFromSensor = async (sensorData, userEmail = null) => {
  const alertData = {
    current_percent: sensorData.water_level_percentage || sensorData.water_level_cm,
    previous_percent: sensorData.previous_level || sensorData.water_level_cm - 10,
    location: sensorData.device_id || sensorData.location || 'Unknown Location',
    timestamp: sensorData.timestamp || new Date().toISOString(),
    to: userEmail,
  };

  return generateFloodAlert(alertData);
};

/**
 * Tạo multiple alerts từ nhiều sensors
 * @param {Array<Object>} sensors - Danh sách sensors
 * @param {string} userEmail - Email người nhận
 */
export const generateBulkAlertsFromSensors = async (sensors, userEmail) => {
  const promises = sensors.map((sensor) =>
    generateAlertFromSensor(sensor, userEmail)
  );
  
  const results = await Promise.allSettled(promises);
  
  return {
    success: results.filter((r) => r.status === 'fulfilled').length,
    failed: results.filter((r) => r.status === 'rejected').length,
    results: results.map((r, index) => ({
      sensor: sensors[index],
      status: r.status,
      data: r.status === 'fulfilled' ? r.value : null,
      error: r.status === 'rejected' ? r.reason.message : null,
    })),
  };
};

export default {
  generateFloodAlert,
  generateAlertFromSensor,
  generateBulkAlertsFromSensors,
};

