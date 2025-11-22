/**
 * Telegram Bot Long Polling Service
 * Dịch vụ lắng nghe và đăng ký người dùng thông qua Long Polling
 */

require("dotenv").config();
const axios = require("axios");
const {
  saveTelegramUser,
  deactivateUser,
} = require("./firebaseRealtimeManager");

// Biến theo dõi offset và state
let updateOffset = 0;
let isRunning = false;
let pollingInterval = null;

// Cấu hình Bot (sẽ được set khi startBot được gọi)
let BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "YOUR_BOT_TOKEN";
let TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
const POLLING_TIMEOUT = 60; // Timeout 60 giây

/**
 * Gửi tin nhắn tới người dùng Telegram
 * @param {string} chatId - Telegram Chat ID
 * @param {string} message - Nội dung tin nhắn
 * @param {object} options - Tùy chọn bổ sung (parse_mode, reply_markup, etc.)
 */
async function sendMessage(chatId, message, options = {}) {
  try {
    const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: options.parse_mode || "Markdown",
      ...options,
    });

    if (response.data.ok) {
      console.log(`✉️ Đã gửi tin nhắn tới ${chatId}`);
      return response.data.result;
    } else {
      console.error(
        `❌ Lỗi gửi tin nhắn tới ${chatId}:`,
        response.data.description
      );
      return null;
    }
  } catch (error) {
    console.error(`❌ Lỗi gửi tin nhắn tới ${chatId}:`, error.message);
    return null;
  }
}

/**
 * Xử lý lệnh /start
 * @param {object} message - Telegram message object
 */
