const Transaction = require("../models/Transaction");
const RiskEvent = require("../models/RiskEvent");
const calculateRisk = require("../services/riskEngine");

const createTransaction = async (req, res) => {
    try {
        const {
            amount,
            type,
            recipientName,
            recipientUPI,
            category,
            isNewRecipient,
            deviceId,
            source,
            isNewDevice,
            sessionId
        } = req.body;

        const riskInput = {
            amount,
            category,
            isNewRecipient: Boolean(isNewRecipient),
            source,
            isNewDevice: Boolean(isNewDevice),
            isSupervised: req.user.isSupervised || false
        };

        // Calculate risk
        const riskResult = calculateRisk(riskInput);

        // Save transaction
        const transaction = await Transaction.create({
            userId: req.user.userId,
            sessionId,
            amount,
            type,
            recipientName,
            recipientUPI,
            category,
            isNewRecipient: Boolean(isNewRecipient),
            deviceId,
            source,
            riskScore: riskResult.score,
            riskLevel: riskResult.riskLevel
        });

        // sessionId is optional. When present, this transaction is tied to an
        // active ScamSession and contributes its risk events to that session's
        // running score, exactly as before. When absent (e.g. a standalone
        // payment scored by the FraudShield AI bridge), the transaction is
        // still created and risk-scored, just without a session to update.
        let session = null;

        if (sessionId) {
            const ScamSession = require("../models/ScamSession");

            session = await ScamSession.findOne({
                _id: sessionId,
                userId: req.user.userId,
                status: "active"
            });

            if (!session) {
                return res.status(404).json({
                    message: "Active scam session not found"
                });
            }

            // Save risk events, ordered after whatever events already exist on the session
            const events = riskResult.events.map((event, index) => ({
                ...event,
                userId: req.user.userId,
                transactionId: transaction._id,
                sessionId,
                eventOrder: session.totalEvents + index + 1
            }));

            if (events.length > 0) {
                await RiskEvent.insertMany(events);
            }

            const totalContribution = riskResult.events.reduce(
                (sum, event) => sum + event.riskContribution,
                0
            );

            session.currentRiskScore = Math.min(
                session.currentRiskScore + totalContribution,
                100
            );

            session.riskLevel =
                session.currentRiskScore >= 70
                    ? "HIGH"
                    : session.currentRiskScore >= 40
                        ? "MEDIUM"
                        : "LOW";

            session.totalEvents += events.length;

            await session.save();
        }

        res.status(201).json({
            message: "Transaction analyzed successfully",

            transaction: {
                id: transaction._id,
                amount: transaction.amount,
                recipientName: transaction.recipientName,
                riskScore: transaction.riskScore,
                riskLevel: transaction.riskLevel
            },

            riskAnalysis: {
                score: riskResult.score,
                level: riskResult.riskLevel,
                events: riskResult.events
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Transaction analysis failed",
            error: error.message
        });
    }
};

module.exports = {
    createTransaction
};