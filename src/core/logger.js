const winston = require("winston");

const { combine, timestamp, label, printf, colorize } = winston.format;
const { createLogger } = winston;
const DailyRotateFile = require("winston-daily-rotate-file");

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = createLogger({
  level: "info",
  format: combine(label({ label: process.env.APP }), timestamp(), myFormat),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), myFormat),
    }),
    new DailyRotateFile({
      filename: "logs/application-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m", // 20MB
      maxFiles: "14d", // 14 days
    }),
  ],
});

module.exports = logger;
