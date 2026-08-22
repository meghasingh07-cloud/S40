const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Approval = require("../models/Approval");

const requestApproval = async (req, res) => {
    try {
        const { transactionId } = req.body;

        if (!transactionId) {
            return res.status(400).json({
                message: "transactionId is required"
            });
        }

        const child = await User.findById(req.user.userId);

        if (!child) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (!child.isSupervised || !child.parentId) {
            return res.status(400).json({
                message: "This account is not configured for parent approval"
            });
        }

        const transaction = await Transaction.findOne({
            _id: transactionId,
            userId: child._id
        });

        if (!transaction) {
            return res.status(404).json({
                message: "Transaction not found"
            });
        }

        const approval = await Approval.create({
            childId: child._id,
            parentId: child.parentId,
            transactionId: transaction._id,
            reason: `High-risk transaction (${transaction.riskLevel})`
        });

        res.status(201).json({
            message: "Parent approval requested",
            approval
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to request approval",
            error: error.message
        });
    }
};

const getPendingApprovals = async (req, res) => {
    try {
        const approvals = await Approval.find({
            parentId: req.user.userId,
            status: "PENDING"
        })
            .populate("childId", "name email")
            .populate("transactionId");

        res.json({
            approvals
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch approvals",
            error: error.message
        });
    }
};


const respondToApproval = async (req, res) => {
    try {
        const { approvalId } = req.params;
        const { action } = req.body;

        if (!["APPROVED", "REJECTED"].includes(action)) {
            return res.status(400).json({
                message: "Action must be APPROVED or REJECTED"
            });
        }

        const approval = await Approval.findOne({
            _id: approvalId,
            parentId: req.user.userId,
            status: "PENDING"
        });

        if (!approval) {
            return res.status(404).json({
                message: "Pending approval not found"
            });
        }

        approval.status = action;
        approval.reviewedAt = new Date();

        await approval.save();

        const transaction = await Transaction.findById(
            approval.transactionId
        );

        if (transaction) {
            transaction.status =
                action === "APPROVED"
                    ? "completed"
                    : "cancelled";

            await transaction.save();
        }

        res.json({
            message:
                action === "APPROVED"
                    ? "Transaction approved successfully"
                    : "Transaction rejected successfully",

            approval: {
                id: approval._id,
                status: approval.status,
                reviewedAt: approval.reviewedAt
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to process approval",
            error: error.message
        });
    }
};


module.exports = {
    requestApproval,
    getPendingApprovals,
    respondToApproval
};

