const ConfigValidator = require("../utils/configValidator");
const logger = require("../utils/logger");
const BotFrameworkAPI = require("../api/botFramework");

/**
 * BotFrameworkMgr manager to operate with bot
 */
class BotFrameworkMgr {
    /**
     * Represents BotFrameworkMgr
     * @constructor
     */
    constructor() {
        this.configurationCheckStatus = ConfigValidator.botFramework.checkConfiguration();

        if (!this.configurationCheckStatus.isError()) {
            this.api = new BotFrameworkAPI();
        } else {
            this.api = null;
        }
    }

    /**
     * Send message to bot framework
     * @param {Object} update Object with dialog data
     * @param {String} message Message to send
     * @return {Promise} Promise with Message response
     */
    sendMessage(update, message) {
        return new Promise((resolve, reject) => {
            if (!this.configurationCheckStatus.isError()) {
                this.api
                    .sendMessage(update, message)
                    .then((message) => {
                        resolve(message);
                    })
                    .catch((error) => {
                        reject(error);
                    });
            } else {
                logger.error(this.configurationCheckStatus.getMessage());
                reject(this.configurationCheckStatus.getMessage());
            }
        });
    }

    /**
     * Send permission to upload file
     * @param {Object} update Object with dialog data
     * @param {csvFile} file Message to send
     * @return {Promise} Promise with Message response
     */
    sendPermissionToUploadFile(update, file, params) {
        return new Promise((resolve, reject) => {
            if (!this.configurationCheckStatus.isError()) {
                this.api
                    .sendPermissionToUploadFile(update, file, params)
                    .then((message) => {
                        resolve(message);
                    })
                    .catch((error) => {
                        reject(error);
                    });
            } else {
                logger.error(this.configurationCheckStatus.getMessage());
                reject(this.configurationCheckStatus.getMessage());
            }
        });
    }
    /**
     * Send file to team via outlook
     * @param {Object} update Object with dialog data
     * @param {csvFile} file Message to send
     * @return {Promise} Promise with Message response
     */
    sendFile(update, file) {
        return new Promise((resolve, reject) => {
            if (!this.configurationCheckStatus.isError()) {
                this.api
                    .sendFile(update, file)
                    .then((message) => {
                        resolve(message);
                    })
                    .catch((error) => {
                        reject(error);
                    });
            } else {
                logger.error(this.configurationCheckStatus.getMessage());
                reject(this.configurationCheckStatus.getMessage());
            }
        });
    }
}

module.exports = new BotFrameworkMgr();