const express = require("express");
const router = express.Router();

const { checkMessageController } = require("../controllers/messageCheckController");
router.post("/check", checkMessageController);

module.exports = router;