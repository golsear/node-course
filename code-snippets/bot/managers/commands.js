const usersMgr = require("../managers/users");

/**
 * CommandsMgr manager to process Teams Commands
 */
class CommandsMgr {
    /**
     * Checks if User is allowed to execute received Teams Command and processes or fails it
     * @param {Object} update Message received from Teams
     */
    processCommand(update) {
        const commandName = update.text.trim().split(' ')[0];
        const user = usersMgr.getUser(update.from.id);
        let command = null;

        try {
            command = require(`../commands${commandName}`);
        } catch (ex) {
            command = require(`../commands/dummy`);
        }
        if (isUserIsAllowedToExecuteCommand(user, command)) {
            command.process(update, user);
        } else {
            command.fail(update, user);
        }
    }

    /**
     * processes or fails invokes
     * @param {Object} update dialog and user data
     */
    processInvokeFile(update) {
        const user = usersMgr.getUser(update.from.id);
        let invoke = null;

        try {
            invoke = require(`../invokes/${update.value.action}`);
        } catch (ex) {
            invoke = require(`../invokes/dummy`);
        }

        if (isUserIsAllowedToExecuteCommand(user, invoke)) {
            invoke.process(update, user);
        } else {
            invoke.fail(update, user);
        }
    }
}

/**
 * Checks if user allowed to execute command
 * @param {User} user User that called command
 * @param {Command} command command to execute
 * @return {Boolean}
 */
function isUserIsAllowedToExecuteCommand(user, command) {
    const commandApplicableRoles = command.getApplicableRoles();

    if (commandApplicableRoles.indexOf("any") !== -1) {
        return true;
    }

    for (const role of user.getRoles()) {
        if (commandApplicableRoles.indexOf(role) !== -1) {
            return true;
        }
    }

    return false;
}

module.exports = new CommandsMgr();