/**
 * Middleware xử lý CORS
 */
function corsMiddleware(req, res, next) {
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://hackathon-weather-634bf.web.app",
    "https://hackathon-weather-634bf.firebaseapp.com",
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
}

/**
 * Middleware xử lý lỗi
 */
function errorHandler(err, req, res, next) {
  console.error("❌ Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
}

/**
 * Middleware log request
 */
function requestLogger(req, res, next) {
  console.log(`${req.method} ${req.path}`);
  next();
}

module.exports = {
  corsMiddleware,
  errorHandler,
  requestLogger,
};
