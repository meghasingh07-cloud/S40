const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    createSession,
    addEvent,
    getTimeline
} = require("../controllers/scamController");

router.post("/session", protect, createSession);

router.post(
    "/session/:sessionId/event",
    protect,
    addEvent
);

router.get(
    "/session/:sessionId/timeline",
    protect,
    getTimeline
);

module.exports = router;