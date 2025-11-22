/**
 * Telegram Routes
 * Routes cho Telegram Bot và QR Code
 */

const express = require('express');
const router = express.Router();
const { getTelegramQRInfo, getBotInfo } = require('../controllers/telegramQRController');
const { checkTelegramStatus, unlinkTelegram } = require('../controllers/telegramStatusController');

/**
 * @route GET /api/telegram/qr-info
 * @desc Lấy thông tin để tạo QR code
 * @access Public
 */
router.get('/qr-info', getTelegramQRInfo);

/**
 * @route GET /api/telegram/info
 * @desc Lấy thông tin chi tiết về bot
 * @access Public
 */
router.get('/info', getBotInfo);

/**
 * @route GET /api/telegram/status
 * @desc Kiểm tra trạng thái liên kết Telegram của user
 * @access Public
 */
router.get('/status', checkTelegramStatus);

/**
 * @route DELETE /api/telegram/unlink
 * @desc Hủy liên kết Telegram
 * @access Public
 */
router.delete('/unlink', unlinkTelegram);

module.exports = router;
