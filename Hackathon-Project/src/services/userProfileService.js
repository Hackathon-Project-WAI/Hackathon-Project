/**
 * User Profile Service
 * Quản lý thông tin cá nhân người dùng trên Realtime Database
 */

import {
  ref,
  get,
  set,
  update,
  push,
  remove,
  serverTimestamp,
  query,
  orderByChild,
  limitToLast,
} from "firebase/database";
import { db } from "../configs/firebase";

class UserProfileService {
  /**
   * Lấy profile của user
   */
  async getUserProfile(userId) {
    try {
      const userRef = ref(db, `userProfiles/${userId}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        return {
          success: true,
          data: snapshot.val(),
        };
      } else {
        const defaultProfile = {
          notifications: {
            email: true,
            push: true,
            sms: false,
          },
          alertSettings: {
            immediateAlerts: true,
            advanceWarning: true,
            dailySummary: false,
          },
          stats: {
            savedLocationsCount: 0,
            alertsReceived: 0,
            floodReports: 0,
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        // Create profile in background
        set(userRef, defaultProfile).catch(() => {});

        return {
          success: true,
          data: defaultProfile,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Cập nhật profile
   */
  async updateProfile(userId, updates) {
    try {
      const userRef = ref(db, `userProfiles/${userId}`);
      await update(userRef, {
        ...updates,
        updatedAt: Date.now(),
      });

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Thêm địa điểm mới
   */
  async addLocation(userId, location) {
    try {
      const locationsRef = ref(db, `userProfiles/${userId}/locations`);
      const newLocationRef = push(locationsRef);

      await set(newLocationRef, {
        ...location,
        createdAt: Date.now(),
      });

      // Update stats
      await this.incrementStat(userId, "savedLocationsCount");

      return {
        success: true,
        id: newLocationRef.key,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Lấy danh sách địa điểm của user
   */
  async getLocations(userId) {
    try {
      const locationsRef = ref(db, `userProfiles/${userId}/locations`);
      const snapshot = await get(locationsRef);

      const locations = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach((key) => {
          locations.push({
            id: key,
            ...data[key],
          });
        });
      }

      return {
        success: true,
        data: locations,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * Cập nhật địa điểm
   */
  async updateLocation(userId, locationId, updates) {
    try {
      const locationRef = ref(
        db,
        `userProfiles/${userId}/locations/${locationId}`
      );
      await update(locationRef, {
        ...updates,
        updatedAt: Date.now(),
      });

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Xóa địa điểm
   */
  async deleteLocation(userId, locationId) {
    try {
      const locationRef = ref(
        db,
        `userProfiles/${userId}/locations/${locationId}`
      );
      await remove(locationRef);

      // Update stats
      await this.decrementStat(userId, "savedLocationsCount");

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Lấy lịch sử hoạt động
   */
  async getActivityHistory(userId, limit = 20) {
    try {
      const activitiesRef = ref(db, `userProfiles/${userId}/activities`);
      const snapshot = await get(activitiesRef);

      const activities = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach((key) => {
          activities.push({
            id: key,
            ...data[key],
          });
        });
      }

      // Sort by timestamp descending
      activities.sort((a, b) => {
        const timeA = a.timestamp || 0;
        const timeB = b.timestamp || 0;
        return timeB - timeA;
      });

      return {
        success: true,
        data: activities.slice(0, limit),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * Thêm hoạt động mới
   */
  async addActivity(userId, activity) {
    try {
      const activitiesRef = ref(db, `userProfiles/${userId}/activities`);
      const newActivityRef = push(activitiesRef);

      await set(newActivityRef, {
        ...activity,
        timestamp: Date.now(),
      });

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Tăng giá trị thống kê
   */
  async incrementStat(userId, statName, incrementBy = 1) {
    try {
      const userRef = ref(db, `userProfiles/${userId}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const currentStats = snapshot.val().stats || {};
        const currentValue = currentStats[statName] || 0;

        await update(userRef, {
          [`stats/${statName}`]: currentValue + incrementBy,
          updatedAt: Date.now(),
        });
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Giảm giá trị thống kê
   */
  async decrementStat(userId, statName, decrementBy = 1) {
    try {
      const userRef = ref(db, `userProfiles/${userId}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const currentStats = snapshot.val().stats || {};
        const currentValue = currentStats[statName] || 0;

        await update(userRef, {
          [`stats/${statName}`]: Math.max(0, currentValue - decrementBy),
          updatedAt: Date.now(),
        });
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Cập nhật settings
   */
  async updateSettings(userId, settingType, settings) {
    try {
      const userRef = ref(db, `userProfiles/${userId}`);
      await update(userRef, {
        [settingType]: settings,
        updatedAt: Date.now(),
      });

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Lấy thống kê tháng này
   */
  async getMonthlyStats(userId) {
    try {
      // TODO: Implement real monthly stats from activities
      // For now, return from profile stats
      const profile = await this.getUserProfile(userId);

      return {
        success: true,
        data: profile.data?.stats || {
          savedLocationsCount: 0,
          alertsReceived: 0,
          floodReports: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: {
          savedLocationsCount: 0,
          alertsReceived: 0,
          floodReports: 0,
        },
      };
    }
  }

  /**
   * Cập nhật notification settings
   */
  async updateNotificationSettings(userId, settings) {
    try {
      const settingsRef = ref(db, `userProfiles/${userId}/notificationSettings`);
      await set(settingsRef, {
        email: settings.email,
        telegram: settings.telegram,
        updatedAt: Date.now(),
      });

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Cập nhật auto-alert settings
   */
  async updateAutoAlertSettings(userId, settings) {
    try {
      const settingsRef = ref(db, `userProfiles/${userId}/autoAlertSettings`);
      await set(settingsRef, {
        isWeatherAlertEnabled: settings.isWeatherAlertEnabled ?? false,
        isSensorAlertEnabled: settings.isSensorAlertEnabled ?? false,
        checkInterval: settings.checkInterval ?? 15,
        waterLevelThreshold: settings.waterLevelThreshold ?? 50,
        riskLevelThreshold: settings.riskLevelThreshold ?? 1,
        updatedAt: Date.now(),
      });

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

const userProfileService = new UserProfileService();
export default userProfileService;
