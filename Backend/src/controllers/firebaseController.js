const firebaseClient = require("../integrations/firebaseClient");

class FirebaseController {
  /**
   * GET /api/firebase/sensors
   * Lấy tất cả sensors
   */
  async getAllSensors(req, res) {
    try {
      // Kiểm tra Firebase có được khởi tạo không
      if (!firebaseClient.initialized) {
        return res.status(503).json({
          success: false,
          error:
            "Firebase chưa được cấu hình. Kiểm tra FIREBASE_SERVICE_ACCOUNT_KEY trong .env",
        });
      }

      // Đọc từ sensors thay vì iotData
      const data = await firebaseClient.readData("sensors");
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/firebase/sensors/:sensorId
   * Lấy một sensor cụ thể
   */
  async getSensorById(req, res) {
    try {
      const { sensorId } = req.params;
      // Đọc từ sensors thay vì iotData
      const data = await firebaseClient.readData(`sensors/${sensorId}`);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/firebase/write
   * Ghi dữ liệu vào Firebase
   */
  async writeData(req, res) {
    try {
      const { path, data } = req.body;

      if (!path || !data) {
        return res.status(400).json({
          success: false,
          error: "Thiếu path hoặc data",
        });
      }

      await firebaseClient.writeData(path, data);
      res.json({ success: true, message: "Data written successfully" });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new FirebaseController();
