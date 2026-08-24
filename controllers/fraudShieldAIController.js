const ai = require("../services/fraudShieldAIService");

async function accountAnalysis(req, res) {
  try {
    const result = await ai.analyzeAccount(req.user.userId);
    res.json(result);
  } catch (error) {
    console.error("FraudShield AI account analysis:", error.message);
    res.status(503).json({ message: "FraudShield AI is unavailable", error: error.message });
  }
}

async function paymentInitialAnalysis(req, res) {
  try {
    const result = await ai.analyzePaymentInitial(req.user.userId, req.body);
    res.json(result);
  } catch (error) {
    console.error("FraudShield AI initial payment analysis:", error.message);
    res.status(503).json({ message: "FraudShield AI initial analysis is unavailable", error: error.message });
  }
}

async function paymentAnalysis(req, res) {
  try {
    const result = await ai.analyzePayment(req.user.userId, req.body);
    res.json(result);
  } catch (error) {
    console.error("FraudShield AI payment analysis:", error.message);
    res.status(503).json({ message: "FraudShield AI is unavailable", error: error.message });
  }
}

async function voiceAnalysis(req, res) {
  try {
    const result = await ai.analyzeVoice(req.body.transcript || "", req.body.language || "en-IN");
    res.json(result);
  } catch (error) {
    console.error("FraudShield AI voice analysis:", error.message);
    res.status(503).json({ message: "FraudShield AI is unavailable", error: error.message });
  }
}

async function messageAnalysis(req, res) {
  try {
    const result = await ai.analyzeMessage(req.body.text || "");
    res.json(result);
  } catch (error) {
    console.error("FraudShield AI message analysis:", error.message);
    res.status(503).json({ message: "FraudShield AI is unavailable", error: error.message });
  }
}

async function health(req, res) {
  try {
    const result = await ai.health();
    res.json(result);
  } catch (error) {
    res.status(503).json({ ok: false, message: "FraudShield AI backend is unavailable" });
  }
}

module.exports = { accountAnalysis, paymentInitialAnalysis, paymentAnalysis, voiceAnalysis, messageAnalysis, health };