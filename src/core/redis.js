const { createClient } = require("redis");
const logger = require("./logger");

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 1000), // auto reconnect
  },
});

redisClient.on("connect", () => {
  logger.info("🟢 Redis connected successfully!");
});

redisClient.on("error", (err) => {
  logger.error("🔴 Redis Client Error:", err);
});

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    logger.error("Redis connection failed:", err);
  }
})();

module.exports = redisClient;
