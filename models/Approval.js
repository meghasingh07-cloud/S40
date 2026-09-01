const mongoose = require("mongoose");

const approvalSchema = new mongoose.Schema(
    {
        childId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        transactionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Transaction",
            required: true
        },

        status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED"],
            default: "PENDING"
        },

        reason: {
            type: String,
            default: ""
        },

        reviewedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Approval", approvalSchema);
