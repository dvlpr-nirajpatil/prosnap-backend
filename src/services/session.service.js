const Session = require("../models/session_model");

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// HELPER FUNCTION → Generate expiry date (next 15 days)
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

const getNext15Days = () => {
  const now = new Date();
  now.setDate(now.getDate() + 15);
  return now;
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// CREATE SESSION
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.createSession = async ({
  sessionId,
  userId,
  deviceId,
  deviceType,
  refreshToken,
}) => {
  try {
    const session = new Session({
      sessionId,
      userId,
      device: { id: deviceId, type: deviceType },
      refreshToken: {
        token: refreshToken,
        expiry: getNext15Days(), // ✅ Corrected: next 15 days expiry
      },
    });

    await session.save();
    return session; // ✅ Return created session for further use if needed
  } catch (e) {
    console.error("CREATE SESSION ERROR:", e);
    throw e; // ✅ Corrected: `rethrow` is invalid JS
  }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// DELETE SESSION
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.deleteSession = async ({ sessionId, refreshToken }) => {
  try {
    if (sessionId) {
      await Session.findOneAndDelete({ sessionId });
    } else {
      await Session.findOneAndDelete({ "refreshToken.token": refreshToken });
    }
    return true;
  } catch (e) {
    console.error("DELETE SESSION ERROR:", e);
    throw e;
  }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// STORE FCM TOKEN
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.storeFcmToken = async ({ sessionId, fcmToken }) => {
  try {
    await Session.findOneAndUpdate(
      { sessionId },
      { fcmToken },
      { new: true } // ✅ Ensures you get updated document
    );
    return true;
  } catch (e) {
    console.error("STORE FCM TOKEN ERROR:", e);
    throw e;
  }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// UPDATE REFRESH TOKEN
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.updateRefreshToken = async ({ sessionId, refreshToken }) => {
  try {
    await Session.findOneAndUpdate(
      { sessionId },
      {
        refreshToken: {
          token: refreshToken,
          expiry: getNext15Days(),
        },
      },
      { new: true }
    );
    return true;
  } catch (e) {
    console.error("UPDATE REFRESH TOKEN ERROR:", e);
    throw e;
  }
};
