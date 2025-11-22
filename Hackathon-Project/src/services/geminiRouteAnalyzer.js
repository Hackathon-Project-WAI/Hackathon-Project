/**
 * Gemini AI Route Analyzer Service
 * Sử dụng Gemini AI để phân tích và chọn tuyến đường tốt nhất
 */

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || "";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Phân tích tất cả routes và recommend tuyến đường tốt nhất
 * @param {Array} routes - Danh sách routes đã phân tích
 * @param {Object} preferences - Ưu tiên của user (safety, speed, distance)
 * @returns {Promise<Object>} - { recommendedIndex, reasoning, score }
 */
export const analyzeRoutesWithGemini = async (routes, preferences = {}) => {
  if (!routes || routes.length === 0) {
    throw new Error("No routes to analyze");
  }

  if (!GEMINI_API_KEY) {
    console.warn("⚠️ GEMINI_API_KEY not found. Using fallback algorithm.");
    return fallbackRouteSelection(routes, preferences);
  }

  // Chuẩn bị dữ liệu routes cho Gemini
  const routesData = routes.map((route, index) => ({
    index: index + 1,
    distance: route.distance.toFixed(2),
    duration: Math.round(route.duration),
    floodCount: route.floodCount,
    floodZones:
      route.affectedZones?.map((z) => ({
        name: z.name,
        risk: z.riskLevel,
        distance: z.distanceToRoute
          ? `${z.distanceToRoute.toFixed(0)}m`
          : "unknown",
      })) || [],
    safetyScore: calculateSafetyScore(route),
  }));

  // Xây dựng prompt chi tiết
  const prompt = `Bạn là chuyên gia phân tích giao thông và an toàn đường bộ ở Đà Nẵng, Việt Nam.

NHIỆM VỤ: Phân tích ${
    routes.length
  } tuyến đường dưới đây và chọn tuyến đường TỐT NHẤT.

DỮ LIỆU CÁC TUYẾN ĐƯỜNG:
${JSON.stringify(routesData, null, 2)}

YÊU CẦU ƯU TIÊN:
${
  preferences.prioritySafety
    ? "- ✅ An toàn là ưu tiên hàng đầu (tránh vùng ngập)"
    : ""
}
${preferences.prioritySpeed ? "- ✅ Thời gian nhanh nhất" : ""}
${preferences.priorityDistance ? "- ✅ Khoảng cách ngắn nhất" : ""}

TIÊU CHÍ ĐÁNH GIÁ:
1. An toàn: Tránh vùng ngập lụt (floodCount càng thấp càng tốt)
2. Thời gian: Duration hợp lý
3. Khoảng cách: Distance không quá xa
4. Mức độ rủi ro: Nếu có vùng ngập, ưu tiên tránh vùng "high" risk

HÃY TRẢ LỜI THEO FORMAT JSON SAU (CHỈ JSON, KHÔNG TEXT THÊM):
{
  "recommendedIndex": <số thứ tự tuyến đường từ 1-${routes.length}>,
  "reasoning": "<lý do ngắn gọn 2-3 câu>",
  "safetyScore": <điểm an toàn từ 0-100>,
  "alternativeIndex": <tuyến thay thế nếu tuyến chính có vấn đề>
}`;

  try {
    console.log("🤖 Gemini đang phân tích", routes.length, "tuyến đường...");

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3, // Ít sáng tạo hơn, chính xác hơn
          maxOutputTokens: 500,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error("Empty response from Gemini");
    }

    console.log("📝 Gemini raw response:", rawText);

    // Parse JSON từ response (có thể có markdown code blocks)
    let result;
    try {
      // Loại bỏ markdown code blocks nếu có
      const jsonText = rawText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      result = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("❌ Failed to parse Gemini JSON:", parseError);
      throw new Error("Invalid JSON response from Gemini");
    }

    // Validate result
    if (
      !result.recommendedIndex ||
      result.recommendedIndex < 1 ||
      result.recommendedIndex > routes.length
    ) {
      throw new Error("Invalid recommendedIndex from Gemini");
    }

    // Convert 1-based index to 0-based
    result.recommendedIndex = result.recommendedIndex - 1;
    if (result.alternativeIndex) {
      result.alternativeIndex = result.alternativeIndex - 1;
    }

    console.log("✅ Gemini recommendation:", result);

    return {
      success: true,
      recommendedIndex: result.recommendedIndex,
      reasoning:
        result.reasoning || "Tuyến đường tốt nhất dựa trên phân tích AI",
      safetyScore: result.safetyScore || 0,
      alternativeIndex: result.alternativeIndex,
      aiAnalyzed: true,
    };
  } catch (error) {
    console.error("❌ Gemini analysis error:", error);
    console.log("🔄 Fallback to algorithm-based selection...");
    return fallbackRouteSelection(routes, preferences);
  }
};

