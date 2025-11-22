const admin = require("firebase-admin");
const weatherService = require("./weatherService");
const floodPredictionService = require("./floodPredictionService");

class PersonalizedAlertService {
  /**
   * Lấy danh sách địa điểm của user từ Realtime Database
   */
  async getUserLocations(userId) {
    try {
      const db = admin.database();
      const locationsRef = db.ref(`userProfiles/${userId}/locations`);
      const snapshot = await locationsRef.once("value");

      if (!snapshot.exists()) {
        return [];
      }

      const locationsData = snapshot.val();
      const locations = [];

      // Convert object to array
      for (const [id, data] of Object.entries(locationsData)) {
        if (data.status !== "deleted") {
          locations.push({
            id: id,
            ...data,
          });
        }
      }

      // Sắp xếp theo priority: high > medium > low
      const priorityOrder = { high: 1, medium: 2, low: 3 };
      return locations.sort(
        (a, b) =>
          (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99)
      );
    } catch (error) {
      console.error("Lỗi lấy địa điểm user:", error);
      return [];
    }
  }

  /**
   * Lấy thông tin user từ Realtime Database
   */
  async getUser(userId) {
    try {
      const db = admin.database();
      const userRef = db.ref(`userProfiles/${userId}`);
      const snapshot = await userRef.once("value");

      if (!snapshot.exists()) {
        return null;
      }

      const userData = snapshot.val();
      return {
        userId: userId,
        name: userData.name || userData.displayName || "Người dùng",
        email: userData.email || process.env.ALERT_EMAIL_RECIPIENTS?.split(",")[0] || "user@example.com",
        ...userData,
      };
    } catch (error) {
      console.error("Lỗi lấy thông tin user:", error);
      return null;
    }
  }

  /**
   * Kiểm tra địa điểm có bị ảnh hưởng bởi ngập không
   * Logic mới: Check TRỰC TIẾP tại tọa độ location, không tìm vùng ngập gần nhất
   */
  async checkLocationFloodRisk(location, minRiskLevel = 1) {
    try {
      const { lat, lon } = location.coords;

      console.log(`🔍 Checking flood risk tại "${location.name}" (${lat}, ${lon})`);

      // 1. Lấy dự báo thời tiết TẠI location này
      const hourlyForecast = await weatherService.getHourlyForecast(lat, lon);

      if (!hourlyForecast || hourlyForecast.length === 0) {
        console.log(`❌ Không có dự báo thời tiết cho "${location.name}"`);
        return null;
      }

      console.log(`✅ Nhận được ${hourlyForecast.length} giờ dự báo cho "${location.name}"`);

      // 2. Phân tích ngập lụt TRỰC TIẾP tại location này
      const predictions = floodPredictionService.analyzeForecast(
        hourlyForecast,
        { maxAreas: 1 } // Chỉ cần 1 prediction cho location này
      );

      if (!predictions || predictions.length === 0) {
        console.log(`✅ "${location.name}" an toàn - không có nguy cơ ngập`);
        return null;
      }

      // 3. Lấy prediction có risk cao nhất
      const prediction = predictions[0];
      
      console.log(`⚠️ "${location.name}" - Risk Level: ${prediction.prediction.floodRisk}`);

      // 4. Kiểm tra có vượt ngưỡng minRiskLevel không
      if (prediction.prediction.floodRisk >= minRiskLevel) {
        console.log(`🚨 "${location.name}" CẦN CẢNH BÁO! (Risk ${prediction.prediction.floodRisk} >= ${minRiskLevel})`);
        return {
          area: {
            name: location.name, // Dùng tên location thay vì area name
            coords: { lat, lon }, // Dùng tọa độ location
          },
          prediction: prediction.prediction,
          distance: 0, // Distance = 0 vì check trực tiếp tại location
        };
      }

      console.log(`✅ "${location.name}" an toàn - Risk ${prediction.prediction.floodRisk} < ${minRiskLevel}`);
      return null;

    } catch (error) {
      console.error(
        `❌ Lỗi kiểm tra ngập cho địa điểm ${location.name}:`,
        error
      );
      return null;
    }
  }

