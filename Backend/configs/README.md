# 🔑 Firebase Service Account Key

## Cách lấy file serviceAccountKey.json:

1. Truy cập Firebase Console: https://console.firebase.google.com/project/fir-hackathon-98bf5/settings/serviceaccounts/adminsdk

2. Click tab **"Service accounts"**

3. Click button **"Generate new private key"**

4. Confirm và download file JSON

5. **Đổi tên file thành:** `serviceAccountKey.json`

6. **Copy file vào folder này:** `Backend/configs/serviceAccountKey.json`

7. Restart server: `npm run dev`

---

## File serviceAccountKey.json sẽ có format như này:

```json
{
  "type": "service_account",
  "project_id": "fir-hackathon-98bf5",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxx@fir-hackathon-98bf5.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

⚠️ **LƯU Ý:** File này chứa private key, KHÔNG push lên Git!
