# 🤖 Hướng Dẫn Setup Gemini AI cho Phân Tích Rủi ro Tuyến Đường

## 📋 Tổng Quan

Ứng dụng đã tích hợp **Google Gemini AI** để phân tích và đánh giá rủi ro cho mỗi tuyến đường. AI sẽ:

- Đánh giá mức độ an toàn của tuyến đường
- Cảnh báo về vùng ngập lụt trên đường đi
- Đưa ra khuyến nghị có nên chọn tuyến này không
- Phân tích dựa trên khoảng cách, thời gian và số lượng vùng ngập

## 🔑 Bước 1: Lấy Gemini API Key (MIỄN PHÍ)

1. **Truy cập**: https://aistudio.google.com/app/apikey
2. **Đăng nhập** bằng tài khoản Google của bạn
3. Click nút **"Get API Key"** hoặc **"Create API key"**
4. Chọn **"Create API key in new project"** (nếu chưa có project)
5. **Copy** API key vừa tạo

> 💡 **Lưu ý**: Gemini API có gói miễn phí với 60 requests/phút, đủ cho việc phát triển và test!

## 📝 Bước 2: Thêm API Key vào Project

### Cách 1: Chỉnh sửa file `.env`

Mở file `Hackathon-Project/.env` và thêm dòng sau:

```env
# Gemini AI API Key
REACT_APP_GEMINI_API_KEY=AIzaSy...YOUR_ACTUAL_API_KEY_HERE
```

Thay `YOUR_ACTUAL_API_KEY_HERE` bằng API key bạn vừa copy.

### Cách 2: Tạo file mới (nếu chưa có .env)

Tạo file `.env` trong thư mục `Hackathon-Project/` với nội dung:

```env
# HERE Maps API Key
REACT_APP_HERE_API_KEY=ZpduDGQVMa8crJVv0ngtX_6wLVPb-cQn8fIWP5jHxqw

# OpenWeatherMap API Key
REACT_APP_OPENWEATHER_API_KEY=0101b87c29fad9e728807835f34da3a5

# Gemini AI API Key - THÊM DÒNG NÀY
REACT_APP_GEMINI_API_KEY=YOUR_API_KEY_HERE

PORT=3001
```

## 🚀 Bước 3: Restart Dev Server

```bash
cd Hackathon-Project
npm start
```

> **Quan trọng**: Phải restart server sau khi thay đổi file `.env`!

## ✅ Bước 4: Test Tính Năng

1. Mở ứng dụng trong trình duyệt
2. Chọn điểm đầu và điểm cuối
3. Click **"Tìm lộ trình an toàn"**
4. Khi có kết quả, **click vào một tuyến đường** để expand
5. Click nút **"✨ Hỏi Gemini về rủi ro"**
6. Đợi vài giây, AI sẽ phân tích và hiển thị kết quả

## 📊 Thông Tin AI Phân Tích

Gemini AI sẽ đánh giá dựa trên:

- **Khoảng cách**: Độ dài tuyến đường (km)
- **Thời gian**: Thời gian di chuyển dự kiến (phút)
- **Vùng ngập**: Số lượng và mức độ ngập lụt trên đường
- **Xếp hạng**: Tuyến đường nhanh nhất, thứ 2, thứ 3...

Ví dụ phân tích:

```
✨ GEMINI AI
Tuyến đường an toàn, không qua vùng ngập.
Khoảng cách hợp lý 9 phút. Nên chọn tuyến này
vì nhanh và không có rủi ro ngập lụt.
```

## 🛠️ Troubleshooting

### Lỗi: "Không thể kết nối AI"

**Nguyên nhân**: API key chưa được cấu hình hoặc sai

**Giải pháp**:

1. Kiểm tra file `.env` có dòng `REACT_APP_GEMINI_API_KEY`
2. Kiểm tra API key đã đúng chưa (không có khoảng trắng thừa)
3. Restart dev server: `Ctrl+C` rồi `npm start` lại

### Lỗi: "Vui lòng kiểm tra API key"

**Nguyên nhân**: API key không hợp lệ hoặc đã hết hạn

**Giải pháp**:

1. Truy cập lại https://aistudio.google.com/app/apikey
2. Tạo API key mới
3. Cập nhật vào file `.env`

### Lỗi: Quota exceeded

**Nguyên nhân**: Đã vượt quá giới hạn miễn phí (60 requests/phút)

**Giải pháp**:

1. Đợi 1 phút rồi thử lại
2. Hoặc nâng cấp lên gói trả phí (nếu cần)

## 💡 Tips & Best Practices

1. **Không commit API key lên Git**: File `.env` đã có trong `.gitignore`
2. **Sử dụng tiết kiệm**: Chỉ phân tích khi thực sự cần
3. **Cache kết quả**: AI đã cache kết quả trong session, không gọi lại nhiều lần
4. **Monitor usage**: Theo dõi usage tại https://aistudio.google.com/

## 🎯 Tính Năng Nâng Cao (Tùy Chọn)

### Tùy chỉnh prompt AI

Mở file `src/components/RouteResultsPanel.js`, tìm function `handleAnalyzeRoute` và chỉnh sửa biến `prompt` để thay đổi cách AI phân tích.

### Thêm thông tin thời tiết

Có thể kết hợp với OpenWeather API để AI phân tích thêm điều kiện thời tiết.

## 📚 Tài Liệu Tham Khảo

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Gemini Pricing](https://ai.google.dev/pricing)

## 🆘 Cần Trợ Giúp?

Nếu gặp vấn đề, check console log trong browser (F12) để xem lỗi chi tiết.

---

Made with ❤️ for Hackathon Project
