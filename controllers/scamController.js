const ScamSession = require("../models/ScamSession");
const RiskEvent = require("../models/RiskEvent");

const calculateRiskLevel = (score) => {
    if (score >= 70) return "HIGH";
    if (score >= 40) return "MEDIUM";
    return "LOW";
};

// Create a scam session
const createSession = async (req, res) => {
    try {
        const session = await ScamSession.create({
            userId: req.user.userId
        });

        res.status(201).json({
            message: "Scam session created",
            session
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to create scam session",
            error: error.message
        });
    }
};


// Add event to scam session
const addEvent = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const {
            type,
            riskContribution,
            explanation,
            metadata
        } = req.body;

        // Find session
        const session = await ScamSession.findOne({
            _id: sessionId,
            userId: req.user.userId
        });

        if (!session) {
            return res.status(404).json({
                message: "Scam session not found"
            });
        }

        if (session.status !== "active") {
            return res.status(400).json({
                message: "Scam session is no longer active"
            });
        }

        // Validate risk contribution
        if (typeof riskContribution !== "number") {
            return res.status(400).json({
                message: "riskContribution must be a number"
            });
        }

        // Calculate new score
        const oldScore = session.currentRiskScore;

        const newScore = Math.min(
            oldScore + riskContribution,
            100
        );

        const eventOrder = session.totalEvents + 1;

        // Create event
        const event = await RiskEvent.create({
            userId: req.user.userId,
            sessionId: session._id,
            eventOrder,
            type,
            riskContribution,
            explanation,
            metadata: metadata || {}
        });

        // Update session
        session.currentRiskScore = newScore;
        session.riskLevel = calculateRiskLevel(newScore);
        session.totalEvents = eventOrder;

        await session.save();

        res.status(201).json({
            message: "Risk event added successfully",

            event: {
                id: event._id,
                order: event.eventOrder,
                type: event.type,
                riskContribution: event.riskContribution,
                explanation: event.explanation,
                createdAt: event.createdAt
            },

            riskEvolution: {
                previousScore: oldScore,
                currentScore: newScore,
                riskLevel: session.riskLevel
            }
        });

    } catch (error) {
        console.error("ADD EVENT ERROR:", error);

        res.status(500).json({
            message: "Failed to add risk event",
            error: error.message
        });
    }
};


// Get timeline
const getTimeline = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await ScamSession.findOne({
            _id: sessionId,
            userId: req.user.userId
        });

        if (!session) {
            return res.status(404).json({
                message: "Scam session not found"
            });
        }

        const events = await RiskEvent.find({
            sessionId,
            userId: req.user.userId
        }).sort({ eventOrder: 1 });

        res.json({
            session,
            events
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to get scam timeline",
            error: error.message
        });
    }
};

module.exports = {
    createSession,
    addEvent,
    getTimeline
};