const {
    URLSearchParams
} = require('url');
const fetch = require('node-fetch');
const credentials = require('../configurations/credentials.json');
const dateHelper = require('../utils/dateHelper');
const tokenUrl = 'https://login.microsoftonline.com/botframework.com/oauth2/v2.0/token';

/**
 * Class containing Bot Framework API operations
 */
class BotFrameworkAPI {
    /**
     * Represents BotFrameworkAPI
     * @constructor
     */
    constructor() {
        this.clientId = credentials.microsoft.MicrosoftAppId;
        this.clientSecret = credentials.microsoft.MicrosoftAppPassword;
        this.token = '';
        this.ttl = 0;
    }

    /**
     * Get user Auth token. Renew it in case of expiration
     * @return {Promise} Promise for further API calls
     **/
    getToken() {
        return new Promise((resolve, reject) => {
            // check if token was previously requested and didn't expire
            if (this.token && !this.isTokenExpired()) {
                resolve(this.token);
            } else {
                this.auth().then((res) => {
                    this.token = res.access_token;
                    this.ttl = Math.floor(Date.now() / 1000) + res.expires_in;

                    resolve(this.token);
                });
            }
        });
    }

    /**
     * Checks if token is still valid
     * @return {Boolean} is token expired
     */
    isTokenExpired() {
        return this.ttl - Math.floor(Date.now() / 1000) <= 3;
    }

    /**
     * Performs call to Auth server (User) to get token
     * @return {Promise} Promise with call response
     **/
    auth() {
        const body = new URLSearchParams({
            grant_type: "client_credentials",
            client_id: this.clientId,
            client_secret: this.clientSecret,
            scope: 'https://api.botframework.com/.default'
        });

        const options = {
            method: "POST",
            body,
            headers: {
                host: 'login.microsoftonline.com',
                "content-type": "application/x-www-form-urlencoded",
            },
        };
        return fetch(tokenUrl, options).then((res) => res.json());
    }

    /**
     * Performs message API call
     * @param {Object} params user and dialog object
     * @param {String} message Message to send
     * @return {Promise} Promise with Message response
     */
    sendMessage(params, message) {
        return this.getToken().then((token) => {
            if (params.conversation && message) {
                const botFrameworkUrl = `${params.serviceUrl}v3/conversations/${encodeURIComponent(params.conversation.id)}/activities`;

                params.type = 'message';
                params.text = message;
                params.textFormat = 'markdown'
                                
                delete params.attachments

                const body = JSON.stringify(params);
                const options = {
                    method: "POST",
                    body,
                    headers: {
                        Authorization: 'Bearer ' + token,
                        "Content-Type": 'application/json'
                    }
                };
                return fetch(botFrameworkUrl, options).then((res) => res.json());
            } else {
                return Promise.reject('Message can\'t be sent');
            }
        });
    }

    /**
     * Performs API call to teams to perform uploading file to Outlook
     * @param {Object} update user and dialog object
     * @param {csvFile} file Message to send
     * @return {Promise} Promise with Message response
     */
    sendPermissionToUploadFile(update, file, params) {
        return this.getToken().then((token) => {
            if (update.conversation) {
                const botFrameworkUrl = `${update.serviceUrl}v3/conversations/${encodeURIComponent(update.conversation.id)}/activities`;
                const countrySuf = params.counry ? ` (${params.counry})` : '';
                const fileName = `sandboxes-usage ${dateHelper.getShortISOString(params.startDate)} ${dateHelper.getShortISOString(params.endDate)}${countrySuf}.csv`;

                delete update.text;
                update.attachments = [{
                    contentType: "application/vnd.microsoft.teams.card.file.consent",
                    name: fileName,
                    content: {
                        description: "",
                        sizeInBytes: file.getSize(),
                        acceptContext: {
                            fileName: file.getName()
                        },
                        declineContext: {
                            fileName: file.getName()
                        }
                    }
                }];

                const body = JSON.stringify(update);
                const options = {
                    method: "POST",
                    body,
                    headers: {
                        Authorization: 'Bearer ' + token,
                        "Content-Type": 'application/json'
                    }
                };
                return fetch(botFrameworkUrl, options).then((res) => res.json());
            } else {
                return Promise.reject('Request can\'t be sent');
            }
        });
    }

    /**
     * Performs notification API call to teams about success uploading file and uploads file to outlook
     * @param {Object} params u`ser and dialog object
     * @param {csvFile} file Message to send
     * @return {Promise} Promise with Message response
     */
    sendFile(params, file) {
        return this.getToken().then((token) => {
            return uploadFileToOutlook(params, file).then((isAccepted) => {
                if (isAccepted) {
                    const botFrameworkUrl = `${params.serviceUrl}v3/conversations/${encodeURIComponent(params.conversation.id)}/activities`;
                    const uploadInfo = params.value.uploadInfo;

                    params.type = "message"
                    delete params.text;

                    params.attachments = [{
                        contentType: "application/vnd.microsoft.teams.card.file.info",
                        contentUrl: uploadInfo.contentUrl,
                        name: uploadInfo.name,
                        content: {
                            uniqueId: uploadInfo.uniqueId,
                            fileType: uploadInfo.fileType,
                        }
                    }];

                    const body = JSON.stringify(params);
                    const options = {
                        method: "POST",
                        body,
                        headers: {
                            Authorization: 'Bearer ' + token,
                            "Content-Type": 'application/json'
                        }
                    };
                    return fetch(botFrameworkUrl, options).then((res) => res.json());
                } else {
                    return Promise.reject('File wasn\'t accepted');
                }
            });
        });
    }
}

/**
 * Performs PUT API call to Outlook to send file
 * @param {Object} params user and dialog object
 * @param {csvFile} file Message to send
 * @return {Promise} Promise with Message response
 */
function uploadFileToOutlook(params, file) {
    const uploadURL = params.value.uploadInfo.uploadUrl;
    buffer = file.getBuffer();
    const options = {
        method: "PUT",
        body: buffer,
        headers: {
            "Content-Type": "application/octet-stream",
            "Content-Range": `bytes 0-${buffer.byteLength - 1}/${buffer.byteLength}`
        }
    };
    return fetch(uploadURL, options).then((res) => res.ok);
}


module.exports = BotFrameworkAPI;