const ScamSession = require("../models/ScamSession");
const RiskEvent = require("../models/RiskEvent");
const analyzeMessage = require("../services/messageRiskEngine");

const analyzeMessageController = async (req, res) => {
    try {
        const { sessionId, message } = req.body;

        // Validate message
        if (!message || !message.trim()) {
            return res.status(400).json({
                message: "Message is required"
            });
        }

        // Validate session
        if (!sessionId) {
            return res.status(400).json({
                message: "sessionId is required"
            });
        }

        const session = await ScamSession.findOne({
            _id: sessionId,
            userId: req.user.userId,
            status: "active"
        });

        if (!session) {
            return res.status(404).json({
                message: "Active scam session not found"
            });
        }

        // Analyze message
        const result = analyzeMessage(message);

        // Starting event order
        let nextEventOrder = session.totalEvents + 1;

        // Current risk before message analysis
        const previousScore = session.currentRiskScore;

        // Save individual indicators
        const events = result.indicators.map((indicator) => ({
            userId: req.user.userId,
            sessionId: session._id,
            eventOrder: nextEventOrder++,
            type: indicator.type,
            riskContribution: indicator.riskContribution,
            explanation: indicator.explanation,
            metadata: {
                source: "message"
            }
        }));

        // Insert events
        if (events.length > 0) {
            await RiskEvent.insertMany(events);
        }

        // Update session score
        session.currentRiskScore = Math.min(
            session.currentRiskScore + result.score,
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

        res.status(200).json({
            message: "Message analyzed successfully",

            analysis: {
                score: result.score,
                indicators: result.indicators
            },

            riskEvolution: {
                previousScore,
                currentScore: session.currentRiskScore,
                riskLevel: session.riskLevel
            }
        });

    } catch (error) {
        console.error("MESSAGE ANALYSIS ERROR:", error);

        res.status(500).json({
            message: "Message analysis failed",
            error: error.message
        });
    }
};

module.exports = {
    analyzeMessageController
};