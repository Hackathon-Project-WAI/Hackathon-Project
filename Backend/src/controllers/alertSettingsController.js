const alertSettingsService = require("../services/alertSettingsService");
const schedulerService = require("../services/schedulerService");

/**
 * Controller quản lý API cho Alert Settings
 */
class AlertSettingsController {
  /**
   * GET /api/alert-settings/:userId
   * Lấy cấu hình cảnh báo của user
   */
  async getAlertSettings(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "Missing userId",
        });
      }

      const settings = await alertSettingsService.getAlertSettings(userId);

      res.json({
        success: true,
        settings: settings,
      });
    } catch (error) {
      console.error("❌ Lỗi lấy alert settings:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/alert-settings/:userId
   * Cập nhật cấu hình cảnh báo
   */
  async updateAlertSettings(req, res) {
    try {
      const { userId } = req.params;
      const settings = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "Missing userId",
        });
      }

      // Cập nhật settings
      const result = await alertSettingsService.updateAlertSettings(
        userId,
        settings
      );

      // Restart scheduler cho user này nếu đang chạy
      if (schedulerService.isRunning) {
        await schedulerService.restartUserScheduler(userId);
      }

      res.json({
        success: true,
        message: "Alert settings updated successfully",
        settings: result.settings,
      });
    } catch (error) {
      console.error("❌ Lỗi cập nhật alert settings:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Server error",
        error: error.message,
      });
    }
  }

  /**
   * POST /api/alert-settings/:userId/toggle
   * Bật/tắt cảnh báo tự động
   */
  async toggleAlertSettings(req, res) {
    try {
      const { userId } = req.params;
      const { enabled } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "Missing userId",
        });
      }

      if (typeof enabled !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "enabled phải là true hoặc false",
        });
      }

      // Toggle settings
      await alertSettingsService.toggleAlertSettings(userId, enabled);

      // Restart hoặc stop scheduler
      if (enabled) {
        const settings = await alertSettingsService.getAlertSettings(userId);
        schedulerService.startUserScheduler(userId, settings);
      } else {
        schedulerService.stopUserScheduler(userId);
      }

      res.json({
        success: true,
        message: enabled
          ? "Đã BẬT cảnh báo tự động"
          : "Đã TẮT cảnh báo tự động",
        enabled: enabled,
      });
    } catch (error) {
      console.error("❌ Lỗi toggle alert settings:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  /**
   * DELETE /api/alert-settings/:userId
   * Xóa cấu hình cảnh báo
   */
  async deleteAlertSettings(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "Missing userId",
        });
      }

      // Dừng scheduler trước
      schedulerService.stopUserScheduler(userId);

      // Xóa settings
      await alertSettingsService.deleteAlertSettings(userId);

      res.json({
        success: true,
        message: "Alert settings deleted successfully",
      });
    } catch (error) {
      console.error("❌ Lỗi xóa alert settings:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  /**
   * GET /api/alert-settings/:userId/logs
   * Lấy lịch sử cảnh báo
   */
  async getAlertLogs(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 20 } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "Missing userId",
        });
      }

      const admin = require("firebase-admin");
      const db = admin.database();
      const logsRef = db.ref(`userSettings/${userId}/alertLogs`);

      const snapshot = await logsRef
        .orderByChild("sentAt")
        .limitToLast(parseInt(limit))
        .once("value");

      const logs = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          logs.push({
            id: child.key,
            ...child.val(),
          });
        });
      }

      // Đảo ngược để log mới nhất ở đầu
      logs.reverse();

      res.json({
        success: true,
        total: logs.length,
        logs: logs,
      });
    } catch (error) {
      console.error("❌ Lỗi lấy alert logs:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  /**
   * POST /api/alert-settings/:userId/test
   * Test gửi cảnh báo ngay lập tức (không đợi scheduler)
   */
  async testAlert(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "Missing userId",
        });
      }

      // Lấy settings
      const settings = await alertSettingsService.getAlertSettings(userId);

      if (!settings.email) {
        return res.status(400).json({
          success: false,
          message: "Chưa cấu hình email",
        });
      }

      if (!settings.sensorIds || settings.sensorIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Chưa cấu hình sensor IDs",
        });
      }

      // Test check ngay
      await schedulerService.checkAndAlert(
        userId,
        settings.sensorIds,
        settings.threshold,
        settings.email
      );

      res.json({
        success: true,
        message: "Test alert completed. Check console and email.",
      });
    } catch (error) {
      console.error("❌ Lỗi test alert:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  /**
   * GET /api/scheduler/status
   * Lấy trạng thái scheduler
   */
  async getSchedulerStatus(req, res) {
    try {
      const status = schedulerService.getStatus();

      res.json({
        success: true,
        scheduler: status,
      });
    } catch (error) {
      console.error("❌ Lỗi lấy scheduler status:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
}

module.exports = new AlertSettingsController();


