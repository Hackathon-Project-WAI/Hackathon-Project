import axios from "axios";

// Sử dụng biến môi trường hoặc URL mặc định
const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://hackathon-project-pi6k.onrender.com";

// Gửi email thông thường
export const sendEmail = async (emailData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/send-email`, {
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    });
    return response.data;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

// Gửi cảnh báo lũ lụt
export const sendFloodAlert = async (email, alertData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/send-flood-alert`, {
      to: email,
      alertData: {
        district: alertData.district || "",
        level: alertData.level || "Cao",
        rainfall: alertData.rainfall || "",
        time: alertData.time || new Date().toLocaleString("vi-VN"),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error sending flood alert:", error);
    throw error;
  }
};

// Gửi cập nhật thời tiết
export const sendWeatherUpdate = async (email, weatherData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/send-weather-update`, {
      to: email,
      weatherData: {
        location: weatherData.location || "",
        temperature: weatherData.temperature || "",
        humidity: weatherData.humidity || "",
        rainChance: weatherData.rainChance || "",
        windSpeed: weatherData.windSpeed || "",
        date: weatherData.date || new Date().toLocaleDateString("vi-VN"),
        description: weatherData.description || "",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error sending weather update:", error);
    throw error;
  }
};

// Gửi email cho nhiều người dùng (ví dụ: gửi cảnh báo hàng loạt)
export const sendBulkFloodAlerts = async (emails, alertData) => {
  try {
    const promises = emails.map((email) => sendFloodAlert(email, alertData));
    const results = await Promise.all(promises);
    return results;
  } catch (error) {
    console.error("Error sending bulk alerts:", error);
    throw error;
  }
};

export default {
  sendEmail,
  sendFloodAlert,
  sendWeatherUpdate,
  sendBulkFloodAlerts,
};
