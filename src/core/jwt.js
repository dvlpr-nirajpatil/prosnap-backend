const jwt = require("jsonwebtoken");

module.exports.generateRefreshToken = (payload) => {
  try {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "7d",
    });
  } catch (e) {
    throw e;
  }
};

module.exports.generateAccessToken = (payload) => {
  try {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "1d",
    });
  } catch (e) {
    throw e;
  }
};

module.exports.verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (e) {
    throw e;
  }
};

module.exports.verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch (e) {
    throw e;
  }
};
