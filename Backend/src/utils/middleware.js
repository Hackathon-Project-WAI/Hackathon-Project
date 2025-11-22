/**
 * Middleware xử lý CORS
 */
function corsMiddleware(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

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
