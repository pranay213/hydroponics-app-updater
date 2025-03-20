// logger.js
const { createLogger, format, transports } = require("winston");
const path = require("path");

const getLogger = (filename) => {
    return createLogger({
        level: "info",
        format: format.combine(
            format.timestamp({
                format: "YYYY-MM-DD HH:mm:ss"
            }),
            format.printf(({ timestamp, level, message }) => {
                return `${timestamp} ${level}: ${message}`;
            })
        ),
        transports: [
            new transports.Console(), // Log to the console
            new transports.File({ filename: path.join(__dirname, `${filename}.log`) }) // Log to a file
        ],
    });
};

module.exports = getLogger;
