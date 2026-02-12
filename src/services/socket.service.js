const logger = require("../core/logger");
const redis = require("../core/redis");

module.exports.sendToUser = async ({ userId, event, data }) => {
  try {
    console.log(`SENDING EVENT ${event}`);
    const socketId = await redis.get(`socket:${userId}`);
    if (!socketId) return;
    const io = require("../core/socket").getIoIntance();
    await io.to(socketId).emit(event, data);
  } catch (e) {
    logger.error("SEND TO USER ", e);
  }
};
