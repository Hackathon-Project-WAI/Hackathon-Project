const admin = require("firebase-admin");

/**
 * Service kiểm tra cảnh báo dựa trên SENSOR DATA (thay vì weather forecast)
 */
class SensorBasedAlertService {
  /**
   * Lấy tất cả sensor data từ Firebase
   */
  async getAllSensors() {
    try {
      const db = admin.database();
      const sensorsRef = db.ref("iotData");
      const snapshot = await sensorsRef.once("value");

      if (!snapshot.exists()) {
        return {};
      }

      return snapshot.val();
    } catch (error) {
      console.error("Lỗi lấy sensor data:", error);
      return {};
    }
  }

  /**
   * Tính khoảng cách giữa 2 điểm GPS (km)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // km
  }

  /**
   * Kiểm tra nguy cơ ngập cho 1 location dựa trên sensors
   */
  async checkLocationWithSensors(location, sensors) {
    const nearbyFloods = [];
    const alertRadius = location.alertRadius || 20; // ✅ Mặc định 20m (thay vì 1000m)

    console.log(`📍 Kiểm tra location: ${location.name}`);
    console.log(`   Tọa độ: ${location.coords.lat}, ${location.coords.lon}`);
    console.log(`   Bán kính cảnh báo: ${alertRadius}m`);

    for (const [sensorId, sensorData] of Object.entries(sensors)) {
      if (!sensorData.latitude || !sensorData.longitude) {
        continue;
      }

      // Tính khoảng cách
      const distance = this.calculateDistance(
        location.coords.lat,
        location.coords.lon,
        sensorData.latitude,
        sensorData.longitude
      );

      const distanceMeters = Math.round(distance * 1000);

      // Tính phần trăm mực nước
      const waterPercent = sensorData.current_percent || 
                          Math.round((sensorData.water_level_cm / 100) * 100);

      console.log(`   🔍 Sensor ${sensorId}: ${distanceMeters}m, mực nước ${waterPercent}%`);

      // Nếu trong bán kính và có nguy cơ
      if (distanceMeters <= alertRadius && waterPercent >= 25) { // ✅ Giảm ngưỡng xuống 25% để dễ test
        console.log(`   ⚠️ CẢNH BÁO: Sensor ${sensorId} trong bán kính ${alertRadius}m!`);
        nearbyFloods.push({
          sensorId: sensorId,
          sensorName: sensorData.device_id || sensorId,
          distance: distanceMeters,
          waterLevel: sensorData.water_level_cm,
          waterPercent: waterPercent,
          floodStatus: sensorData.flood_status || "WARNING",
          coords: {
            lat: sensorData.latitude,
            lon: sensorData.longitude,
          },
          timestamp: sensorData.timestamp,
        });
      }
    }

    if (nearbyFloods.length === 0) {
      console.log(`   ✅ Không có sensor nguy hiểm trong bán kính ${alertRadius}m`);
    }

    // Sắp xếp theo khoảng cách
    nearbyFloods.sort((a, b) => a.distance - b.distance);

    return nearbyFloods;
  }

