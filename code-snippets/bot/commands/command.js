/**
 * Abstract class for Bot Commands. Should be used for each Bot Command implementation
 */
class Command {
    /**
     * Represents Command
     * @constructor
     * @param {Array<String>} applicableRoles User Roles that can execute this command
     */
    constructor(applicableRoles) {
        this.applicableRoles = applicableRoles;
    }

    /**
     * Returns Applicable roles for Command
     * @return {Array<String>}
     */
    getApplicableRoles() {
        return this.applicableRoles;
    }

    /**
     * Method executed when User is allowed to execute Command according to his role
     * @param {Object} params Contains command arguments and User who executed command
     */
    process(update, user) {}

    /**
     * Method executed when User is not allowed to execute Command according to his role
     * @param {Object} params Contains command arguments and User who executed command
     */
    fail(update, user) {}
}

module.exports = Command;