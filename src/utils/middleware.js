// middleware/loggerMiddleware.js
const getLogger = require("./logger");

const logger = getLogger("requests"); // Create a logger for request logging

const requestLogger = (req, res, next) => {
    // Log the request method, URL, and payload
    logger.info(`Received ${req.method} request to ${req.url} with payload: ${JSON.stringify(req.body)}`);

    // Call the next middleware or route handler
    next();
};

module.exports = requestLogger;
