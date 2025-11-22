const express = require("express");
const firebaseController = require("../controllers/firebaseController");

const router = express.Router();

// Firebase data routes
router.get(
  "/sensors",
  firebaseController.getAllSensors.bind(firebaseController)
);
router.get(
  "/sensors/:sensorId",
  firebaseController.getSensorById.bind(firebaseController)
);
router.post("/write", firebaseController.writeData.bind(firebaseController));

module.exports = router;
