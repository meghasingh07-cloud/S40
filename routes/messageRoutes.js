const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");

const {analyzeMessageController} = require("../controllers/messageController");

router.post(
    "/analyze",
    protect,
    analyzeMessageController
);

module.exports = router;