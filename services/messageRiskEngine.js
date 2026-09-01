const analyzeMessage = (message) => {
    const text = message.toLowerCase();

    let riskScore = 0;
    const indicators = [];

    const addIndicator = (type, points, explanation) => {
        riskScore += points;

        indicators.push({
            type,
            riskContribution: points,
            explanation
        });
    };

    // 1. Urgency
    const urgencyWords = [
        "urgent",
        "immediately",
        "now",
        "today",
        "within 24 hours",
        "act now"
    ];

    if (urgencyWords.some((word) => text.includes(word))) {
        addIndicator(
            "URGENCY",
            10,
            "Message uses urgent language to pressure the user into acting quickly."
        );
    }

    // 2. Threat
    const threatWords = [
        "blocked",
        "suspended",
        "account will be closed",
        "legal action",
        "police case",
        "penalty"
    ];

    if (threatWords.some((word) => text.includes(word))) {
        addIndicator(
            "THREAT",
            10,
            "Message contains threatening or fear-based language."
        );
    }

    // 3. Impersonation
    const impersonationWords = [
        "bank",
        "rbi",
        "government",
        "income tax",
        "police",
        "customer care",
        "kyc"
    ];

    if (
        impersonationWords.some((word) => text.includes(word))
    ) {
        addIndicator(
            "IMPERSONATION",
            10,
            "Message may be pretending to represent a financial or government institution."
        );
    }

    // 4. Sensitive information request
    const sensitiveWords = [
        "otp",
        "pin",
        "password",
        "cvv",
        "card number",
        "upi pin"
    ];

    if (
        sensitiveWords.some((word) => text.includes(word))
    ) {
        addIndicator(
            "CREDENTIAL_REQUEST",
            15,
            "Message requests sensitive authentication or financial information."
        );
    }

    // 5. Payment request
    const paymentWords = [
        "send money",
        "transfer",
        "pay",
        "payment",
        "upi",
        "refund fee"
    ];

    if (
        paymentWords.some((word) => text.includes(word))
    ) {
        addIndicator(
            "PAYMENT_REQUEST",
            15,
            "Message asks the user to make a financial transaction."
        );
    }

    // 6. Link detection
    const hasLink = /(https?:\/\/|www\.)/i.test(message);

    if (hasLink) {
        addIndicator(
            "LINK_PRESENT",
            15,
            "Message contains an external link that may require additional verification."
        );
    }

    riskScore = Math.min(riskScore, 100);

    return {
        score: riskScore,
        indicators
    };
};

module.exports = analyzeMessage;