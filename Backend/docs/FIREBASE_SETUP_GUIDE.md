# 🔥 Hướng dẫn Lấy Firebase Service Account Key

## ⚡ Quick Start (3 bước)

### Bước 1: Truy cập Firebase Console
```
https://console.firebase.google.com/
```

### Bước 2: Vào Project Settings
1. Chọn project của bạn
2. Click vào **⚙️ Settings** (góc trên bên trái)
3. Chọn **Project settings**

### Bước 3: Tạo Service Account Key
1. Chọn tab **Service accounts**
2. Click **Generate new private key**
3. Confirm và download file JSON
4. Đổi tên file thành `serviceAccountKey.json`
5. Copy vào thư mục `Backend/`

---

## 📁 Vị trí File

```
Backend/
├── serviceAccountKey.json  ← Đặt file ở đây
├── telegramBotListener.js
├── telegramAlertTrigger.js
└── .env
```

---

## 🔐 Cấu hình .env

### Option 1: Sử dụng file (Đơn giản nhất)

```env
# File đã ở đúng vị trí Backend/serviceAccountKey.json
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
```

### Option 2: Sử dụng JSON string (Bảo mật hơn)

1. Mở file `serviceAccountKey.json`
2. Copy toàn bộ nội dung (bao gồm cả dấu `{` và `}`)
3. Thêm vào `.env` (trên 1 dòng):

```env
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"your-project",...}'
```

**Lưu ý:** Phải dùng dấu nháy đơn `'` bọc JSON string

---

## ✅ Kiểm tra Cấu hình

Chạy script kiểm tra:
```bash
npm run setup
```

Output mong đợi:
```
✅ Service Account JSON đã cấu hình trong .env
📝 Project ID: your-project-id
```

---

## 🚀 Chạy Bot

Sau khi cấu hình xong:

**Terminal 1:**
```bash
npm run bot:listener
```

**Terminal 2:**
```bash
npm run bot:alert
```

---

## ⚠️ Bảo mật

### ❌ KHÔNG làm:
- ❌ Commit `serviceAccountKey.json` lên Git
- ❌ Share file này với người khác
- ❌ Đặt file này ở thư mục public

### ✅ NÊN làm:
- ✅ Thêm `serviceAccountKey.json` vào `.gitignore`
- ✅ Dùng environment variables cho production
- ✅ Giới hạn quyền truy cập Firebase

---

## 🔧 Troubleshooting

### Lỗi: "Cannot find module './serviceAccountKey.json'"

**Nguyên nhân:** File không tồn tại hoặc đường dẫn sai

**Giải pháp:**
1. Kiểm tra file có tồn tại:
   ```bash
   ls -la serviceAccountKey.json
   ```

2. Kiểm tra đường dẫn trong `.env`:
   ```bash
   cat .env | grep FIREBASE
   ```

3. Đảm bảo file ở đúng thư mục `Backend/`

### Lỗi: "Unexpected token" khi parse JSON

**Nguyên nhân:** JSON string không đúng format

**Giải pháp:**
- Đảm bảo JSON string trên 1 dòng
- Dùng dấu nháy đơn `'` bọc ngoài
- Không có line breaks trong string

### Lỗi: "Permission denied"

**Nguyên nhân:** Service Account không có quyền

**Giải pháp:**
1. Vào Firebase Console → IAM & Admin
2. Kiểm tra service account có role **Firebase Admin**
3. Thêm role nếu thiếu

---

## 📞 Cần Hỗ trợ?

1. Chạy script kiểm tra: `npm run setup`
2. Xem log chi tiết để biết vấn đề
3. Đọc `TELEGRAM_BOT_DEPLOYMENT_GUIDE.md`

---

## 🎯 Checklist

- [ ] Đã tạo Firebase project
- [ ] Đã enable Firestore Database
- [ ] Đã download Service Account Key
- [ ] File `serviceAccountKey.json` đã ở thư mục `Backend/`
- [ ] Đã cấu hình `.env`
- [ ] Chạy `npm run setup` thành công
- [ ] Đã thêm `serviceAccountKey.json` vào `.gitignore`