async function handleStartCommand(message) {
  const chatId = message.chat.id;
  const username = message.from.username || "Unknown";
  const firstName = message.from.first_name || "";
  const lastName = message.from.last_name || "";

  // Parse userId từ deep link: /start {userId}
  const messageText = message.text || "";
  const parts = messageText.split(" ");
  const userIdFromDeepLink = parts.length > 1 ? parts[1] : null;

  try {
    // Nếu có userId từ QR code, link tự động
    if (userIdFromDeepLink) {
      console.log(
        `🔗 [${new Date().toISOString()}] Đang link Telegram chat ${chatId} với Firebase user: ${userIdFromDeepLink}`
      );

      // Lấy email từ Firebase với timeout và retry
      const admin = require("firebase-admin");
      const db = admin.database();
      
      let userEmail = null;
      let userName = firstName;
      let linkSuccess = false;

      // Retry logic cho Firebase operations
      const maxRetries = 3;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const userRef = db.ref(`userProfiles/${userIdFromDeepLink}`);
          const userSnapshot = await Promise.race([
            userRef.once("value"),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Firebase timeout")), 10000)
            )
          ]);

          if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            userEmail = userData.email;
            userName = userData.name || userData.displayName || firstName;

            // Lưu chat_id vào user profile với timeout
            await Promise.race([
              db.ref(`userProfiles/${userIdFromDeepLink}/telegramChatId`).set(chatId.toString()),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Firebase write timeout")), 10000)
              )
            ]);
            
            console.log(
              `✅ [Attempt ${attempt}] Đã link chat_id ${chatId} với user ${userIdFromDeepLink}`
            );
            linkSuccess = true;
            break;
          } else {
            console.warn(`⚠️ User ${userIdFromDeepLink} không tồn tại trong Firebase`);
            break;
          }
        } catch (error) {
          console.error(`❌ [Attempt ${attempt}/${maxRetries}] Lỗi Firebase cho user ${userIdFromDeepLink}:`, error.message);
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          } else {
            throw error;
          }
        }
      }

      // Lưu người dùng vào telegram_users với email VÀ set is_active = true
      // Retry cho saveTelegramUser
      let saveSuccess = false;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await Promise.race([
            saveTelegramUser(chatId, {
              username,
              first_name: firstName,
              last_name: lastName,
              email: userEmail,
              firebase_user_id: userIdFromDeepLink,
              is_active: true, // ⭐ QUAN TRỌNG: Reactivate user
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Save user timeout")), 10000)
            )
          ]);
          saveSuccess = true;
          console.log(`✅ [Attempt ${attempt}] Đã lưu telegram user ${chatId}`);
          break;
        } catch (error) {
          console.error(`❌ [Attempt ${attempt}/${maxRetries}] Lỗi lưu telegram user:`, error.message);
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }

      // Tin nhắn chào mừng với tên từ Firebase
      const welcomeMessage = `
🌊 *Chào mừng đến với Hệ thống Cảnh báo Ngập lụt Đà Nẵng!* 🌧️

Xin chào *${userName}*! 👋

✅ Bạn đã liên kết thành công Telegram với tài khoản của mình.
${userEmail ? `📧 Email: ${userEmail}` : ""}

📍 *Những gì bạn sẽ nhận được:*
🔔 Cảnh báo ngập lụt khẩn cấp theo thời gian thực
🌊 Thông tin mực nước từ cảm biến IoT
📍 Cảnh báo cá nhân hóa cho địa điểm bạn quan tâm
⚠️ Khuyến nghị an toàn khi có ngập lụt

📱 Bạn sẽ nhận được thông báo tự động khi có cảnh báo ngập lụt gần vị trí của bạn.

🛡️ Hãy luôn cảnh giác và an toàn!
      `.trim();

      await sendMessage(chatId, welcomeMessage);

      if (linkSuccess && saveSuccess) {
        console.log(
          `✅ [${new Date().toISOString()}] User ${chatId} (${username}) đã liên kết thành công với Firebase account ${userIdFromDeepLink}`
        );
      } else {
        console.warn(
          `⚠️ [${new Date().toISOString()}] User ${chatId} (${username}) link với ${userIdFromDeepLink} nhưng có một số thao tác thất bại`
        );
      }
      return;
    }

    // Nếu không có userId (start thường), lưu cơ bản
    const result = await saveTelegramUser(chatId, {
      username,
      first_name: firstName,
      last_name: lastName,
    });

    // Tin nhắn chào mừng
    const welcomeMessage = `
🌊 *Chào mừng đến với Hệ thống Cảnh báo Ngập lụt Đà Nẵng!* 🌧️

Xin chào *${firstName}*! 👋

✅ Bạn đã đăng ký thành công nhận cảnh báo ngập lụt.

📍 *Những gì bạn sẽ nhận được:*
🔔 Cảnh báo ngập lụt khẩn cấp theo thời gian thực
🌊 Thông tin mực nước và khu vực nguy hiểm
⚠️ Khuyến nghị an toàn khi có ngập lụt

📱 Bạn sẽ nhận được thông báo tự động khi có cảnh báo ngập lụt trong khu vực.

🛡️ Hãy luôn cảnh giác và an toàn!
    `.trim();

    await sendMessage(chatId, welcomeMessage);

    console.log(
      `✅ Người dùng ${chatId} (${username}) đã ${
        result.isNew ? "đăng ký mới" : "kích hoạt lại"
      }`
    );
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] Lỗi xử lý lệnh /start cho ${chatId}:`, error.message);
    console.error(`📋 Stack trace:`, error.stack);
    
    // Gửi thông báo lỗi cho user
    try {
      await sendMessage(
        chatId,
        "❌ Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau hoặc liên hệ hỗ trợ."
      );
    } catch (sendError) {
      console.error(`❌ Không thể gửi thông báo lỗi tới ${chatId}:`, sendError.message);
    }
    
    // Re-throw để retry mechanism có thể xử lý
    throw error;
  }
}

/**
 * Xử lý lệnh /stop
 * @param {object} message - Telegram message object
 */
async function handleStopCommand(message) {
  const chatId = message.chat.id;

  try {
    await deactivateUser(chatId);

    const goodbyeMessage = `
👋 *Tạm biệt!*

Bạn đã hủy đăng ký nhận cảnh báo ngập lụt.

Để đăng ký lại, sử dụng lệnh /start bất kỳ lúc nào.

🙏 Cảm ơn bạn đã sử dụng dịch vụ!
    `.trim();

    await sendMessage(chatId, goodbyeMessage);
    console.log(`✅ Người dùng ${chatId} đã hủy đăng ký`);
  } catch (error) {
    console.error(`❌ Lỗi xử lý lệnh /stop cho ${chatId}:`, error.message);
  }
}

/**
 * Xử lý lệnh /status
 * @param {object} message - Telegram message object
 */
async function handleStatusCommand(message) {
  const chatId = message.chat.id;

  const statusMessage = `
📊 *Trạng thái Hệ thống*

✅ Bot đang hoạt động bình thường
🔔 Bạn đang nhận cảnh báo
🕐 Cập nhật: ${new Date().toLocaleString("vi-VN")}

