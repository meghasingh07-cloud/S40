const analyzeUrl = (url) => {
    let score = 0;
    const indicators = [];

    const addIndicator = (type, points, explanation) => {
        score += points;

        indicators.push({
            type,
            riskContribution: points,
            explanation
        });
    };

    let parsedUrl;

    try {
        parsedUrl = new URL(url);
    } catch (error) {
        return {
            score: 30,
            indicators: [
                {
                    type: "INVALID_URL",
                    riskContribution: 30,
                    explanation: "The provided URL is not a valid web address."
                }
            ]
        };
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    const pathname = parsedUrl.pathname.toLowerCase();
    const fullUrl = url.toLowerCase();

    // 1. HTTP instead of HTTPS
    if (parsedUrl.protocol !== "https:") {
        addIndicator(
            "INSECURE_PROTOCOL",
            10,
            "The URL does not use HTTPS."
        );
    }

    // 2. Suspicious keywords
    const suspiciousKeywords = [
        "verify",
        "kyc",
        "login",
        "update",
        "secure",
        "account",
        "wallet",
        "payment",
        "refund",
        "bank"
    ];

    const keywordFound = suspiciousKeywords.some(
        (keyword) =>
            hostname.includes(keyword) ||
            pathname.includes(keyword) ||
            fullUrl.includes(keyword)
    );

    if (keywordFound) {
        addIndicator(
            "SUSPICIOUS_KEYWORD",
            10,
            "The URL contains keywords commonly associated with account or payment-related phishing."
        );
    }

    // 3. Suspicious domain patterns
    const suspiciousDomainPatterns = [
        ".xyz",
        ".top",
        ".click",
        ".work",
        ".zip",
        ".tk",
        ".ml",
        ".ga",
        ".cf"
    ];

    if (
        suspiciousDomainPatterns.some((pattern) =>
            hostname.endsWith(pattern)
        )
    ) {
        addIndicator(
            "SUSPICIOUS_DOMAIN",
            15,
            "The domain uses a pattern that may require additional verification."
        );
    }

    // 4. IP address instead of domain
    const ipPattern =
        /^(?:\d{1,3}\.){3}\d{1,3}$/;

    if (ipPattern.test(hostname)) {
        addIndicator(
            "IP_BASED_URL",
            20,
            "The URL uses a raw IP address instead of a recognizable domain."
        );
    }

    // 5. Excessive subdomains
    const parts = hostname.split(".");

    if (parts.length >= 4) {
        addIndicator(
            "EXCESSIVE_SUBDOMAINS",
            10,
            "The URL contains an unusually large number of subdomains."
        );
    }

    score = Math.min(score, 100);

    return {
        score,
        indicators
    };
};

module.exports = analyzeUrl;