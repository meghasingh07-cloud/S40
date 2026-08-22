const mongoose = require("mongoose");

const riskEventSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        transactionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Transaction",
            default: null
        },

        sessionId: {
            type: String,
            default: null
        },

        eventOrder: {
            type: Number,
            default: 1
        },

        type: {
            type: String,
            required: true
        },

        riskContribution: {
            type: Number,
            required: true
        },

        explanation: {
            type: String,
            required: true
        },

        metadata: {
            type: Object,
            default: {}
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("RiskEvent", riskEventSchema);