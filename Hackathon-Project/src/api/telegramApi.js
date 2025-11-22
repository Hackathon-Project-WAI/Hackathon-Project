/**
 * Telegram QR Code API
 * API để lấy thông tin QR code của Telegram Bot
 */

import client from './client';

/**
 * Lấy thông tin QR code cho Telegram Bot
 * @param {string} userId - Firebase User ID để auto-link khi quét QR
 */
export const getTelegramQRInfo = async (userId = null) => {
  try {
    const params = userId ? { userId } : {};
    const response = await client.get('/api/telegram/qr-info', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching Telegram QR info:', error);
    throw error;
  }
};

/**
 * Lấy thông tin chi tiết về bot
 */
export const getBotInfo = async () => {
  try {
    const response = await client.get('/api/telegram/info');
    return response.data;
  } catch (error) {
    console.error('Error fetching bot info:', error);
    throw error;
  }
};

/**
 * Kiểm tra trạng thái liên kết Telegram của user
 * @param {string} userId - Firebase User ID
 */
export const checkTelegramStatus = async (userId) => {
  try {
    const response = await client.get('/api/telegram/status', {
      params: { userId }
    });
    return response.data;
  } catch (error) {
    console.error('Error checking Telegram status:', error);
    throw error;
  }
};

/**
 * Hủy liên kết Telegram
 * @param {string} userId - Firebase User ID
 */
export const unlinkTelegram = async (userId) => {
  try {
    const response = await client.delete('/api/telegram/unlink', {
      params: { userId }
    });
    return response.data;
  } catch (error) {
    console.error('Error unlinking Telegram:', error);
    throw error;
  }
};