📱 Sử dụng /help để xem danh sách lệnh
  `.trim();

  await sendMessage(chatId, statusMessage);
}

/**
 * Xử lý lệnh /help
 * @param {object} message - Telegram message object
 */
async function handleHelpCommand(message) {
  const chatId = message.chat.id;

  const helpMessage = `
📖 *Hướng dẫn Sử dụng*

*Các lệnh có sẵn:*
/start - Đăng ký nhận cảnh báo
/stop - Hủy đăng ký
/status - Kiểm tra trạng thái
/help - Hiển thị hướng dẫn

⚡ *Cảnh báo tự động:*
Bot sẽ tự động gửi cảnh báo khi phát hiện nguy cơ ngập lụt.

💡 *Mẹo:* Bật thông báo để không bỏ lỡ cảnh báo khẩn cấp!
  `.trim();

  await sendMessage(chatId, helpMessage);
}

/**
 * Xử lý tin nhắn từ người dùng
 * @param {object} message - Telegram message object
 */
async function handleMessage(message) {
  const text = message.text || "";

  if (text.startsWith("/start")) {
    await handleStartCommand(message);
  } else if (text.startsWith("/stop")) {
    await handleStopCommand(message);
  } else if (text.startsWith("/status")) {
    await handleStatusCommand(message);
  } else if (text.startsWith("/help")) {
    await handleHelpCommand(message);
  } else {
    // Tin nhắn thông thường
    const chatId = message.chat.id;
    await sendMessage(
      chatId,
      "👋 Xin chào! Sử dụng /help để xem danh sách lệnh."
    );
  }
}

/**
 * Xử lý một update với retry mechanism
 * @param {object} update - Telegram update object
 * @param {number} retries - Số lần retry còn lại
 */
async function processSingleUpdate(update, retries = 3) {
  const updateId = update.update_id;
  const chatId = update.message?.chat?.id || 'unknown';
  
  try {
    console.log(`🔄 Xử lý update ${updateId} cho chat ${chatId}`);
    
    // Xử lý tin nhắn
    if (update.message) {
      await handleMessage(update.message);
    }
    
    // ⭐ QUAN TRỌNG: Chỉ cập nhật offset SAU KHI xử lý thành công
    updateOffset = Math.max(updateOffset, updateId + 1);
    console.log(`✅ Đã xử lý thành công update ${updateId}, offset mới: ${updateOffset}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Lỗi xử lý update ${updateId} (chat ${chatId}):`, error.message);
    console.error(`📋 Stack trace:`, error.stack);
    
    // Retry nếu còn retries
    if (retries > 0) {
      const delay = (4 - retries) * 1000; // Exponential backoff: 1s, 2s, 3s
      console.log(`🔄 Retry update ${updateId} sau ${delay}ms (còn ${retries - 1} lần thử)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return await processSingleUpdate(update, retries - 1);
    } else {
      // Nếu hết retries, vẫn cập nhật offset để không bị stuck
      // Nhưng log warning
      console.warn(`⚠️ Bỏ qua update ${updateId} sau 3 lần thử thất bại`);
      updateOffset = Math.max(updateOffset, updateId + 1);
      return false;
    }
  }
}

/**
 * Xử lý các updates từ Telegram (song song để tăng tốc độ)
 * @param {Array} updates - Danh sách updates
 */
async function processUpdates(updates) {
  if (!updates || updates.length === 0) {
    return;
  }
  
  console.log(`📨 Bắt đầu xử lý ${updates.length} updates...`);
  
  // Xử lý song song nhưng giới hạn concurrent để tránh quá tải
  const CONCURRENT_LIMIT = 5; // Xử lý tối đa 5 updates cùng lúc
  const results = [];
  
  for (let i = 0; i < updates.length; i += CONCURRENT_LIMIT) {
    const batch = updates.slice(i, i + CONCURRENT_LIMIT);
    const batchPromises = batch.map(update => processSingleUpdate(update));
    const batchResults = await Promise.allSettled(batchPromises);
    results.push(...batchResults);
  }
  
  // Thống kê kết quả
  const successful = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
  const failed = results.length - successful;
  
  if (failed > 0) {
    console.warn(`⚠️ Xử lý updates: ${successful} thành công, ${failed} thất bại`);
  } else {
    console.log(`✅ Đã xử lý thành công ${successful} updates`);
  }
}

/**
 * Lấy updates từ Telegram sử dụng Long Polling
 */
