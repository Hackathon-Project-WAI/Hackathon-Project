const nodemailer = require("nodemailer");
require("dotenv").config();

// Tạo transporter với Gmail - thử cả 2 phương thức
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: "TLSv1.2",
  },
  connectionTimeout: 20000, // 20 seconds
  greetingTimeout: 20000,
  socketTimeout: 20000,
  logger: true, // Enable logging
  debug: true, // Include SMTP traffic in logs
});

// Hàm gửi email
const sendEmail = async (to, subject, html, text) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: to,
      subject: subject,
      text: text || "",
      html: html || "",
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return {
      success: true,
      messageId: info.messageId,
      message: "Email sent successfully",
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Hàm gửi email cảnh báo lũ lụt
const sendFloodAlert = async (to, alertData) => {
  const emailStartTime = Date.now();
  console.log(`📧 [${new Date().toLocaleTimeString()}] Bắt đầu gửi Email...`);
  
  const subject = `🚨 Cảnh báo lũ lụt: ${
    alertData.district || "Khu vực của bạn"
  }`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: #ff6b6b; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0;">⚠️ Cảnh báo lũ lụt</h1>
      </div>
      
      <div style="background-color: white; padding: 20px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Thông tin cảnh báo</h2>
        
        <div style="margin: 15px 0;">
          <strong>📍 Khu vực:</strong> ${alertData.district || "N/A"}<br/>
          <strong>🌊 Mức độ:</strong> <span style="color: #ff6b6b; font-weight: bold;">${
            alertData.level || "Cao"
          }</span><br/>
          <strong>🌧️ Lượng mưa:</strong> ${alertData.rainfall || "N/A"} mm<br/>
          <strong>⏰ Thời gian:</strong> ${
            alertData.time || new Date().toLocaleString("vi-VN")
          }
        </div>
        
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #856404;">📋 Khuyến nghị:</h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Theo dõi thông tin cập nhật từ chính quyền địa phương</li>
            <li>Chuẩn bị sẵn sàng di chuyển nếu cần thiết</li>
            <li>Không đi qua vùng ngập lụt</li>
            <li>Giữ liên lạc với gia đình và bạn bè</li>
          </ul>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          Email này được gửi tự động từ hệ thống cảnh báo thời tiết. Vui lòng không trả lời email này.
        </p>
      </div>
    </div>
  `;

  const text = `
    CẢNH BÁO LŨ LỤT
    
    Khu vực: ${alertData.district || "N/A"}
    Mức độ: ${alertData.level || "Cao"}
    Lượng mưa: ${alertData.rainfall || "N/A"} mm
    Thời gian: ${alertData.time || new Date().toLocaleString("vi-VN")}
    
    Vui lòng theo dõi thông tin cập nhật và tuân thủ hướng dẫn của chính quyền địa phương.
  `;

  const result = await sendEmail(to, subject, html, text);
  const emailEndTime = Date.now();
  const emailSendTime = emailEndTime - emailStartTime;
  console.log(`📧 [${new Date().toLocaleTimeString()}] Email hoàn thành trong ${emailSendTime}ms`);
  
  // Thêm thời gian vào kết quả
  result.sendTime = emailSendTime;
  return result;
};

// Hàm gửi email thông tin thời tiết
const sendWeatherUpdate = async (to, weatherData) => {
  const subject = `🌤️ Cập nhật thời tiết: ${
    weatherData.location || "Khu vực của bạn"
  }`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0;">🌤️ Thông tin thời tiết</h1>
      </div>
      
      <div style="background-color: white; padding: 20px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">${
          weatherData.location || "Khu vực của bạn"
        }</h2>
        
        <div style="margin: 15px 0;">
          <strong>🌡️ Nhiệt độ:</strong> ${
            weatherData.temperature || "N/A"
          }°C<br/>
          <strong>💧 Độ ẩm:</strong> ${weatherData.humidity || "N/A"}%<br/>
          <strong>🌧️ Khả năng mưa:</strong> ${
            weatherData.rainChance || "N/A"
          }%<br/>
          <strong>💨 Tốc độ gió:</strong> ${
            weatherData.windSpeed || "N/A"
          } km/h<br/>
          <strong>📅 Ngày:</strong> ${
            weatherData.date || new Date().toLocaleDateString("vi-VN")
          }
        </div>
        
        ${
          weatherData.description
            ? `
        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #1565c0;">${weatherData.description}</p>
        </div>
        `
            : ""
        }
        
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          Email này được gửi tự động từ hệ thống thông tin thời tiết.
        </p>
      </div>
    </div>
  `;

  return await sendEmail(to, subject, html);
};

// Hàm gửi email cảnh báo từ AI (nhận subject và htmlBody đã được tạo sẵn)
const sendAIFloodAlert = async (to, alertContent) => {
  const { subject, htmlBody } = alertContent;

  // Wrap HTML content with styling
  const styledHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: #ff6b6b; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0;">🚨 ${subject}</h1>
      </div>
      
      <div style="background-color: white; padding: 20px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        ${htmlBody}
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p style="color: #666; font-size: 14px; margin: 0;">
            🤖 Email này được tạo tự động bởi AI và gửi từ hệ thống cảnh báo thời tiết.<br/>
            Thời gian: ${new Date().toLocaleString("vi-VN")}<br/>
            Vui lòng không trả lời email này.
          </p>
        </div>
      </div>
    </div>
  `;

  return await sendEmail(to, subject, styledHtml);
};

// Hàm gửi email test
const sendTestEmail = async (to) => {
  const subject = "✅ Test Email - Backend API";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #4CAF50;">✅ Email Service Working!</h2>
      <p>Đây là email test từ Backend API sau khi refactor.</p>
      <p><strong>Thời gian:</strong> ${new Date().toLocaleString("vi-VN")}</p>
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        Nếu bạn nhận được email này, email service đang hoạt động bình thường.
      </p>
    </div>
  `;
  const text =
    "Email service is working! This is a test email from Backend API.";

  return await sendEmail(to, subject, html, text);
};

module.exports = {
  sendEmail,
  sendTestEmail,
  sendFloodAlert,
  sendWeatherUpdate,
  sendAIFloodAlert,
};