  /**
   * Phân tích TẤT CẢ địa điểm của user
   */
  async analyzeUserLocations(userId, minRiskLevel = 1) {
    try {
      const user = await this.getUser(userId);
      if (!user) {
        throw new Error("Không tìm thấy user");
      }

      const locations = await this.getUserLocations(userId);
      if (locations.length === 0) {
        return {
          userId: userId,
          totalLocations: 0,
          affectedLocations: 0,
          alerts: [],
        };
      }

      const alerts = [];

      for (const location of locations) {
        // Bỏ qua nếu không có coords
        if (!location.coords || !location.coords.lat || !location.coords.lon) {
          console.warn(`Location ${location.name} thiếu tọa độ, bỏ qua`);
          continue;
        }

        const floodRisk = await this.checkLocationFloodRisk(
          location,
          minRiskLevel
        );

        if (floodRisk) {
          alerts.push({
            location: location,
            floodArea: floodRisk.area,
            prediction: floodRisk.prediction,
            distance: floodRisk.distance,
            timestamp: new Date().toISOString(),
          });
        }
      }

      return {
        userId: userId,
        user: {
          name: user.name || user.email || "Người dùng",
          email: user.email,
        },
        totalLocations: locations.length,
        affectedLocations: alerts.length,
        alerts: alerts,
      };
    } catch (error) {
      console.error("Lỗi phân tích địa điểm user:", error);
      throw error;
    }
  }

  /**
   * Tạo prompt AI cá nhân hóa
   */
  createPersonalizedPrompt(user, alert) {
    const { location, floodArea, prediction, distance } = alert;

    const locationTypeMap = {
      residential: "Nhà",
      office: "Công ty/Văn phòng",
      entertainment: "Khu vui chơi",
      school: "Trường học",
      hospital: "Bệnh viện",
      other: "Địa điểm",
    };

    const locationTypeLabel =
      locationTypeMap[location.type] ||
      location.name.charAt(0).toUpperCase() + location.name.slice(1);

    const severityLabels = [
      "AN TOÀN",
      "CẢNH BÁO",
      "NGUY HIỂM",
      "NGHIÊM TRỌNG",
    ];
    const intensityLabels = ["nhẹ", "trung bình", "nặng", "rất nặng"];

    const userName = user.name || "Bạn";
    const intensityLabel =
      intensityLabels[prediction.details.intensity] || "không xác định";

    return `
Bạn là một hệ thống AI chuyên tạo cảnh báo ngập lụt CÁ NHÂN HÓA bằng tiếng Việt.

THÔNG TIN NGƯỜI DÙNG:
- Tên: ${userName}
- Email: ${user.email}
- Địa điểm quan tâm: ${locationTypeLabel} "${location.name}" (${location.icon || "📍"})
- Địa chỉ: ${location.address}
- Mức ưu tiên: ${location.priority}

CẢNH BÁO NGẬP TẠI ĐỊA ĐIỂM NÀY:
- Tên địa điểm: ${location.name}
- Cấp độ nguy hiểm: ${severityLabels[prediction.floodRisk]}
- Điểm rủi ro: ${prediction.riskScore}/100

DỮ LIỆU DỰ BÁO TẠI "${location.name}":
- Lượng mưa 3h tới: ${prediction.details.rainfall3h}mm
- Lượng mưa 6h tới: ${prediction.details.rainfall6h}mm
- Lượng mưa 12h tới: ${prediction.details.rainfall12h}mm
- Cường độ mưa: ${intensityLabel}
- Độ sâu ngập dự kiến: ${prediction.details.predictedDepth}cm
- Thời gian ngập: ${prediction.details.estimatedDuration} phút

KHUYẾN NGHỊ HỆ THỐNG: ${prediction.recommendation}

YÊU CẦU TẠO EMAIL:
1. **Tiêu đề (subject):**
   - Có icon phù hợp (${location.icon || "📍"})
   - Có tên người dùng "${userName}"
   - Đề cập đến địa điểm "${location.name}"
   - Thể hiện mức độ khẩn cấp

2. **Nội dung (htmlBody):**
   - Chào hỏi cá nhân với tên "${userName}"
   - Nhấn mạnh địa điểm CỤ THỂ: "${locationTypeLabel} ${location.name}"
   - Nói rõ đây là cảnh báo TRỰC TIẾP tại địa điểm này
   - Dùng HTML đơn giản: <p>, <b>, <ul>, <li>, <br>
   - Dùng style inline cho màu: 
     * Nguy hiểm cao: color:red
     * Trung bình: color:orange
     * Thấp: color:#ffa500
   - Đưa ra HÀNH ĐỘNG CỤ THỂ dựa trên loại địa điểm:
     * Nhà: di chuyển xe, đóng cửa, chuẩn bị đồ dùng
     * Công ty: thông báo nhân viên, lộ trình thay thế
     * Khu vui chơi: hoãn chuyến đi, chọn địa điểm khác
   - Dưới 150 từ
   - Ngôn ngữ khẩn cấp nhưng THÂN THIỆN

3. **Tone:**
   - Cá nhân hóa, gần gũi
   - Tiếng Việt chuẩn, dễ hiểu
   - Không quá căng thẳng nếu chỉ cảnh báo nhẹ

FORMAT BẮT BUỘC: Trả về JSON thuần với 2 trường:
{
  "subject": "tiêu đề email có tên user và địa điểm",
  "htmlBody": "nội dung HTML cá nhân hóa"
}
`;
  }

