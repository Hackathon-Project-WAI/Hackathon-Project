const admin = require("firebase-admin");
const path = require("path");

class FirebaseClient {
  constructor() {
    this.initialized = false;
  }

  /**
   * Khởi tạo Firebase Admin SDK
   */
  initialize() {
    if (this.initialized) {
      console.log("✅ Firebase đã được khởi tạo trước đó");
      return;
    }

    try {
      const databaseURL = process.env.FIREBASE_DATABASE_URL;
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

      if (!databaseURL) {
        throw new Error("FIREBASE_DATABASE_URL chưa được cấu hình trong .env");
      }

      let serviceAccount;

      // Ưu tiên dùng JSON string từ biến môi trường (cho production)
      if (serviceAccountJson) {
        try {
          serviceAccount = JSON.parse(serviceAccountJson);
          console.log("🔑 Sử dụng Service Account từ biến môi trường JSON");
        } catch (parseError) {
          throw new Error(
            "FIREBASE_SERVICE_ACCOUNT_JSON không hợp lệ. Kiểm tra format JSON."
          );
        }
      }
      // Fallback: dùng file JSON (cho local development)
      else if (serviceAccountPath) {
        const keyPath = path.resolve(serviceAccountPath);
        serviceAccount = require(keyPath);
        console.log(
          `📁 Sử dụng Service Account từ file: ${path.basename(keyPath)}`
        );
      } else {
        throw new Error(
          "Cần cấu hình FIREBASE_SERVICE_ACCOUNT_JSON hoặc FIREBASE_SERVICE_ACCOUNT_KEY"
        );
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: databaseURL,
      });

      this.initialized = true;
      console.log("✅ Firebase Admin SDK khởi tạo thành công");
    } catch (error) {
      console.error("❌ Lỗi khởi tạo Firebase:", error.message);

      if (error.code === "MODULE_NOT_FOUND") {
        console.error("\n💡 File serviceAccountKey.json không tìm thấy!");
        console.error(
          "1. Download từ Firebase Console > Project Settings > Service Accounts"
        );
        console.error("2. Lưu vào Backend/configs/serviceAccountKey.json");
        console.error("3. HOẶC set FIREBASE_SERVICE_ACCOUNT_JSON trong .env");
      }

      throw error;
    }
  }

  /**
   * Lấy Firestore instance
   */
  getFirestore() {
    if (!this.initialized) {
      this.initialize();
    }
    return admin.firestore();
  }

  /**
   * Lấy Realtime Database instance
   */
  getDatabase() {
    if (!this.initialized) {
      this.initialize();
    }
    return admin.database();
  }

  /**
   * Đọc dữ liệu từ Realtime Database
   */
  async readData(path) {
    try {
      const db = this.getDatabase();
      console.log(`📖 Reading from Firebase path: /${path}`);
      const snapshot = await db.ref(path).once("value");
      const data = snapshot.val();
      console.log(
        `✅ Data from /${path}:`,
        data ? `Found ${Object.keys(data || {}).length} items` : "NULL/EMPTY"
      );
      return data;
    } catch (error) {
      console.error(`❌ Lỗi đọc dữ liệu từ ${path}:`, error.message);
      throw error;
    }
  }

  /**
   * Ghi dữ liệu vào Realtime Database
   */
  async writeData(path, data) {
    try {
      const db = this.getDatabase();
      await db.ref(path).set(data);
      console.log(`✅ Đã ghi dữ liệu vào ${path}`);
      return true;
    } catch (error) {
      console.error(`❌ Lỗi ghi dữ liệu vào ${path}:`, error.message);
      throw error;
    }
  }

  /**
   * Lắng nghe thay đổi từ Realtime Database
   */
  listenToPath(path, callback) {
    try {
      const db = this.getDatabase();
      const ref = db.ref(path);

      ref.on("value", (snapshot) => {
        const data = snapshot.val();
        callback(data, snapshot.key);
      });

      console.log(`👂 Đang lắng nghe thay đổi tại ${path}`);
      return ref;
    } catch (error) {
      console.error(`❌ Lỗi lắng nghe ${path}:`, error.message);
      throw error;
    }
  }

  /**
   * Lắng nghe thay đổi từ Firestore
   */
  listenToCollection(collectionPath, callback) {
    try {
      const db = this.getFirestore();
      const unsubscribe = db
        .collection(collectionPath)
        .onSnapshot((snapshot) => {
          snapshot.docChanges().forEach((change) => {
            callback(change.type, change.doc.id, change.doc.data());
          });
        });

      console.log(`👂 Đang lắng nghe Firestore collection ${collectionPath}`);
      return unsubscribe;
    } catch (error) {
      console.error(
        `❌ Lỗi lắng nghe Firestore ${collectionPath}:`,
        error.message
      );
      throw error;
    }
  }
}

module.exports = new FirebaseClient();
