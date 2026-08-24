const analyzeMessage = require("../services/messageRiskEngine");
const calculateRiskLevel = (score) => {
    if (score >= 70) return "HIGH";
    if (score >= 40) return "MEDIUM";
    return "LOW";
};
const checkMessageController = (req, res) => {
    try {
        const { message } = req.body;

        if (!message || typeof message !== "string" || !message.trim()) {
            return res.status(400).json({
                message: "message is required"
            });
        }

        const result = analyzeMessage(message);

        return res.status(200).json({
            score: result.score,
            riskLevel: calculateRiskLevel(result.score),
            indicators: result.indicators
        });

    } catch (error) {
        console.error("MESSAGE CHECK ERROR:", error);

        return res.status(500).json({
            message: "Message check failed",
            error: error.message
        });
    }
};

module.exports = {
    checkMessageController
};