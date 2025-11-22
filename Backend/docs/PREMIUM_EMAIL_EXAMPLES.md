# 📧 Premium Email Template - Examples

## 🎨 Template Mới: `premiumFloodAlert`

Template email cảnh báo lũ cao cấp với:
- ✅ Responsive design (mobile-friendly)
- ✅ Hiển thị linh hoạt: **cm** hoặc **%**
- ✅ Dashboard 3 cards đẹp mắt
- ✅ Hành động khẩn cấp rõ ràng
- ✅ Auto-generated timestamp

---

## 📊 Ví Dụ 1: Hiển Thị Theo CM (Ưu Tiên)

```javascript
const emailService = require("./src/email/emailService");

// Dữ liệu từ sensor IoT (có cm)
const alertData = {
  location: "Đà Nẵng",
  riskLevel: "CAO", // CAO, TRUNG BÌNH, THẤP
  alertLevel: "Mức báo động 3",
  
  // Ưu tiên hiển thị theo cm
  waterLevel_cm: 120, // 🔥 Mức nước thực tế
  maxWaterLevel: 150, // Ngưỡng tối đa
  threshold: "Vượt mức an toàn 30cm",
  
  rateOfChange: "Nhanh",
  rateDetail: "+10cm / 5 phút",
  
  timestamp: "10:00 AM - 22/11/2024",
  description: "RẤT NGUY HIỂM",
  
  actions: [
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
};

// Gửi email
await emailService.sendPremiumFloodAlert(
  "user@example.com",
  alertData
);
```

**Kết quả hiển thị:**
```
┌─────────────────────┐
│ Mức nước            │
│     120cm           │  ← Hiển thị theo cm
│ Ngưỡng tối đa: 150cm│
└─────────────────────┘
```

---

## 📊 Ví Dụ 2: Hiển Thị Theo % (Fallback)

```javascript
// Dữ liệu không có cm → tự động dùng %
const alertData = {
  location: "Hải Châu, Đà Nẵng",
  riskLevel: "TRUNG BÌNH",
  alertLevel: "Mức báo động 2",
  
  // Không có waterLevel_cm → dùng waterPercent
  waterPercent: 75, // 🔥 Phần trăm ngập
  threshold: "Vượt ngưỡng 70%",
  
  rateOfChange: "Trung bình",
  rateDetail: "+5% / 5 phút",
  
  description: "NGUY HIỂM",
};

await emailService.sendPremiumFloodAlert(
  "user@example.com",
  alertData
);
```

**Kết quả hiển thị:**
```
┌─────────────────────┐
│ Mức ngập            │
│      75%            │  ← Hiển thị theo %
│ Vượt ngưỡng 70%    │
└─────────────────────┘
```

---

## 🤖 Ví Dụ 3: Tích Hợp Với IoT Data

```javascript
// Trong controller khi nhận data từ sensor
router.post("/api/check-iot-data", async (req, res) => {
  const { sensorId } = req.body;
  
  // Đọc từ Firebase
  const iotData = await firebaseClient.readData(`iotData/${sensorId}`);
  
  // Chuyển đổi data
  const alertData = {
    location: iotData.location || "Đà Nẵng",
    riskLevel: iotData.flood_status === "DANGER" ? "CAO" : "TRUNG BÌNH",
    alertLevel: `Mức báo động ${iotData.alert_level || 2}`,
    
    // 🔥 Dữ liệu từ sensor (cm)
    waterLevel_cm: iotData.water_level_cm,
    maxWaterLevel: iotData.max_water_level || 150,
    threshold: `Vượt mức an toàn ${iotData.water_level_cm - iotData.safe_level}cm`,
    
    rateOfChange: iotData.water_level_cm > 100 ? "Nhanh" : "Chậm",
    rateDetail: `+${iotData.rate_cm_per_5min || 10}cm / 5 phút`,
    
    description: iotData.flood_status === "DANGER" ? "RẤT NGUY HIỂM" : "CẢNH BÁO",
  };
  
  // Gửi email premium
  const emailService = require("../email/emailService");
  await emailService.sendPremiumFloodAlert(
    process.env.ALERT_EMAIL_RECIPIENTS,
    alertData
  );
  
  res.json({ success: true, message: "Alert sent with premium template" });
});
```

