const Command = require("./command");
const botFramework = require("../managers/botFramework");
const sandboxesMgr = require("../managers/sandboxes");
const logger = require('../utils/logger');
const dateHelper = require('../utils/dateHelper');
const usersConfig = require("../configurations/users.json");
const fs = require('fs');
const path = require('path');

/**
 * Class for /sbxcreate Teams command
 */
class SBXCreateCommand extends Command {
    /**
     * Represents TeamsGetIdCommand
     * @constructor
     */
    constructor() {
        super(["admin"]);
    }

    process(update, user) {
        const params = update.text.trim().split(' ');
        
        if (checkSBXCreateParams(params)) {
            const validatedParams = getSBXCreateParams(params);
            const sandboxUserId = usersConfig.map((userConfig) => userConfig.email).indexOf(`${validatedParams.userNickname}@valtech.com`);
            
            if (sandboxUserId !== -1) {
                sandboxesMgr
                    .createSandbox(validatedParams.endOfLife)
                    .then((sandbox) => {
                        const sandboxEndOfLife = new Date(sandbox.eol);
                        const sandboxUser = usersConfig[sandboxUserId];
                        updateUserSandbox(sandboxUser, sandbox, validatedParams.country)
                        botFramework.sendMessage(update, `Snadbox was created \n\n ${sandbox.links.bm} \n\n End of life: ${dateHelper.getShortISOString(sandboxEndOfLife)}`)
                    })
                    .catch((error) => {
                        botFramework.sendMessage(update, `${user.getFirstName()}, operation was not executed. Please, contact admin.`);
                        logger.error(error)
                    });
            } else {
                botFramework.sendMessage(update, `${user.getFirstName()}, The user with this email ${validatedParams.userNickname}@valtech.com does not exist.`);
            }
        } else {
            botFramework.sendMessage(update, `${user.getFirstName()}, You entered inccorect params`);
        }
    }

    fail(update, user) {
        botFramework.sendMessage(update, `You haven't got permissions for this command`);
    }
}

/**
 * Verifies if params are correct for /sbxcreate
 * @param {Array} params Array of input parameters
 * @return {Boolean} Verification result
 */
function checkSBXCreateParams(params) {
    const isCorrectUserNickname = typeof params[1] !== 'undefined';
    const isCorrectEndOfLifeParam = typeof params[2] !== 'undefined' && /^-?\d+$/.test(params[2]);
    const isCorrectCountryParam = typeof params[3] !== 'undefined' && typeof params[3] === 'string' && /^[A-Z]+$/.test(params[3]) && params[3].length === 2;
    return isCorrectUserNickname && isCorrectEndOfLifeParam && isCorrectCountryParam;
}

/**
 * Returns parameters for command /sbxcreate
 * @param {Array} params Array of input parameters
 * @return {Object} Parameters
 */
 function getSBXCreateParams(params) {
    const resultObj = {
        userNickname: params[1].toLowerCase(),
        endOfLife: params[2],
        country: params[3].toUpperCase()
    };
    return resultObj;
}

/**
 * Updates the user's sandbox data after executing the command /sbxcreate
 * @param {Object} sandboxUser User object was filtered by nickname 
 * @param {Object} sandboxObj Response object data
 * @param {String} countryCode The country code was inputted by command line 
 */
function updateUserSandbox(sandboxUser, sandboxObj, countryCode) {
    const sandboxName = `${sandboxObj.realm}-${sandboxObj.instance}`; 
    const usersPath = path.join(__dirname, '../configurations/users.json');
    
    if (!sandboxUser.hasOwnProperty('sandbox')) {
        const sandbox = {
            name: sandboxName,
            id: sandboxObj.id,
            sbxCountry: countryCode,
            adminIds: []
        }
        sandboxUser.sandbox = sandbox;
    } else {
        sandboxUser.sandbox.name = sandboxName;
        sandboxUser.sandbox.id = sandboxObj.id;
        sandboxUser.sandbox.sbxCountry = countryCode;

        if (!sandboxUser.sandbox.hasOwnProperty('adminIds')) {
            sandboxUser.sandbox.adminIds = [];
        }
    }
    
    fs.writeFileSync(usersPath, JSON.stringify(usersConfig, null, 2), {encoding: 'utf-8'});
}

module.exports = new SBXCreateCommand();