  /**
   * Phân tích TẤT CẢ locations của user với sensor data
   */
  async analyzeUserLocations(userId) {
    try {
      const db = admin.database();
      
      // 1. Lấy user info từ Firebase Auth
      let userEmail = "";
      let userName = "Người dùng";
      
      try {
        const authUser = await admin.auth().getUser(userId);
        userEmail = authUser.email || "";
        userName = authUser.displayName || authUser.email?.split('@')[0] || "Người dùng";
        console.log(`✅ Lấy email từ Firebase Auth: ${userEmail}`);
      } catch (authError) {
        console.error("⚠️ Không lấy được user từ Auth, dùng fallback:", authError.message);
      }
      
      // Fallback: Lấy từ userProfiles nếu Auth không có
      const userRef = db.ref(`userProfiles/${userId}`);
      const userSnapshot = await userRef.once("value");

      if (userSnapshot.exists()) {
        const userData = userSnapshot.val();
        if (!userEmail) userEmail = userData.email || "";
        if (userName === "Người dùng") userName = userData.name || userData.displayName || userName;
      }

      const user = {
        userId: userId,
        name: userName,
        email: userEmail,
      };

      console.log(`👤 User info:`, {
        userId,
        name: user.name,
        email: user.email || '❌ KHÔNG CÓ EMAIL',
        hasEmail: !!user.email
      });

      // 2. Lấy locations
      const locationsRef = db.ref(`userProfiles/${userId}/locations`);
      const locationsSnapshot = await locationsRef.once("value");

      if (!locationsSnapshot.exists()) {
        return {
          userId: userId,
          user: user,
          totalLocations: 0,
          affectedLocations: 0,
          alerts: [],
        };
      }

      const locationsData = locationsSnapshot.val();
      const locations = [];

      for (const [id, data] of Object.entries(locationsData)) {
        if (data.status !== "deleted" && data.coords) {
          locations.push({
            id: id,
            ...data,
          });
        }
      }

      // 3. Lấy tất cả sensors
      const sensors = await this.getAllSensors();

      if (Object.keys(sensors).length === 0) {
        console.log("⚠️ Không có sensor data trong Firebase");
        return {
          userId: userId,
          user: user,
          totalLocations: locations.length,
          affectedLocations: 0,
          alerts: [],
        };
      }

      console.log(`📊 Đang check ${locations.length} locations với ${Object.keys(sensors).length} sensors`);

      // 4. Check từng location
      const alerts = [];

      for (const location of locations) {
        const nearbyFloods = await this.checkLocationWithSensors(location, sensors);

        if (nearbyFloods.length > 0) {
          console.log(`⚠️ Location "${location.name}" có ${nearbyFloods.length} sensors gần đang cảnh báo!`);
          
          for (const flood of nearbyFloods) {
            alerts.push({
              location: location,
              sensor: flood,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }

      return {
        userId: userId,
        user: user,
        totalLocations: locations.length,
        affectedLocations: alerts.length,
        alerts: alerts,
      };
    } catch (error) {
      console.error("Lỗi phân tích sensor data:", error);
      throw error;
    }
  }

  /**
   * Tạo prompt AI cá nhân hóa dựa trên sensor data
   */
  createPersonalizedPrompt(user, alert) {
    const { location, sensor } = alert;

    const locationTypeMap = {
      residential: "Nhà",
      office: "Công ty/Văn phòng",
      entertainment: "Khu vui chơi",
      school: "Trường học",
      hospital: "Bệnh viện",
      other: "Địa điểm",
    };

    const locationTypeLabel =
      locationTypeMap[location.type] || location.name;

    const userName = user.name || "Bạn";

    return `
Bạn là một hệ thống AI chuyên tạo cảnh báo ngập lụt CÁ NHÂN HÓA bằng tiếng Việt.

THÔNG TIN NGƯỜI DÙNG:
- Tên: ${userName}
- Email: ${user.email}
- Địa điểm quan tâm: ${locationTypeLabel} "${location.name}" (${location.icon || "📍"})
- Địa chỉ: ${location.address}
- Mức ưu tiên: ${location.priority}

THÔNG TIN SENSOR GẦN ĐÓ:
- Tên sensor: ${sensor.sensorName}
- Khoảng cách từ ${locationTypeLabel}: ${sensor.distance}m
- Mực nước: ${sensor.waterLevel}cm (${sensor.waterPercent}%)
- Trạng thái: ${sensor.floodStatus}
- Thời gian đo: ${new Date(parseInt(sensor.timestamp)).toLocaleString('vi-VN')}

YÊU CẦU TẠO EMAIL:
1. **Tiêu đề (subject):**
   - Có icon phù hợp (${location.icon || "📍"})
   - Có tên người dùng "${userName}"
   - Đề cập đến địa điểm "${location.name}"
   - Thể hiện mức độ khẩn cấp

2. **Nội dung (htmlBody):**
   - Chào hỏi cá nhân với tên "${userName}"
   - Nhấn mạnh địa điểm CỤ THỂ: "${locationTypeLabel} ${location.name}"
   - Nói rõ khoảng cách: "${sensor.distance}m từ ${locationTypeLabel}"
   - Mực nước HIỆN TẠI: ${sensor.waterLevel}cm (${sensor.waterPercent}%)
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
   - Khẩn trương nếu mực nước cao (>70%)

FORMAT BẮT BUỘC: Trả về JSON thuần với 2 trường:
{
  "subject": "tiêu đề email có tên user và địa điểm",
  "htmlBody": "nội dung HTML cá nhân hóa"
}
`;
  }

  /**
   * Tạo prompt AI cho NHIỀU sensors (gom vào 1 email duy nhất)
   */
  createPersonalizedPromptMultipleSensors(user, location, sensors) {
    const locationTypeMap = {
      residential: "Nhà",
      office: "Công ty/Văn phòng",
      entertainment: "Khu vui chơi",
      school: "Trường học",
      hospital: "Bệnh viện",
      other: "Địa điểm",
    };

    const locationTypeLabel = locationTypeMap[location.type] || location.name;
    const userName = user.name || "Bạn";

    // Tạo danh sách sensors
    const sensorsList = sensors.map(s => 
      `- ${s.sensorName}: ${s.distance}m, mực nước ${s.waterLevel}cm (${s.waterPercent}%), trạng thái ${s.floodStatus}`
    ).join('\n');

    return `
Bạn là một hệ thống AI chuyên tạo cảnh báo ngập lụt CÁ NHÂN HÓA bằng tiếng Việt.

THÔNG TIN NGƯỜI DÙNG:
- Tên: ${userName}
- Email: ${user.email}
- Địa điểm quan tâm: ${locationTypeLabel} "${location.name}"
- Địa chỉ: ${location.address}

CÓ ${sensors.length} SENSORS GẦN ĐÓ ĐANG CẢNH BÁO:
${sensorsList}

YÊU CẦU TẠO EMAIL:
1. **Tiêu đề (subject):**
   - Có icon 📍
   - Có tên người dùng "${userName}"
   - Đề cập đến "${location.name}"
   - Nhấn mạnh có ${sensors.length} sensors đang cảnh báo

2. **Nội dung (htmlBody):**
   - Chào "${userName}"
   - Liệt kê TẤT CẢ ${sensors.length} sensors với khoảng cách và mực nước
   - Dùng HTML: <p>, <b>, <ul>, <li>, <br>
   - Màu đỏ cho nguy hiểm: <span style="color:red;">
   - Đề xuất biện pháp phòng ngừa
   - Ký tên: "Hệ thống Cảnh báo Ngập lụt AI"

Tạo email NGẮN GỌN, DỄ ĐỌC, CÓ ĐỦ ${sensors.length} SENSORS!
`;
  }
}

module.exports = new SensorBasedAlertService();


