const admin = require("../config/firebase");
const { logger } = require("../core");
const Session = require("../models/session_model");

/**
 * Normalize data payload values to strings (FCM requires string values in `data`)
 */
function normalizeDataPayload(dataObj = {}) {
  const out = {};
  Object.keys(dataObj).forEach((k) => {
    const v = dataObj[k];
    out[k] = typeof v === "string" ? v : JSON.stringify(v);
  });
  return out;
}

/**
 * Build common message object used for single-token or multicast messages
 * (for sendMulticast we only need `notification` and `data`).
 */
function buildMessagePayload(data = {}) {
  const payload = {};

  if (data.title || data.body) {
    payload.notification = {
      title: data.title || "",
      body: data.body || "",
    };
  }

  if (data.data && typeof data.data === "object") {
    payload.data = normalizeDataPayload(data.data);
  }

  // Optional platform overrides (for single device send)
  if (data.android) payload.android = data.android;
  else
    payload.android = {
      priority: "high",
      notification: {
        channelId: "default",
        sound: "default",
      },
    };

  if (data.apns) payload.apns = data.apns;
  else
    payload.apns = {
      headers: { "apns-priority": "10" },
      payload: { aps: { sound: "default" } },
    };

  return payload;
}

/**
 * sendToTopic
 * Sends a notification to a topic or a condition (if data.condition is provided).
 * topic: string (without '/topics/' prefix)
 * data: { title, body, data, android, apns, condition }
 */

async function sendToTopic(
  topic,
  { title, body, data, android = null, apns = null, condition = null },
) {
  if (!topic && !condition) {
    throw new Error("sendToTopic: topic or condition is required");
  }

  // Build the payload correctly
  const payload = buildMessagePayload({ title, body, data, android, apns });

  const message = {
    condition: condition || undefined,
    topic: condition ? undefined : topic,
    notification: payload.notification,
    data: payload.data,
    android: payload.android,
    apns: payload.apns,
  };

  try {
    const res = await admin.messaging().send(message);
    logger.info(
      `Notification sent to ${condition ? "condition" : "topic"} (${
        condition || topic
      }): ${res}`,
    );
    return { success: true, response: res };
  } catch (err) {
    logger.error("sendToTopic: error sending message", err);
    throw err;
  }
}

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// SEND NOTIFICATION TO USER
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

async function sendToUserId({ userId, title, body, image, data }) {
  try {
    // 1️⃣ Find all sessions for this user
    const sessions = await Session.find({ userId });

    // 2️⃣ Extract valid (non-null, non-empty) FCM tokens
    const fcmTokens = sessions
      .map((s) => s.fcmToken)
      .filter((token) => token && token.trim() !== "");

    if (fcmTokens.length === 0) {
      return;
    }

    // 3️⃣ Prepare message payload
    const message = {
      notification: {
        title: title || "Notification",
        body: body || "",
        image: image || null,
      },
      data: data || {},
      tokens: fcmTokens,
    };

    // 4️⃣ Send notification to multiple tokens
    const result = await admin.messaging().sendEachForMulticast(message);

    // 5️⃣ Filter failed tokens
    const failedTokens = [];
    result.responses.forEach((resp, idx) => {
      if (!resp.success) {
        failedTokens.push(fcmTokens[idx]);
        logger.error("Failed token:", fcmTokens[idx], resp.error);
      }
    });

    return { result, failedTokens };
  } catch (e) {
    logger.error("[ NOTIFICATION SERVICE ] SEND NOTIFICATION TO USER ", e);
  }
}

module.exports = { sendToTopic, sendToUserId };
