const jwt = require("../core/jwt");
const response = require("../core/response");
const Session = require("../models/session_model");

const protectRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    // 1️⃣ Check header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return response(res, 401, "Access token missing or malformed");
    }

    const token = authHeader.split(" ")[1];

    // 2️⃣ Verify access token
    const decoded = jwt.verifyAccessToken(token);

    if (!decoded) {
      return response(res, 403, "Invalid or expired access token");
    }

    // 3️⃣ Validate session (IMPORTANT)
    const session = await Session.findOne({
      sessionId: decoded.session,
      isActive: true,
    });

    if (!session) {
      return response(res, 401, "Session expired or logged out");
    }

    req.user = decoded;
    req.session = session;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return response(res, 401, "Access token expired");
    }

    if (error.name === "JsonWebTokenError") {
      return response(res, 401, "Invalid access token");
    }

    console.error("❌ JWT Middleware Error:", error);
    return response(res, 500, "Authorization failed");
  }
};

module.exports = protectRoute;
