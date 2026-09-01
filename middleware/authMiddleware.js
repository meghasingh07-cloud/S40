const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        console.log("AUTH HEADER:", authHeader);
        console.log("JWT SECRET EXISTS:", !!process.env.JWT_SECRET);

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Not authorized"
            });
        }

        const token = authHeader.split(" ")[1];

        console.log("TOKEN LENGTH:", token.length);

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        console.log("DECODED:", decoded);

        req.user = decoded;
        next();

    } catch (error) {
        console.log("JWT ERROR:", error.name, error.message);

        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};

module.exports = protect;