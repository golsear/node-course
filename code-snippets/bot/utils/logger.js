const preferences = require("../configurations/preferences.json");

/** @constant {Object} Application Log Levels */
const logLevels = {
    ERROR: 1,
    WARN: 2,
    INFO: 3,
    DEBUG: 4,
    TRACE: 5
};
/** @constant {Object} Used to get text and color for console output for specific Log Level */
const logLevelMap = {
    "1": {
        text: "ERROR",
        color: "\u001b[31m%s\u001b[0m",
    },
    "2": {
        text: "WARN",
        color: "\u001b[35m%s\u001b[0m",
    },
    "3": {
        text: "INFO",
        color: "\u001b[34m%s\u001b[0m",
    },
    "4": {
        text: "DEBUG",
        color: "\u001b[36m%s\u001b[0m",
    },
    "5": {
        text: "TRACE",
        color: "\u001b[37m%s\u001b[0m",
    }
};

/**
 * Class useful for developing and logging
 */
class Logger {
    /**
     * Represents Logger
     * @constructor
     */
    constructor() {
        this.loggingEnabled = preferences.logging.loggingEnabled;
        this.logLevel = logLevels[preferences.logging.logLevel.toUpperCase()];
    }

    /**
     * Method to log Error Message
     * @param {String} msg Message to log
     */
    error(msg) {
        this.log(1, msg);
    }

    /**
     * Method to log Warning Message
     * @param {String} msg Message to log
     */
    warn(msg) {
        this.log(2, msg);
    }

    /**
     * Method to log Info Message
     * @param {String} msg Message to log
     */
    info(msg) {
        this.log(3, msg);
    }

    /**
     * Method to log Debug Message
     * @param {String} msg Message to log
     */
    debug(msg) {
        this.log(4, msg);
    }

    /**
     * Method to log Trace Message
     * @param {String} msg Message to log
     */
    trace(msg) {
        this.log(5, msg);
    }

    /**
     * Internal method to log message into console
     * @param {Number} level Log Level of the message
     * @param {String} msg Message to log
     */
    log(level, msg) {
        if (this.loggingEnabled && this.logLevel >= level) {
            console.log(logLevelMap[level].color, `[${new Date().toLocaleString()}] [${logLevelMap[level].text}] : ${msg}`);
        }
    }
}

module.exports = new Logger();