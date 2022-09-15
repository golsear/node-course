const SandboxesAPI = require("../api/sandboxes");
const ConfigValidator = require("../utils/configValidator");
const usersMgr = require("../managers/users");
const credentials = require("../configurations/credentials.json");
const logger = require("../utils/logger");
const emptyUsageObj = {
    minutesUp: 0,
    minutesDown: 0
}

/**
 * SandboxMgr manager to operate with on-demand sandboxes
 */
class SandboxesMgr {
    /**
     * Represents SandboxesMgr
     * @constructor
     */
    constructor() {
        this.checkConfigurationStatus = ConfigValidator.sandboxes.checkConfiguration();

        if (!this.checkConfigurationStatus.isError()) {
            this.api = new SandboxesAPI({
                username: credentials.sandboxes.username,
                password: credentials.sandboxes.password,
                clientId: credentials.sandboxes.clientId,
                clientSecret: credentials.sandboxes.clientSecret,
                clientIdOdsua: credentials.sandboxes.clientIdOdsua
            });
        } else {
            this.api = null;
        }
    }

    /**
     * Wrapper for sandbox operation
     * @param {String} operation Operation: stop | start | restart | reset
     * @param {Sandbox} sandbox Sandbox execute operation on
     * @return {Promise} Promise containing operation result
     **/
    async executeOperation(operation, sandbox) {
        if (!this.checkConfigurationStatus.isError()) {
            switch (operation) {
                case "status":
                    return this.api.getStatus(sandbox.getId());
                default:
                    return this.api.exucuteOperation(operation, sandbox.getId());
            }
        } else {
            return Promise.reject(this.checkConfigurationStatus.getMessage());
        }
    }

    /**
     * Wrapper for sandbox bulk operation
     * @param {String} operation Operation: stop | start | restart | reset
     * @param {Array<Sandbox>} sandboxes Sandboxes execute operation on
     * @return {Promise} Promise containing execution status
     **/
    async executeOperationBulk(operation, sandboxes) {
        return new Promise((resolve, reject) => {
            if (!this.checkConfigurationStatus.isError()) {
                sandboxes.forEach((sandbox) => {
                    this.executeOperation(operation, sandbox);
                });

                resolve(`Bulk operation ${operation} executed`);
            } else {
                reject(this.checkConfigurationStatus.getMessage());
            }
        });
    }

    /**
     * Gets used (configed) sandboxes by admin
     * @param {String} adminId Admin id (Teams id)
     * @return {Array<Sandbox>} Array of sandboxes
     **/
    getUsedSandboxesByAdminId(adminId) {
        const sandboxes = [];
        usersMgr.getUsers().forEach((user) => {
            const sandbox = user.getSandbox();
            if (sandbox.isInited() && sandbox.hasAdmin(adminId)) {
                sandboxes.push(sandbox);
            }
        });
        return sandboxes;
    }

    /**
     * Gets sandboxes usage by data and country
     * @param {Date} startDate Start date of usage sandboxes
     * @param {Date} endDate End date of usage sandboxes
     * @param {String} country Country code for getting sanboxes
     * @return {Promise} Promise containing sandboxes usage object
     **/
    getSandboxesUsage(startDate, endDate, country) {
        return new Promise((resolve, reject) => {
            this.getWorkingSandboxesByDates(startDate, endDate)
            .then((sandboxes) => {
                return this.getRelevantSandboxesUsage(sandboxes, startDate, endDate, country);
            }).then((sandboxUsage) => {
                if (!country) {
                    usersMgr.getAllCountries().forEach(userCountry => {
                        sandboxUsage[userCountry] = sandboxUsage[userCountry] || emptyUsageObj;
                    });
                } else {
                    sandboxUsage[country] = sandboxUsage[country] || emptyUsageObj;
                }
                resolve(sandboxUsage);
            }).catch((error) => {
                logger.error(error);
                reject(error);
            });
        });
    }