  /**
   * Lưu log cảnh báo vào Realtime Database
   */
  async saveAlertLog(userId, alert, emailResult) {
    try {
      const db = admin.database();
      
      // Lưu alert log
      const alertRef = db.ref(`userProfiles/${userId}/personalizedAlerts`).push();
      await alertRef.set({
        locationId: alert.location.id,
        locationName: alert.location.name,
        locationAddress: alert.location.address,
        floodAreaId: alert.floodArea.id,
        floodAreaName: alert.floodArea.name,
        floodRisk: alert.prediction.floodRisk,
        riskScore: alert.prediction.riskScore,
        distance: alert.distance,
        rainfall3h: alert.prediction.details.rainfall3h,
        predictedDepth: alert.prediction.details.predictedDepth,
        emailSent: emailResult.success,
        emailSubject: emailResult.subject || null,
        createdAt: Date.now(),
        isRead: false,
      });

      // Cập nhật stats
      const statsRef = db.ref(`userProfiles/${userId}/stats/alertsReceived`);
      const currentStats = await statsRef.once("value");
      const currentCount = currentStats.val() || 0;
      await statsRef.set(currentCount + 1);

      // Thêm activity
      const activityRef = db.ref(`userProfiles/${userId}/activities`).push();
      await activityRef.set({
        type: "alert_received",
        title: `Cảnh báo ngập tại ${alert.floodArea.name}`,
        description: `Cảnh báo cho địa điểm "${alert.location.name}" - Cách ${alert.distance}m`,
        timestamp: Date.now(),
        metadata: {
          locationId: alert.location.id,
          floodAreaId: alert.floodArea.id,
          riskLevel: alert.prediction.floodRisk,
        },
      });

      return { success: true, alertId: alertRef.key };
    } catch (error) {
      console.error("Lỗi lưu alert log:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cập nhật status của location trong Realtime Database
   */
  async updateLocationStatus(userId, locationId, status, lastAlertTime) {
    try {
      const db = admin.database();
      const locationRef = db.ref(`userProfiles/${userId}/locations/${locationId}`);
      
      await locationRef.update({
        status: status, // "safe", "warning", "danger", "critical"
        lastAlertTime: lastAlertTime || Date.now(),
        updatedAt: Date.now(),
      });

      return { success: true };
    } catch (error) {
      console.error("Lỗi cập nhật location status:", error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new PersonalizedAlertService();


