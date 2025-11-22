# 🚀 Premium Email Template - Quick Start

## ✨ Tính Năng Mới

Template email cao cấp với:
- ✅ **Hiển thị theo CM** (ưu tiên) hoặc **%** (fallback)
- ✅ **Responsive** - đẹp trên cả mobile và desktop
- ✅ **Dashboard 3 cards** với số liệu rõ ràng
- ✅ **Tự động đổi màu** theo mức độ rủi ro
- ✅ **Hành động khẩn cấp** rõ ràng

---

## 🎯 Test Ngay Trong Postman

### Option 1: Hiển thị theo CM (Khuyến nghị)

**Request:** `POST /api/send-premium-alert`

```json
{
  "to": "your-email@example.com",
  "alertData": {
    "location": "Đà Nẵng",
    "riskLevel": "CAO",
    "waterLevel_cm": 120,
    "maxWaterLevel": 150,
    "rateDetail": "+10cm / 5 phút"
  }
}
```

**Email sẽ hiển thị:**
```
┌─────────────────┐
│  Mức nước       │
│    120cm        │  ← Theo CM
│ Ngưỡng: 150cm   │
└─────────────────┘
```

---

### Option 2: Hiển thị theo %

```json
{
  "to": "your-email@example.com",
  "alertData": {
    "location": "Hải Châu",
    "riskLevel": "TRUNG BÌNH",
    "waterPercent": 75,
    "rateDetail": "+5% / 5 phút"
  }
}
```

**Email sẽ hiển thị:**
```
┌─────────────────┐
│  Mức ngập       │
│     75%         │  ← Theo %
│ Vượt ngưỡng 70% │
└─────────────────┘
```

---

## 💻 Sử Dụng Trong Code

### 1. Import Service

```javascript
const emailService = require("./src/email/emailService");
```

### 2. Gửi Alert Với Data Từ Sensor (CM)

```javascript
// Data từ IoT sensor
const sensorData = {
  water_level_cm: 120,
  max_level: 150,
  location: "Đà Nẵng",
  flood_status: "DANGER"
};

// Chuyển đổi và gửi
await emailService.sendPremiumFloodAlert("user@example.com", {
  location: sensorData.location,
  riskLevel: "CAO",
  waterLevel_cm: sensorData.water_level_cm, // 🔥 Ưu tiên
  maxWaterLevel: sensorData.max_level,
  rateOfChange: "Nhanh",
  rateDetail: `+${sensorData.rate_cm}cm / 5 phút`,
  description: "RẤT NGUY HIỂM"
});
```

### 3. Hoặc Dùng % (Fallback)

```javascript
await emailService.sendPremiumFloodAlert("user@example.com", {
  location: "Hải Châu",
  riskLevel: "TRUNG BÌNH",
  waterPercent: 75, // 🔥 Fallback khi không có cm
  threshold: "Vượt ngưỡng 70%",
  description: "CẢNH BÁO"
});
```

---

## 🎨 Màu Sắc Tự Động

Template tự động đổi màu theo `riskLevel`:

| riskLevel | Màu | Khi Nào Dùng |
|-----------|-----|--------------|
| `CAO` | 🔴 Đỏ | > 80% hoặc > 100cm |
| `TRUNG BÌNH` | 🟠 Cam | 50-80% hoặc 60-100cm |
| `THẤP` | 🟡 Vàng | < 50% hoặc < 60cm |

---

## 📋 Full Parameters

```javascript
{
  // Bắt buộc
  location: "Đà Nẵng",           // Khu vực
  
  // Hiển thị mức nước (chọn 1 trong 2)
  waterLevel_cm: 120,            // ✅ Ưu tiên: theo cm
  waterPercent: 85,              // Fallback: theo %
  
  // Tùy chọn
  riskLevel: "CAO",              // CAO, TRUNG BÌNH, THẤP
  alertLevel: "Mức báo động 3",  // Text mô tả
  maxWaterLevel: 150,            // Ngưỡng tối đa (cm)
  threshold: "Vượt ngưỡng...",   // Text ngưỡng
  rateOfChange: "Nhanh",         // Tốc độ
  rateDetail: "+10cm / 5 phút",  // Chi tiết tốc độ
  description: "RẤT NGUY HIỂM",  // Mô tả
  timestamp: "10:00 AM...",      // Auto nếu không có
  
  // Custom actions
  actions: [
    {
      icon: "🏃",
      title: "DI CHUYỂN",
      text: "tài sản lên cao..."
    }
  ]
}
```

---

## 🧪 Test Cases

### Test 1: Data Đầy Đủ (CM)
```bash
✅ Có waterLevel_cm
✅ Có maxWaterLevel  
✅ Custom actions
→ Email hiển thị 120cm / 150cm
```

### Test 2: Chỉ Có %
```bash
✅ Không có waterLevel_cm
✅ Có waterPercent
→ Email hiển thị 85%
```

### Test 3: Minimal Data
```bash
✅ Chỉ có location
✅ Chỉ có waterLevel_cm
→ Email dùng defaults cho phần còn lại
```

---

## 🐛 Troubleshooting

### Email không có số liệu?
```javascript
// Check data truyền vào
console.log("Alert data:", alertData);
console.log("Water CM:", alertData.waterLevel_cm);
console.log("Water %:", alertData.waterPercent);
```

### Email không đẹp trên mobile?
✅ Template đã responsive sẵn
✅ Test trên Gmail App (Android/iOS)

### Màu không đúng?
```javascript
// Kiểm tra riskLevel
alertData.riskLevel = "CAO"; // hoặc "TRUNG BÌNH", "THẤP"
```

---

## 📱 Postman Collection

Tôi đã thêm 2 requests mới vào collection:
1. **"Send Premium Alert (NEW ⭐ CM)"** - Test với cm
2. **"Send Premium Alert (NEW ⭐ %)"** - Test với %

Import lại collection để có các requests mới!

---

## 🎓 Best Practices

1. **Luôn truyền `waterLevel_cm` nếu có data từ sensor** - Chính xác hơn %
2. **Thêm `maxWaterLevel`** - Để user biết ngưỡng tối đa
3. **Custom `rateDetail`** - VD: "+10cm / 5 phút" thay vì chỉ "Nhanh"
4. **Test trên nhiều email clients** - Gmail, Outlook, Yahoo, etc.

---

## 🚀 Next Steps

1. ✅ Test trong Postman với 2 requests mới
2. ✅ Xem email trên mobile và desktop
3. ✅ Tích hợp vào IoT data flow
4. ✅ Thêm vào AI alert flow
5. ✅ Customize actions cho từng khu vực

---

**Ready to use! Chúc test thành công! 🎉**

**File liên quan:**
- Template: `Backend/src/email/templates.js` → `premiumFloodAlert()`
- Service: `Backend/src/email/emailService.js` → `sendPremiumFloodAlert()`
- API: `POST /api/send-premium-alert`
- Examples: `Backend/docs/PREMIUM_EMAIL_EXAMPLES.md`