/**
 * Fallback: Chọn route bằng thuật toán nếu Gemini fail
 */
const fallbackRouteSelection = (routes, preferences = {}) => {
  let bestIndex = 0;
  let bestScore = -1;

  routes.forEach((route, index) => {
    let score = 0;

    // An toàn (60 điểm)
    if (route.floodCount === 0) {
      score += 60;
    } else {
      score += Math.max(0, 60 - route.floodCount * 15); // -15 điểm mỗi vùng ngập
    }

    // Thời gian (20 điểm)
    const minDuration = Math.min(...routes.map((r) => r.duration));
    score += 20 * (1 - (route.duration - minDuration) / minDuration);

    // Khoảng cách (20 điểm)
    const minDistance = Math.min(...routes.map((r) => r.distance));
    score += 20 * (1 - (route.distance - minDistance) / minDistance);

    // Bonus nếu match preferences
    if (preferences.prioritySafety && route.floodCount === 0) score += 10;
    if (preferences.prioritySpeed && route.duration === minDuration)
      score += 10;
    if (preferences.priorityDistance && route.distance === minDistance)
      score += 10;

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return {
    success: true,
    recommendedIndex: bestIndex,
    reasoning:
      "Tuyến đường được chọn dựa trên thuật toán phân tích an toàn và hiệu quả",
    safetyScore: Math.round(bestScore),
    alternativeIndex: bestIndex === 0 ? 1 : 0,
    aiAnalyzed: false,
  };
};

/**
 * Tính điểm an toàn cho route
 */
const calculateSafetyScore = (route) => {
  let score = 100;

  // Trừ điểm theo số vùng ngập
  score -= route.floodCount * 15;

  // Trừ thêm nếu có vùng high risk
  const highRiskCount =
    route.affectedZones?.filter((z) => z.riskLevel === "high").length || 0;
  score -= highRiskCount * 10;

  return Math.max(0, score);
};

/**
 * Phân tích chi tiết một route cụ thể
 */
export const analyzeRouteDetails = async (route, routeIndex) => {
  if (!GEMINI_API_KEY) {
    return {
      success: false,
      error: "GEMINI_API_KEY not configured",
    };
  }

  const floodInfo =
    route.floodCount > 0
      ? `Lưu ý: Tuyến đường này đi qua ${route.floodCount} vùng ngập lụt.`
      : `Tuyến đường này không đi qua vùng ngập.`;

  const prompt = `Bạn là chuyên gia phân tích giao thông và an toàn đường bộ ở Đà Nẵng.

Thông tin lộ trình ${routeIndex + 1}:
- Khoảng cách: ${route.distance.toFixed(2)} km
- Thời gian dự kiến: ${Math.round(route.duration)} phút
- ${floodInfo}
${
  route.affectedZones?.length > 0
    ? `\nCác vùng ngập:\n${route.affectedZones
        .map((z) => `- ${z.name} (${z.riskLevel})`)
        .join("\n")}`
    : ""
}

Hãy đưa ra đánh giá ngắn gọn về:
1. Mức độ an toàn của tuyến đường này
2. Những rủi ro cần lưu ý (nếu có)
3. Khuyến nghị có nên chọn tuyến này không

Trả lời bằng tiếng Việt, tối đa 50 từ, ngắn gọn và dễ hiểu.`;

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await response.json();
    const advice =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Không thể kết nối AI. Vui lòng kiểm tra API key.";

    return {
      success: true,
      advice,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

const geminiRouteAnalyzer = {
  analyzeRoutesWithGemini,
  analyzeRouteDetails,
};

export default geminiRouteAnalyzer;
