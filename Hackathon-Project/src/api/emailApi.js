/**
 * Email API Service
 * Tất cả các API calls liên quan đến email
 */
import apiClient from './client';
import { API_ENDPOINTS } from './config';

/**
 * Gửi test email đơn giản
 * @param {string} to - Email người nhận
 */
export const sendTestEmail = async (to) => {
  const response = await apiClient.post(API_ENDPOINTS.SEND_TEST_EMAIL, { to });
  return response.data;
};

/**
 * Gửi email tùy chỉnh
 * @param {Object} emailData - { to, subject, html, text }
 */
export const sendEmail = async (emailData) => {
  const response = await apiClient.post(API_ENDPOINTS.SEND_EMAIL, emailData);
  return response.data;
};

/**
 * Gửi cảnh báo lũ lụt với template có sẵn
 * @param {string} to - Email người nhận
 * @param {Object} alertData - { district, level, rainfall, time }
 */
export const sendFloodAlert = async (to, alertData) => {
  const response = await apiClient.post(API_ENDPOINTS.SEND_FLOOD_ALERT, {
    to,
    alertData,
  });
  return response.data;
};

/**
 * Gửi cập nhật thông tin thời tiết
 * @param {string} to - Email người nhận
 * @param {Object} weatherData - { location, temperature, humidity, rainChance, windSpeed, date, description }
 */
export const sendWeatherUpdate = async (to, weatherData) => {
  const response = await apiClient.post(API_ENDPOINTS.SEND_WEATHER_UPDATE, {
    to,
    weatherData,
  });
  return response.data;
};

/**
 * Gửi bulk alerts cho nhiều người dùng
 * @param {Array<string>} emails - Danh sách emails
 * @param {Object} alertData - Dữ liệu cảnh báo
 */
export const sendBulkFloodAlerts = async (emails, alertData) => {
  const promises = emails.map((email) => sendFloodAlert(email, alertData));
  const results = await Promise.allSettled(promises);
  
  return {
    success: results.filter((r) => r.status === 'fulfilled').length,
    failed: results.filter((r) => r.status === 'rejected').length,
    results,
  };
};

export default {
  sendTestEmail,
  sendEmail,
  sendFloodAlert,
  sendWeatherUpdate,
  sendBulkFloodAlerts,
};