async function getUpdates() {
  try {
    const response = await axios.get(`${TELEGRAM_API_URL}/getUpdates`, {
      params: {
        offset: updateOffset,
        timeout: POLLING_TIMEOUT,
        allowed_updates: ["message"],
      },
      timeout: (POLLING_TIMEOUT + 5) * 1000, // Thêm 5 giây buffer
    });

    if (response.data.ok) {
      if (response.data.result.length > 0) {
        console.log(`📨 [${new Date().toISOString()}] Nhận được ${response.data.result.length} updates mới`);
        await processUpdates(response.data.result);
      }
      // Cập nhật offset ngay cả khi không có updates mới để tránh bị stuck
      if (response.data.result.length > 0) {
        const maxUpdateId = Math.max(...response.data.result.map(u => u.update_id));
        updateOffset = Math.max(updateOffset, maxUpdateId + 1);
      }
    } else {
      console.error(`❌ Telegram API trả về lỗi:`, response.data);
    }
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      // Timeout bình thường, không cần báo lỗi
      return;
    }
    console.error("❌ Lỗi lấy updates:", error.message);
    // Chờ 5 giây trước khi thử lại
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

/**
 * Khởi động Bot với Long Polling
 * @param {string} botToken - Optional: Bot token to use (defaults to process.env.TELEGRAM_BOT_TOKEN)
 */
async function startBot(botToken) {
  if (isRunning) {
    console.log("⚠️ Bot đã đang chạy");
    return;
  }

  // Update bot token if provided
  if (botToken) {
    BOT_TOKEN = botToken;
    TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
  } else {
    // Refresh from environment
    BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "YOUR_BOT_TOKEN";
    TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
  }

  if (!BOT_TOKEN || BOT_TOKEN === "YOUR_BOT_TOKEN") {
    console.error("❌ TELEGRAM_BOT_TOKEN chưa được cấu hình");
    throw new Error("Missing TELEGRAM_BOT_TOKEN");
  }

  console.log("🤖 Khởi động Telegram Bot (Long Polling)...");
  console.log("🔥 Sử dụng Firebase Realtime Database (REST API)");

  // Kiểm tra Bot Token với error handling tốt hơn
  try {
    const response = await axios.get(`${TELEGRAM_API_URL}/getMe`, {
      timeout: 10000, // 10 giây timeout
    });
    if (response.data.ok) {
      console.log(`✅ Bot đã kết nối: @${response.data.result.username}`);
      console.log(`🤖 Bot ID: ${response.data.result.id}`);
    } else {
      console.error("❌ Bot Token không hợp lệ:", response.data);
      throw new Error("Invalid bot token");
    }
  } catch (error) {
    console.error("❌ Không thể kết nối với Telegram API:", error.message);
    if (error.response) {
      console.error("📋 Response status:", error.response.status);
      console.error("📋 Response data:", error.response.data);
    }
    if (error.code === "ENOTFOUND") {
      console.error(
        "🌐 Không thể kết nối đến api.telegram.org - Kiểm tra kết nối mạng"
      );
    }
    throw error;
  }

  console.log("🔄 Bắt đầu Long Polling...");
  console.log("📡 Đang lắng nghe tin nhắn từ người dùng...\n");

  isRunning = true;

  // Vòng lặp Long Polling
  const poll = async () => {
    if (!isRunning) return;

    try {
      await getUpdates();
    } catch (error) {
      console.error("❌ Lỗi polling:", error.message);
    }

    // Continue polling if still running
    if (isRunning) {
      pollingInterval = setTimeout(poll, 100); // Poll again after 100ms
    }
  };

  poll();
}

/**
 * Dừng Bot
 */
function stopBot() {
  if (!isRunning) {
    console.log("⚠️ Bot chưa chạy");
    return;
  }

  console.log("🛑 Đang dừng Telegram Bot...");
  isRunning = false;

  if (pollingInterval) {
    clearTimeout(pollingInterval);
    pollingInterval = null;
  }

  console.log("✅ Telegram Bot đã dừng");
}

// Xử lý tắt ứng dụng gracefully khi chạy standalone
if (require.main === module) {
  process.on("SIGINT", () => {
    console.log("\n👋 Đang dừng Bot...");
    stopBot();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\n👋 Đang dừng Bot...");
    stopBot();
    process.exit(0);
  });

  // Khởi động Bot khi chạy standalone
  startBot().catch((error) => {
    console.error("❌ Lỗi nghiêm trọng:", error);
    process.exit(1);
  });
}

module.exports = {
  sendMessage,
  start: startBot,
  stop: stopBot,
  startBot, // Keep for backward compatibility
  stopBot,
};
