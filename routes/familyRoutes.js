const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    requestApproval,
    getPendingApprovals,
    respondToApproval
} = require("../controllers/familyController");

router.post(
    "/request-approval",
    protect,
    requestApproval
);

router.get(
    "/pending",
    protect,
    getPendingApprovals
);

router.patch(
    "/approval/:approvalId",
    protect,
    respondToApproval
);

module.exports = router;