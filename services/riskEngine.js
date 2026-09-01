const calculateRisk = (transaction) => {
    let score = 0;
    const events = [];

    // 1. New recipient
    if (transaction.isNewRecipient) {
        score += 15;

        events.push({
            type: "NEW_RECIPIENT",
            riskContribution: 15,
            explanation: "This is a first-time recipient."
        });
    }

    // 2. Unusual amount
    if (transaction.amount >= 10000) {
        score += 20;

        events.push({
            type: "UNUSUAL_AMOUNT",
            riskContribution: 20,
            explanation: "Transaction amount is unusually high."
        });
    }

    // 3. Suspicious source
    if (transaction.source === "link") {
        score += 20;

        events.push({
            type: "SUSPICIOUS_SOURCE",
            riskContribution: 20,
            explanation: "Payment was initiated through an external link."
        });
    }

    // 4. Gaming + supervised account
    if (
        transaction.category === "gaming" &&
        transaction.isSupervised
    ) {
        score += 20;

        events.push({
            type: "SUPERVISED_GAMING_PAYMENT",
            riskContribution: 20,
            explanation: "Unusual gaming payment from a supervised account."
        });
    }

    // 5. New device
    if (transaction.isNewDevice) {
        score += 15;

        events.push({
            type: "NEW_DEVICE",
            riskContribution: 15,
            explanation: "Payment originated from a new or unfamiliar device."
        });
    }

    // Maximum score
    score = Math.min(score, 100);

    let riskLevel = "LOW";

    if (score >= 70) {
        riskLevel = "HIGH";
    } else if (score >= 40) {
        riskLevel = "MEDIUM";
    }

    return {
        score,
        riskLevel,
        events
    };
};

module.exports = calculateRisk;