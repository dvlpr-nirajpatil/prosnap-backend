const mongoose = require("mongoose");
const logger = require("../core/logger");

const db = process.env.ENVIRONMENT;

const connectionUrl =
  process.env.ENVIRONMENT == "DEV"
    ? process.env.DEV_DB_URL
    : process.env.DB_URL;

const connectDB = async () => {
  try {
    await mongoose.connect(connectionUrl);

    logger.info(`🟢 ${db} connected successfully.`);
  } catch (error) {
    logger.error("🔴 MongoDB connection error:", error);
    process.exit(1); // Exit if DB connection fails
  }
};

mongoose.set("autoIndex", false);

module.exports = connectDB;
