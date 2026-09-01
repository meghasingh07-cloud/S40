const mongoose = require("mongoose");

const scamSessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        status: {
            type: String,
            enum: ["active", "completed", "cancelled"],
            default: "active"
        },

        currentRiskScore: {
            type: Number,
            default: 0
        },

        riskLevel: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH"],
            default: "LOW"
        },

        totalEvents: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("ScamSession", scamSessionSchema);