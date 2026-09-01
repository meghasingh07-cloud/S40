const express = require("express");
const protect = require("../middleware/authMiddleware");
const controller = require("../controllers/fraudShieldAIController");

const router = express.Router();

router.get("/health", controller.health);
router.get("/account-analysis", protect, controller.accountAnalysis);
router.post("/payment-initial", protect, controller.paymentInitialAnalysis);
router.post("/payment-analysis", protect, controller.paymentAnalysis);
router.post("/voice-analysis", protect, controller.voiceAnalysis);
router.post("/message-analysis", protect, controller.messageAnalysis);

module.exports = router;