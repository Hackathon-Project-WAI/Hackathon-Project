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

  /**
   * Template Premium - Cảnh báo lũ khẩn cấp với UI đẹp
   * @param {Object} alertData - Dữ liệu cảnh báo
   * @param {string} alertData.location - Khu vực (VD: "Đà Nẵng")
   * @param {string} alertData.riskLevel - Cấp độ rủi ro (VD: "CAO", "TRUNG BÌNH", "THẤP")
   * @param {string} alertData.alertLevel - Mức báo động (VD: "Mức báo động 3")
   * @param {number} alertData.waterLevel_cm - Mức nước (cm) - Ưu tiên nếu có
   * @param {number} alertData.waterPercent - Phần trăm mức ngập (%) - Dùng nếu không có cm
   * @param {number} alertData.maxWaterLevel - Ngưỡng tối đa (cm) - VD: 150
   * @param {string} alertData.threshold - Mô tả ngưỡng (VD: "Vượt ngưỡng 80%")
   * @param {string} alertData.rateOfChange - Tốc độ tăng (VD: "Nhanh", "Chậm")
   * @param {string} alertData.rateDetail - Chi tiết tốc độ (VD: "+15% / 5 phút", "+10cm / 5 phút")
   * @param {string} alertData.timestamp - Thời gian cập nhật
   * @param {string} alertData.description - Mô tả tình trạng (VD: "RẤT NGUY HIỂM")
   * @param {Array<Object>} alertData.actions - Danh sách hành động khẩn cấp
   */
  static premiumFloodAlert(alertData = {}) {
    const {
      location = "ĐÀ NẴNG",
      riskLevel = "CAO",
      alertLevel = "Mức báo động 3",
      waterLevel_cm = null, // Ưu tiên hiển thị theo cm
      waterPercent = null,
      maxWaterLevel = 150, // Ngưỡng tối đa (cm)
      threshold = null,
      rateOfChange = "Nhanh",
      rateDetail = "+15% / 5 phút",
      timestamp = new Date().toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      description = "RẤT NGUY HIỂM",
      actions = [
        {
          icon: "🏃",
          title: "DI CHUYỂN",
          text: "tài sản có giá trị lên cao hoặc đến nơi an toàn ngay lập tức.",
        },
        {
          icon: "🏠",
          title: "SẴN SÀNG SƠ TÁN",
          text: "theo chỉ dẫn của chính quyền địa phương.",
        },
        {
          icon: "⛔",
          title: "TUYỆT ĐỐI KHÔNG",
          text: "đi vào các khu vực ngập sâu, dòng chảy xiết.",
        },
        {
          icon: "📻",
          title: "THEO DÕI TIN TỨC",
          text: "cập nhật liên tục từ các kênh chính thống.",
        },
      ],
    } = alertData;

    // Xác định màu sắc dựa trên mức độ rủi ro
    const riskColors = {
      CAO: "#dc2626",
      "TRUNG BÌNH": "#ea580c",
      THẤP: "#eab308",
    };
    const primaryColor = riskColors[riskLevel] || "#dc2626";

    // Xác định hiển thị mức nước: Ưu tiên cm, fallback về %
    let waterLevelDisplay = "";
    let waterLevelValue = "";
    let thresholdDisplay = "";

    if (waterLevel_cm !== null && waterLevel_cm !== undefined) {
      // Hiển thị theo cm
      waterLevelValue = `${waterLevel_cm}cm`;
      waterLevelDisplay = "Mức nước";

      if (threshold) {
        thresholdDisplay = threshold;
      } else if (maxWaterLevel) {
        thresholdDisplay = `Ngưỡng tối đa: ${maxWaterLevel}cm`;
      } else {
        thresholdDisplay = "Vượt mức an toàn";
      }
    } else if (waterPercent !== null && waterPercent !== undefined) {
      // Hiển thị theo %
      waterLevelValue = `${waterPercent}%`;
      waterLevelDisplay = "Mức ngập";
      thresholdDisplay =
        threshold || `Vượt ngưỡng ${waterPercent >= 80 ? "80%" : ""}`;
    } else {
      // Fallback mặc định
      waterLevelValue = "N/A";
      waterLevelDisplay = "Mức ngập";
      thresholdDisplay = "Đang cập nhật...";
    }

    // Tạo HTML cho danh sách hành động
    const actionsHTML = actions
      .map(
        (action) => `
      <li style="display: flex; align-items: flex-start; margin-bottom: 12px;">
        <span style="margin-right: 12px; font-size: 20px; line-height: 1;">${action.icon}</span>
        <span style="font-size: 15px; color: #431407;"><strong>${action.title}</strong> ${action.text}</span>
      </li>
    `
      )
      .join("");

    const currentTime = new Date().toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    return {
      subject: `🚨 CẢNH BÁO LŨ KHẨN CẤP - ${location.toUpperCase()}`,
      html: `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cảnh Báo Lũ Khẩn Cấp</title>
    <style>
        @media only screen and (max-width: 480px) {
            .mobile-header { font-size: 20px !important; }
            .mobile-stack { display: block !important; width: 100% !important; margin-bottom: 10px !important; }
            .mobile-padding { padding: 20px 15px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #333333; line-height: 1.6;">
    <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background-color: ${primaryColor}; color: #ffffff; padding: 30px 20px; text-align: center;">
            <div style="font-size: 40px; margin-bottom: 10px; line-height: 1;">🚨</div>
            <h1 class="mobile-header" style="margin: 0; font-size: 24px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; line-height: 1.3;">CẢNH BÁO LŨ KHẨN CẤP</h1>
            <div style="margin-top: 10px; font-size: 16px; background-color: rgba(255,255,255,0.2); display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: 600;">Khu vực: ${location.toUpperCase()}</div>
        </div>

        <!-- Nội dung chính -->
        <div class="mobile-padding" style="padding: 30px 25px;">
            
            <div style="text-align: center; margin-bottom: 25px; font-size: 16px;">
                <p style="margin: 0 0 10px 0;">Cập nhật lúc: <strong>${timestamp}</strong></p>
                <p style="margin: 0;">Mực nước ngập tại ${location} đang ở mức <span style="color: ${primaryColor}; font-weight: bold;">${description}</span>.</p>
            </div>

            <!-- Dashboard số liệu -->
            <div style="display: flex; flex-wrap: wrap; margin-bottom: 20px; justify-content: space-between;">
                <!-- Card 1 -->
                <div class="mobile-stack" style="flex: 1; min-width: 140px; background-color: #fff1f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; text-align: center; margin: 5px;">
                    <span style="font-size: 12px; color: #7f1d1d; text-transform: uppercase; font-weight: bold; margin-bottom: 5px; display: block;">Cấp độ rủi ro</span>
                    <span style="font-size: 24px; font-weight: 800; color: ${primaryColor}; display: block; line-height: 1.2;">${riskLevel}</span>
                    <span style="font-size: 12px; color: #555; margin-top: 5px; display: block;">${alertLevel}</span>
                </div>

                <!-- Card 2 - Mức nước (cm hoặc %) -->
                <div class="mobile-stack" style="flex: 1; min-width: 140px; background-color: #fff1f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; text-align: center; margin: 5px;">
                    <span style="font-size: 12px; color: #7f1d1d; text-transform: uppercase; font-weight: bold; margin-bottom: 5px; display: block;">${waterLevelDisplay}</span>
                    <span style="font-size: 24px; font-weight: 800; color: ${primaryColor}; display: block; line-height: 1.2;">${waterLevelValue}</span>
                    <span style="font-size: 12px; color: #555; margin-top: 5px; display: block;">${thresholdDisplay}</span>
                </div>

                <!-- Card 3 -->
                <div class="mobile-stack" style="flex: 1; min-width: 140px; background-color: #fff1f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; text-align: center; margin: 5px;">
                    <span style="font-size: 12px; color: #7f1d1d; text-transform: uppercase; font-weight: bold; margin-bottom: 5px; display: block;">Tốc độ tăng</span>
                    <span style="font-size: 24px; font-weight: 800; color: ${primaryColor}; display: block; line-height: 1.2;">${rateOfChange}</span>
                    <span style="font-size: 12px; color: #555; margin-top: 5px; display: block;">${rateDetail}</span>
                </div>
            </div>

            <!-- Hành động khẩn cấp -->
            <div style="background-color: #fff7ed; border-left: 5px solid #ea580c; padding: 20px; border-radius: 4px; margin-top: 20px;">
                <span style="font-size: 18px; font-weight: bold; color: #9a3412; margin-bottom: 15px; display: block;">HÀNH ĐỘNG KHẨN CẤP:</span>
                <ul style="list-style: none; padding: 0; margin: 0;">
                    ${actionsHTML}
                </ul>
            </div>
            
            <div style="text-align: center; margin-top: 25px; font-weight: bold; color: ${primaryColor};">
                ƯU TIÊN AN TOÀN TÍNH MẠNG LÀ TRÊN HẾT!
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb;">
            <div style="display: inline-flex; align-items: center; background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px; margin-bottom: 10px; font-weight: 500;">🤖 Tin nhắn tự động từ hệ thống AI</div>
            <p style="margin: 5px 0;">Thời gian gửi: ${currentTime}</p>
            <p style="margin: 5px 0;">Đây là tin nhắn cảnh báo tự động, vui lòng không trả lời email này.</p>
        </div>
    </div>
</body>
</html>
      `,
    };
  }
}

module.exports = EmailTemplates;
