const { logger, response } = require("../core");
const { User, Session } = require("../models");
const { hash, compare } = require("../services/password.service");
const jwt = require("../core/jwt");
const uuid = require("uuid");
const crypto = require("crypto");

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// SIGN IN WITH EMAIL
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.signIn = async (req, res) => {
  try {
    const { email, password, deviceId, deviceType } = req.body;

    // 🔥 1. Validate missing fields dynamically
    const requiredFields = ["email", "password", "deviceId", "deviceType"];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return response(
        res,
        400,
        `Missing required field(s): ${missingFields.join(", ")}`,
      );
    }

    // 🔥 2. Find user (include password explicitly)
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return response(res, 401, "Invalid Credentials");
    }

    // 🔥 3. Compare password
    const passwordMatch = await compare(password, user.password);

    if (!passwordMatch) {
      return response(res, 401, "Invalid Credentials");
    }

    // 🔥 4. Create session
    const sessionID = uuid.v4();

    const jwtPayload = {
      id: user._id,
      session: sessionID,
      email: user.email,
    };

    const refreshToken = jwt.generateRefreshToken(jwtPayload);
    const accessToken = jwt.generateAccessToken(jwtPayload);

    // 🔐 Hash refresh token before storing
    const hashedRefreshToken = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    // 🔥 5. Set expiry (15 days)
    const refreshExpiry = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    const session = new Session({
      sessionId: sessionID,
      userId: user._id,
      device: {
        id: deviceId,
        type: deviceType,
      },
      refreshToken: {
        token: hashedRefreshToken,
        expiry: refreshExpiry,
      },
    });

    await session.save();

    // 🔥 6. Remove password before sending
    user.password = undefined;

    return response(res, 200, "User Login Successfully !", {
      user,
      accessToken,
      refreshToken,
    });
  } catch (e) {
    logger.error("SIGN IN", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// SIGNUP API
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.signUp = async (req, res) => {
  try {
    const { email, password, deviceId, deviceType } = req.body;

    // 🔥 1. Validate required fields dynamically
    const requiredFields = ["email", "password", "deviceId", "deviceType"];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return response(res, 400, "Validation Error", {
        missingFields,
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 🔥 2. Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return response(res, 409, "Email already registered");
    }

    // 🔥 3. Hash password
    const hashedPassword = await hash(password);

    // 🔥 4. Create user
    const user = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
    });

    // 🔥 5. Create session
    const sessionID = uuid.v4();

    const jwtPayload = {
      id: user._id,
      session: sessionID,
      email: user.email,
    };

    const refreshToken = jwt.generateRefreshToken(jwtPayload);
    const accessToken = jwt.generateAccessToken(jwtPayload);

    const hashedRefreshToken = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const refreshExpiry = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    await Session.create({
      sessionId: sessionID,
      userId: user._id,
      device: {
        id: deviceId,
        type: deviceType,
      },
      refreshToken: {
        token: hashedRefreshToken,
        expiry: refreshExpiry,
      },
    });

    // 🔥 6. Remove password before response
    user.password = undefined;

    return response(res, 201, "User Registered Successfully !", {
      user,
      accessToken,
      refreshToken,
    });
  } catch (e) {
    logger.error("SIGN UP", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// SIGN OUT CURRENT DEVICE
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.signOut = async (req, res) => {
  try {
    const { session } = req.user;

    if (!session) {
      return response(res, 400, "Invalid session");
    }

    const updatedSession = await Session.findOneAndUpdate(
      { sessionId: session, isActive: true },
      {
        isActive: false,
        revokedAt: new Date(),
        fcmToken: null,
      },
    );

    if (!updatedSession) {
      return response(res, 404, "Session not found or already logged out");
    }

    return response(res, 200, "Logged out successfully from this device");
  } catch (e) {
    logger.error("SIGN OUT", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// SIGN OUT FROM ALL DEVICES
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.signOutFromAllDevices = async (req, res) => {
  try {
    const { id } = req.user;

    const result = await Session.updateMany(
      { userId: id, isActive: true },
      {
        isActive: false,
        revokedAt: new Date(),
        fcmToken: null,
      },
    );

    return response(res, 200, "Logged out successfully from all devices", {
      totalSessionsLoggedOut: result.modifiedCount,
    });
  } catch (e) {
    logger.error("SIGN OUT ALL", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// REFRESH TOKEN
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return response(res, 400, "refreshToken is required !");
    }

    // 1️⃣ Verify JWT
    let decoded;
    try {
      decoded = jwt.verifyRefreshToken(refreshToken);
    } catch (err) {
      return response(res, 401, "Invalid or expired refresh token");
    }

    const { id, session } = decoded;

    // 2️⃣ Find session
    const sessionDoc = await Session.findOne({
      sessionId: session,
      userId: id,
      isActive: true,
    }).select("+refreshToken.token");

    if (!sessionDoc) {
      return response(res, 401, "Session not found or expired");
    }

    // 3️⃣ Compare hashed refresh token
    const hashedIncomingToken = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    if (hashedIncomingToken !== sessionDoc.refreshToken.token) {
      return response(res, 401, "Invalid refresh token");
    }

    // 4️⃣ Check expiry validity
    if (sessionDoc.refreshToken.expiry < new Date()) {
      return response(res, 401, "Refresh token expired");
    }

    // 🔥 Generate new access token always
    const jwtPayload = {
      id,
      session,
      email: decoded.email,
    };

    const newAccessToken = jwt.generateAccessToken(jwtPayload);

    let newRefreshToken = refreshToken; // default return same
    let newExpiry = sessionDoc.refreshToken.expiry;

    const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;

    const timeLeft =
      new Date(sessionDoc.refreshToken.expiry).getTime() - Date.now();

    // 5️⃣ Rotate refresh token if less than 2 days remaining
    if (timeLeft < TWO_DAYS) {
      newRefreshToken = jwt.generateRefreshToken(jwtPayload);

      const hashedNewRefreshToken = crypto
        .createHash("sha256")
        .update(newRefreshToken)
        .digest("hex");

      newExpiry = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

      sessionDoc.refreshToken.token = hashedNewRefreshToken;
      sessionDoc.refreshToken.expiry = newExpiry;

      await sessionDoc.save();
    }

    return response(res, 200, "Token refreshed successfully", {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (e) {
    logger.error("REFRESH TOKEN", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// GET CURRENT USER DETAILS
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.getCurrentUser = async (req, res) => {
  try {
    const { id } = req.user;

    if (!id) {
      return response(res, 400, "Invalid user");
    }

    const user = await User.findById(id).select(
      "userName name email bio profilePicture gender dob followersCount followingCount postsCount isVerified accountType createdAt registration",
    );

    if (!user) {
      return response(res, 404, "User not found");
    }

    return response(res, 200, "User details fetched successfully", {
      user,
    });
  } catch (e) {
    logger.error("GET CURRENT USER", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};
