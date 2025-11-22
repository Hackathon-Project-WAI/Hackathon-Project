const express = require("express");
const alertRoutes = require("./alertRoutes");
const firebaseRoutes = require("./firebaseRoutes");
const telegramRoutes = require("./telegramRoutes");

const router = express.Router();

// Mount routes
router.use("/api", alertRoutes);
router.use("/api/firebase", firebaseRoutes);
router.use("/api/telegram", telegramRoutes);

module.exports = router;
