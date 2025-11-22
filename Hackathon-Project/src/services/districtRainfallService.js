/**
 * District Rainfall Service
 * Lấy dữ liệu lượng mưa theo từng quận của Đà Nẵng
 */

import weatherService from "./weatherService";

// Map tên quận từ tiếng Anh (không dấu) sang tiếng Việt (có dấu)
const DISTRICT_NAME_MAP = {
  "Ngu Hanh Son": "Ngũ Hành Sơn",
  "Hai Chau": "Hải Châu",
  "Cam Le": "Cẩm Lệ",
  "Lien Chieu": "Liên Chiểu",
  "Hoa Vang": "Hòa Vang",
  "Son Tra": "Sơn Trà",
  "Thanh Khe": "Thanh Khê",
  // Cũng map ngược lại
  "Ngũ Hành Sơn": "Ngũ Hành Sơn",
  "Hải Châu": "Hải Châu",
  "Cẩm Lệ": "Cẩm Lệ",
  "Liên Chiểu": "Liên Chiểu",
  "Hòa Vang": "Hòa Vang",
  "Sơn Trà": "Sơn Trà",
  "Thanh Khê": "Thanh Khê",
};

// Tọa độ trung tâm các quận Đà Nẵng
const DISTRICT_CENTERS = {
  "Hòa Vang": { lat: 16.0384, lng: 108.1146 },
  "Liên Chiểu": { lat: 16.0775, lng: 108.1517 },
  "Cẩm Lệ": { lat: 16.0275, lng: 108.1867 },
  "Hải Châu": { lat: 16.0544, lng: 108.2165 },
  "Sơn Trà": { lat: 16.0861, lng: 108.2439 },
  "Thanh Khê": { lat: 16.0639, lng: 108.1932 },
  "Ngũ Hành Sơn": { lat: 16.0012, lng: 108.248 },
};

/**
 * Tính lượng mưa từ hourly forecast data (giống WeatherDisplay)
 * Tính tổng lượng mưa trong 3 giờ tới
 */
const calculateRainfallFromForecast = (hourlyData) => {
  if (!hourlyData || hourlyData.length === 0) return 0;

  // Lọc chỉ lấy các giờ trong tương lai
  const now = Date.now();
  const futureHours = hourlyData.filter((hour) => hour.dt * 1000 > now);

  if (futureHours.length === 0) return 0;

  let totalRain = 0;
  const limit = 3; // Tính cho 3 giờ tới

  for (let i = 0; i < Math.min(limit, futureHours.length); i++) {
    const hour = futureHours[i];

    // Kiểm tra data có phải là 1h hay 3h interval
    if (hour.rain?.["1h"]) {
      totalRain += hour.rain["1h"];
    } else if (hour.rain?.["3h"] && i === 0) {
      // Chỉ lấy 3h data từ điểm đầu tiên, tránh cộng lặp
      totalRain = hour.rain["3h"];
      break;
    }
  }

  // Trả về lượng mưa trung bình mỗi giờ
  return totalRain / 3;
};

/**
 * Lấy lượng mưa cho một quận
 */
export const getDistrictRainfall = async (districtName) => {
  try {
    // Chuẩn hóa tên quận (chuyển từ tiếng Anh sang tiếng Việt nếu cần)
    const normalizedName = DISTRICT_NAME_MAP[districtName] || districtName;

    const center = DISTRICT_CENTERS[normalizedName];
    if (!center) {
      console.warn(
        `⚠️ Không tìm thấy tọa độ cho quận: ${districtName} (normalized: ${normalizedName})`
      );
      return 0;
    }

    // ✅ Lấy hourly forecast thay vì current weather
    const hourlyData = await weatherService.getHourlyForecast(
      center.lat,
      center.lng
    );
    const rainfall = calculateRainfallFromForecast(hourlyData);

    console.log(
      `🌧️ ${districtName}: ${rainfall.toFixed(1)} mm/h (từ hourly forecast)`
    );

    return rainfall;
  } catch (error) {
    console.error(`❌ Lỗi lấy rainfall cho ${districtName}:`, error);
    return 0;
  }
};

/**
 * Lấy lượng mưa cho tất cả các quận
 */
export const getAllDistrictRainfall = async () => {
  try {
    console.log("🌍 Đang lấy dữ liệu mưa cho tất cả quận...");

    const rainfallData = {};

    // Fetch song song cho tất cả quận
    const promises = Object.keys(DISTRICT_CENTERS).map(async (districtName) => {
      const rainfall = await getDistrictRainfall(districtName);
      rainfallData[districtName] = rainfall;
    });

    await Promise.all(promises);

    console.log("\n✅ Đã lấy xong dữ liệu mưa cho tất cả quận!");
    return rainfallData;
  } catch (error) {
    console.error("❌ Lỗi lấy rainfall data:", error);
    // Fallback to mock data
    return {
      "Hòa Vang": 3.7,
      "Liên Chiểu": 11.0,
      "Cẩm Lệ": 8.6,
      "Hải Châu": 8.6,
      "Sơn Trà": 11.3,
      "Thanh Khê": 11.3,
      "Ngũ Hành Sơn": 9.4,
    };
  }
};
