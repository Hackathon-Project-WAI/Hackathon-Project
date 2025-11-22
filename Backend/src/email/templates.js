class EmailTemplates {
  /**
   * Template email test
   */
  static testEmail() {
    return {
      subject: "🌤️ Test Email từ Hệ thống Cảnh báo Thời tiết",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">🌤️ Email Test Thành Công!</h1>
          </div>
          <div style="background-color: white; padding: 20px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
            <p style="font-size: 16px; color: #333;">Xin chào!</p>
            <p style="color: #666;">Đây là email test từ hệ thống cảnh báo thời tiết Đà Nẵng.</p>
            <p style="color: #666;">Thời gian: ${new Date().toLocaleString(
              "vi-VN"
            )}</p>
            <div style="background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #1565c0;">✅ Hệ thống email đang hoạt động bình thường!</p>
            </div>
          </div>
        </div>
      `,
    };
  }

  /**
   * Template cảnh báo lũ lụt
   */
  static floodAlert(alertData = {}) {
    return {
      subject: `🚨 Cảnh báo lũ lụt: ${alertData.district || "Khu vực của bạn"}`,
      html: `
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
              <strong>🌧️ Lượng mưa:</strong> ${
                alertData.rainfall || "N/A"
              } mm<br/>
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
      `,
    };
  }

  /**
   * Template cảnh báo từ AI
   */
  static aiFloodAlert(alertContent) {
    const { subject, htmlBody } = alertContent;

    return {
      subject: subject,
      html: `
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
      `,
    };
  }

  /**
   * Template cập nhật thời tiết
   */
  static weatherUpdate(weatherData = {}) {
    return {
      subject: `🌤️ Cập nhật thời tiết: ${
        weatherData.location || "Khu vực của bạn"
      }`,
      html: `
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
      `,
    };
  }
}

module.exports = EmailTemplates;