    /**
     * Gets sandboxes which was working from <StartDate> to <EndDate>
     * @param {Date} startDate Start date of usage sandboxes
     * @param {Date} endDate End date of usage sandboxes
     * @return {Promise} Promise containing array of sandboxes
     **/
    getWorkingSandboxesByDates(startDate, endDate) {
        return new Promise((resolve, reject) => {
            const deleteFinishDate = new Date(endDate.getTime());
            deleteFinishDate.setDate(endDate.getDate() + 1);

            this.api.getSandboxesList().then((res) => {
                let filteredSanboxList = [];
                if (res.data && res.data.length !== 0) {
                    filteredSanboxList = res.data.filter((sandbox) => {
                        return (sandbox.createdAt && new Date(sandbox.createdAt) < deleteFinishDate) &&
                            (!sandbox.deletedAt || new Date(sandbox.deletedAt) > startDate);
                    });
                }
                resolve(filteredSanboxList);
            }).catch((error) => {
                logger.error(error);
                reject(error);
            });
        });
    }

    /**
     * Gets actual sandboxes usage by data and country without post filling
     * @param {Array} sandboxes all sandboxes
     * @param {Date} startDate Start date of usage sandboxes
     * @param {Date} endDate End date of usage sandboxes
     * @param {String} country Country code for getting sanboxes
     * @return {Promise} Promise containing sandboxes usage object
     **/
    async getRelevantSandboxesUsage(sandboxes, startDate, endDate, country) {
        const sandboxesUsage = {};
        const adminCountriesObj = usersMgr.getAdminCountriesObj();

        for (const sandbox of sandboxes) {
            if (sandbox.id && sandbox.createdBy) {
                const adminCountry = adminCountriesObj[sandbox.createdBy] || 'Other';

                if (!country || adminCountry === country) {
                    sandboxesUsage[adminCountry] = sandboxesUsage[adminCountry] || Object.assign({}, emptyUsageObj);
                    sandboxesUsage[adminCountry]['sandboxes'] = sandboxesUsage[adminCountry]['sandboxes'] || [];
                    await this.getSandboxUsage(startDate, endDate, sandbox.id).then((sandboxUsage) => {
                        sandboxesUsage[adminCountry]['minutesUp'] += sandboxUsage.minutesUp;
                        sandboxesUsage[adminCountry]['minutesDown'] += sandboxUsage.minutesDown;
                        const sandboxOwner = `${sandbox.realm}-${sandbox.instance}/${sandbox.createdBy}`
                        sandboxesUsage[adminCountry]['sandboxes'].indexOf(sandboxOwner) === -1 && sandboxesUsage[adminCountry]['sandboxes'].push(sandboxOwner);
                    }).catch((error) => {
                        logger.error(error);
                    });
                }
            }
        }
        return sandboxesUsage;
    }

    /**
     * Gets actual sandboxe usage by data
     * @param {Date} startDate Start date of usage sandboxes
     * @param {Date} endDate End date of usage sandboxes
     * @param {String} sandboxId Sandbox id
     * @return {Promise} Promise containing sandbox usage object
     **/
    getSandboxUsage(startDate, endDate, sandboxId) {
        return new Promise((resolve, reject) => {
            const sandboxUsage = {
                minutesUp: 0,
                minutesDown: 0
            }
            this.api.getSandboxUsage(startDate, endDate, sandboxId).then((usageObj) => {
                if (usageObj.code === 200 && usageObj.status === 'Success' && usageObj.data) {
                    sandboxUsage.minutesUp = +usageObj.data.minutesUp;
                    sandboxUsage.minutesDown = +usageObj.data.minutesDown;
                    resolve(sandboxUsage)
                } else {
                    logger.error(usageObj);
                    reject(error)
                }
            }).catch((error) => {
                logger.error(error)
                reject(error)
            });
        });
    }

    /**
     * Create sandbox
     * @param {String} endOfLife Sandbox end of life 
     * @return {Promise} Promise containing sandbox usage object
     **/
     createSandbox(endOfLife) {
        return new Promise((resolve, reject) => {
            this.api.createSandbox(endOfLife).then((sandboxObj) => {
                if (sandboxObj.code === 201 && sandboxObj.data && sandboxObj.status === "Success") {
                    resolve(sandboxObj.data)
                } else {
                    logger.error(sandboxObj.error.message);
                    reject(sandboxObj.error.message)
                }
            }).catch((error) => {
                logger.error(error)
                reject(error)
            });
        });
    }
}

module.exports = new SandboxesMgr();