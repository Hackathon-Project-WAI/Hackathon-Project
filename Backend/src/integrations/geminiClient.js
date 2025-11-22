const { GoogleGenerativeAI } = require("@google/generative-ai");
const https = require("https");
const http = require("http");

class GeminiClient {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.genAI = null;

    // Tăng timeout cho HTTP requests
    https.globalAgent.options.timeout = 30000;
    http.globalAgent.options.timeout = 30000;
  }

  /**
   * Khởi tạo Gemini AI
   */
  initialize() {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY chưa được cấu hình trong .env");
    }

    if (!this.genAI) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      console.log("✅ Gemini AI khởi tạo thành công");
    }

    return this.genAI;
  }

  /**
   * Retry helper with exponential backoff
   */
  async retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;

        const delay = initialDelay * Math.pow(2, i);
        console.log(`⏳ Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Tạo cảnh báo ngập lụt bằng AI
   */
  async generateFloodAlert(alertData) {
    const genAI = this.initialize();

    return this.retryWithBackoff(
      async () => {
        try {
          const {
            current_percent,
            previous_percent,
            location,
            timestamp,
            water_level_cm,
            flood_status,
          } = alertData;

          // Tạo prompt chi tiết
          const prompt = `
Bạn là một hệ thống Trí tuệ Nhân tạo chuyên biệt trong việc tạo ra các thông báo cảnh báo ngập lụt khẩn cấp, có tính hành động.

Dữ liệu quan trắc mới nhất:
${location ? `- Vị trí Trạm: ${location}` : ""}
${current_percent ? `- Mức ngập HIỆN TẠI: ${current_percent}%` : ""}
${previous_percent ? `- Mức ngập trước đó 5 phút: ${previous_percent}%` : ""}
${water_level_cm ? `- Mức nước hiện tại: ${water_level_cm} cm` : ""}
${flood_status ? `- Trạng thái: ${flood_status}` : ""}
- Ngưỡng Nguy hiểm Cao (Đỏ): 80%
- Ngưỡng Cảnh báo Trung bình (Vàng): 60%
- Thời điểm đo: ${timestamp || new Date().toLocaleString("vi-VN")}

YÊU CẦU ĐẦU RA:
1. Xác định CẤP ĐỘ NGUY HIỂM (Thấp/Trung bình/Cao) và TỐC ĐỘ Nước TĂNG (Nhanh/Chậm/Ổn định).
2. Nội dung Email (Body): Dưới 150 từ, sử dụng ngôn ngữ khẩn cấp, có cấu trúc **HTML đơn giản** (dùng <b>, <br>, <ul>, <li>), và **KHÔNG DÙNG Markdown**.
3. Đưa ra **HÀNH ĐỘNG CỤ THỂ** theo cấp độ nguy hiểm (ví dụ: Di dời tài sản, Tránh tuyến đường).
4. Hãy sử dụng tiếng Việt chuẩn.

FORMAT BẮT BUỘC: Trả về **DUY NHẤT** một đối tượng JSON với 2 trường: subject và htmlBody.

Trả về ĐÚNG format JSON này (không có markdown, không có \`\`\`json):
{
  "subject": "tiêu đề email",
  "htmlBody": "nội dung HTML"
}
`;

          const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
          });

          const result = await model.generateContent(prompt, {
            timeout: 30000, // 30 seconds timeout
          });
          const response = await result.response;
          let text = response.text();

          console.log("📝 Raw Gemini response:", text);

          // Parse JSON từ response
          let generatedAlert;
          try {
            // Loại bỏ markdown code blocks nếu có
            const jsonMatch =
              text.match(/```json\n?([\s\S]*?)\n?```/) ||
              text.match(/```\n?([\s\S]*?)\n?```/);

            if (jsonMatch) {
              text = jsonMatch[1];
            }

            // Clean text: loại bỏ comments, trailing commas, và whitespace thừa
            text = text
              .replace(/\/\/.*/g, "") // Loại bỏ // comments
              .replace(/\/\*[\s\S]*?\*\//g, "") // Loại bỏ /* */ comments
              .replace(/,(\s*[}\]])/g, "$1") // Loại bỏ trailing commas
              .trim();

            generatedAlert = JSON.parse(text);
          } catch (e) {
            console.error("❌ JSON parse error:", e.message);
            console.error("📄 Text to parse:", text);
            throw new Error(
              `Không thể parse JSON từ Gemini response: ${e.message}`
            );
          }

          console.log("✅ Gemini AI đã tạo cảnh báo:", generatedAlert.subject);
          return generatedAlert;
        } catch (error) {
          console.error("❌ Lỗi gọi Gemini API:", error.message);
          throw error;
        }
      },
      3,
      2000
    ); // 3 retries, starting with 2s delay
  }

  /**
   * Tạo phân tích thời tiết bằng AI
   */
  async analyzeWeatherData(weatherData) {
    const genAI = this.initialize();

    return this.retryWithBackoff(
      async () => {
        try {
          const prompt = `
Phân tích dữ liệu thời tiết sau và đưa ra cảnh báo nếu cần:

${JSON.stringify(weatherData, null, 2)}

Trả về JSON với format:
{
  "severity": "low|medium|high",
  "summary": "Tóm tắt ngắn gọn",
  "recommendations": ["Khuyến nghị 1", "Khuyến nghị 2"]
}
`;

          const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
          });

          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();

          // Parse JSON
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }

          throw new Error("Không thể parse JSON từ response");
        } catch (error) {
          console.error("❌ Lỗi phân tích thời tiết:", error.message);
          throw error;
        }
      },
      3,
      2000
    ); // 3 retries, starting with 2s delay
  }

  /**
   * Tạo nội dung có cấu trúc với JSON schema
   * @param {string} prompt - Prompt cho AI
   * @param {object} schema - JSON schema cho response
   */
  async generateStructuredContent(prompt, schema) {
    const genAI = this.initialize();

    return this.retryWithBackoff(
      async () => {
        try {
          const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: schema,
            },
          });

          const result = await model.generateContent(prompt, {
            timeout: 30000,
          });
          const response = await result.response;
          const text = response.text();

          // Parse JSON
          return JSON.parse(text);
        } catch (error) {
          console.error("❌ Lỗi generate structured content:", error.message);
          throw error;
        }
      },
      3,
      2000
    );
  }
}

module.exports = new GeminiClient();
