const morgan = require("morgan");

const morganMiddleware = (logger) => (req, res, next) => {
    // Create a stream object that emits log entries to Winston
    const stream = {
        write: (message) => {
            logger.info(message.trim());
        },
    };

    // Use the stream with Morgan
    morgan("tiny", { stream })(req, res, next);
};

module.exports = morganMiddleware;