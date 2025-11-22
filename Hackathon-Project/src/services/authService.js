/**
 * Authentication Service
 * Quản lý đăng ký, đăng nhập, đăng xuất với Firebase
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../configs/firebase";

const googleProvider = new GoogleAuthProvider();

class AuthService {
  /**
   * Đăng ký tài khoản mới
   */
  async register(email, password, displayName) {
    try {
      console.log("🔧 AuthService.register called with:", {
        email,
        displayName,
      });
      console.log("🔧 Auth object:", auth);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      console.log("✅ User created:", user.uid);

      // Update display name
      if (displayName) {
        await updateProfile(user, { displayName });
        console.log("✅ Display name updated:", displayName);
      }

      console.log("✅ Đăng ký thành công:", user.email);
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || displayName,
        },
      };
    } catch (error) {
      console.error("❌ Lỗi đăng ký:", error);
      console.error("❌ Error code:", error.code);
      console.error("❌ Error message:", error.message);
      return {
        success: false,
        error: this.getErrorMessage(error.code),
      };
    }
  }

  /**
   * Đăng nhập
   */
  async login(email, password) {
    try {
      console.log("🔐 Login attempt:", { email, password: "***" });
      console.log("🔐 Auth object:", auth);
      console.log("🔐 Auth config:", auth.config);
      
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      console.log("✅ User object after login:", {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        displayName: user.displayName,
      });
      console.log("✅ Đăng nhập thành công:", user.email);
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        },
      };
    } catch (error) {
      console.error("❌ Lỗi đăng nhập:", error);
      console.error("❌ Error code:", error.code);
      console.error("❌ Error message:", error.message);
      console.error("❌ Full error:", JSON.stringify(error, null, 2));
      return {
        success: false,
        error: this.getErrorMessage(error.code),
      };
    }
  }

  /**
   * Đăng nhập bằng Google
   */
  async loginWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      console.log("✅ Đăng nhập Google thành công:", user.email);
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        },
      };
    } catch (error) {
      console.error("❌ Lỗi đăng nhập Google:", error);
      return {
        success: false,
        error: this.getErrorMessage(error.code),
      };
    }
  }

  /**
   * Đăng xuất
   */
  async logout() {
    try {
      await signOut(auth);
      console.log("✅ Đăng xuất thành công");
      return { success: true };
    } catch (error) {
      console.error("❌ Lỗi đăng xuất:", error);
      return {
        success: false,
        error: this.getErrorMessage(error.code),
      };
    }
  }

  /**
   * Theo dõi trạng thái đăng nhập
   */
  onAuthChange(callback) {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        callback({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
      } else {
        callback(null);
      }
    });
  }

  /**
   * Lấy user hiện tại
   */
  getCurrentUser() {
    const user = auth.currentUser;
    if (user) {
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      };
    }
    return null;
  }

  /**
   * Chuyển đổi error code thành message tiếng Việt
   */
  getErrorMessage(errorCode) {
    const errorMessages = {
      "auth/email-already-in-use": "Email này đã được đăng ký",
      "auth/invalid-email": "Email không hợp lệ",
      "auth/operation-not-allowed": "Chức năng này chưa được bật",
      "auth/weak-password": "Mật khẩu quá yếu (tối thiểu 6 ký tự)",
      "auth/user-disabled": "Tài khoản đã bị vô hiệu hóa",
      "auth/user-not-found": "Không tìm thấy tài khoản",
      "auth/wrong-password": "Mật khẩu không đúng",
      "auth/invalid-credential": "Email hoặc mật khẩu không đúng",
      "auth/too-many-requests": "Quá nhiều lần thử. Vui lòng thử lại sau",
      "auth/network-request-failed": "Lỗi kết nối mạng",
      "auth/popup-closed-by-user": "Cửa sổ đăng nhập đã bị đóng",
    };

    return errorMessages[errorCode] || `Đã có lỗi xảy ra: ${errorCode}`;
  }
}

const authService = new AuthService();
export default authService;
