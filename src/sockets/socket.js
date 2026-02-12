const { setIoInstance } = require("../core/socket");
const redis = require("../core/redis");
const logger = require("../core/logger");
const jwt = require("../core/jwt");

module.exports = function setupSocket(io) {
  setIoInstance(io);

  //----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  //MIDDLEWARE TO AUTHENTICATE USER BEFORE CONNECTING TO SOCKET
  //----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication error: Missing token"));
      const decoded = jwt.verifyAccessToken(token);
      socket.userId = decoded.id;
      next();
    } catch (e) {
      logger.error("SOCKET AUTH FAIELD :", e.message);
      next(new Error("Auhtentication error"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.userId;
    await redis.set(`socket:${userId}`, socket.id); // STORE SOCKET ID OF USER IN REDIS
    await redis.set(`user_status:${userId}`, "online"); // STORE SOCKET ID OF USER IN REDIS

    socket.on("send_message", ({ text, to }) => {
      console.log({ text, to });
    });

    socket.on("disconnect", async () => {
      await redis.del(`socket:${userId}`);
      await redis.del(`user_status:${userId}`);
      logger.info(`${userId} disconnected !`);
    });
  });
};
