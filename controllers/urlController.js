const ScamSession = require("../models/ScamSession");
const RiskEvent = require("../models/RiskEvent");
const analyzeUrl = require("../services/urlRiskEngine");

const analyzeUrlController = async (req, res) => {
    try {
        const { sessionId, url } = req.body;

        if (!url || !url.trim()) {
            return res.status(400).json({
                message: "URL is required"
            });
        }

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

        const result = analyzeUrl(url);

        const previousScore = session.currentRiskScore;

        const events = result.indicators.map((indicator, index) => ({
            userId: req.user.userId,
            sessionId: session._id,
            eventOrder: session.totalEvents + index + 1,
            type: indicator.type,
            riskContribution: indicator.riskContribution,
            explanation: indicator.explanation,
            metadata: {
                source: "url",
                url
            }
        }));

        if (events.length > 0) {
            await RiskEvent.insertMany(events);
        }

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
            message: "URL analyzed successfully",

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
        console.error("URL ANALYSIS ERROR:", error);

        res.status(500).json({
            message: "URL analysis failed",
            error: error.message
        });
    }
};

module.exports = {
    analyzeUrlController
};