const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ScamSession",
        default: null
        },

        amount: {
            type: Number,
            required: true
        },

        type: {
            type: String,
            enum: ["UPI", "CARD", "WALLET"],
            default: "UPI"
        },

        recipientName: {
            type: String,
            required: true
        },

        recipientUPI: {
            type: String,
            default: null
        },

        category: {
            type: String,
            enum: [
                "shopping",
                "gaming",
                "food",
                "travel",
                "education",
                "other"
            ],
            default: "other"
        },

        isNewRecipient: {
            type: Boolean,
            default: false
        },

        deviceId: {
            type: String,
            default: null
        },

        source: {
            type: String,
            enum: ["app", "link", "qr", "unknown"],
            default: "app"
        },

        status: {
            type: String,
            enum: ["pending", "completed", "cancelled"],
            default: "pending"
        },

        riskScore: {
            type: Number,
            default: 0
        },

        riskLevel: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH"],
            default: "LOW"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Transaction", transactionSchema);