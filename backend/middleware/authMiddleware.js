const jwt = require("jsonwebtoken");
const { hasActiveSubscription } = require("../modules/admin/clientSubscriptions/clientSubscriptions.model");

module.exports = async function (req, res, next) {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return res.status(400).json({
            message: "no headers",
        });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(400).json({
            message: "no token",
        });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!(await hasActiveSubscription(decoded.client_id || decoded.id))) {
            return res.status(403).json({
                message: "Your subscription has expired. Please contact support to renew your plan.",
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Invalid or expired token", error: error.message });
        }

        console.error("Authentication check failed:", error);
        return res.status(500).json({ message: "Authentication check failed" });
    }
};