const redis = require("./redis");

const setCache = async (key, value, ttl = 300) => {
  await redis.set(key, JSON.stringify(value), "EX", ttl); // 300s = 5 min
};

const getCache = async (key) => {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
};

const deleteCache = async (key) => {
  await redis.del(key);
};

module.exports = { setCache, getCache, deleteCache };