---

## 🎯 Ví Dụ 4: Tích Hợp Với AI Alert

```javascript
// Trong personalizedAlertController
const generatedAIContent = await geminiClient.generateStructuredContent(prompt);

// Thêm dữ liệu cụ thể vào alert
const alertData = {
  location: userLocation.name,
  
  // Dữ liệu từ sensor gần nhất
  waterLevel_cm: nearestSensor.waterLevel,
  maxWaterLevel: nearestSensor.maxLevel,
  
  // AI generated risk level
  riskLevel: generatedAIContent.riskLevel, // AI tự tính
  description: generatedAIContent.description,
  
  // Override actions từ AI
  actions: generatedAIContent.recommendedActions.map(action => ({
    icon: action.emoji,
    title: action.title,
    text: action.description,
  })),
};

await emailService.sendPremiumFloodAlert(user.email, alertData);
```

---

## 📱 Ví Dụ 5: Test Nhanh Trong Postman

**Endpoint mới:** `POST /api/send-premium-alert`

**Body:**
```json
{
  "to": "your-email@example.com",
  "alertData": {
    "location": "Đà Nẵng",
    "riskLevel": "CAO",
    "alertLevel": "Mức báo động 3",
    "waterLevel_cm": 120,
    "maxWaterLevel": 150,
    "threshold": "Vượt mức an toàn 30cm",
    "rateOfChange": "Nhanh",
    "rateDetail": "+10cm / 5 phút",
    "description": "RẤT NGUY HIỂM"
  }
}
```

---

## 🔄 Logic Tự Động Chọn Hiển Thị

Template tự động quyết định hiển thị cm hay %:

```javascript
// Logic trong template
if (waterLevel_cm !== null && waterLevel_cm !== undefined) {
  // ✅ Ưu tiên hiển thị cm
  display = `${waterLevel_cm}cm`;
  threshold = `Ngưỡng tối đa: ${maxWaterLevel}cm`;
} else if (waterPercent !== null && waterPercent !== undefined) {
  // ✅ Fallback: hiển thị %
  display = `${waterPercent}%`;
  threshold = `Vượt ngưỡng ${waterPercent >= 80 ? "80%" : ""}`;
} else {
  // ❌ Không có data
  display = "N/A";
  threshold = "Đang cập nhật...";
}
```

---

## 🎨 Màu Sắc Theo Mức Độ

| Mức độ | Màu | Hex Code |
|--------|-----|----------|
| CAO | 🔴 Đỏ | #dc2626 |
| TRUNG BÌNH | 🟠 Cam | #ea580c |
| THẤP | 🟡 Vàng | #eab308 |

Template tự động thay đổi màu header và số liệu.

---

## ✅ Best Practices

1. **Luôn truyền `waterLevel_cm` nếu có** - Chính xác hơn %
2. **Bao gồm `maxWaterLevel`** - Để hiển thị ngưỡng tối đa
3. **Custom actions** - Thêm hành động cụ thể cho khu vực
4. **Timestamp auto** - Không cần truyền nếu muốn dùng thời gian hiện tại
5. **Test responsive** - Mở email trên mobile để xem

---

## 🔧 Debugging

Nếu email không đẹp:
```javascript
// Check console logs
console.log("Alert data:", alertData);
console.log("Water level (cm):", alertData.waterLevel_cm);
console.log("Water percent (%):", alertData.waterPercent);
```

---

## 📊 So Sánh Template

| Feature | `aiFloodAlert` | `floodAlert` | `premiumFloodAlert` ⭐ |
|---------|---------------|-------------|----------------------|
| Responsive | ❌ | ❌ | ✅ |
| Dashboard Cards | ❌ | ❌ | ✅ |
| Hiển thị cm | ❌ | ❌ | ✅ |
| Hiển thị % | ✅ | ✅ | ✅ |
| Custom Actions | ❌ | ✅ | ✅ |
| Mobile Optimized | ❌ | ❌ | ✅ |
| Modern Design | ❌ | ❌ | ✅ |

---

**Khuyến nghị:** Sử dụng `premiumFloodAlert` cho tất cả email cảnh báo mới! 🚀

