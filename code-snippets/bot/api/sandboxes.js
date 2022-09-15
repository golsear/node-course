const { URLSearchParams } = require("url");
const fetch = require("node-fetch");
const dateHelper = require("../utils/dateHelper");

/** @constant {String} Sandbox admin panel URL */
const adminUrl = 'https://admin.us03.dx.commercecloud.salesforce.com/api/v1/';
/** @constant {String} User admin panel URL */
const tokenUrl = 'https://account.demandware.com/dwsso/oauth2/access_token';

/**
 * Class containing On Demand Sandboxes API operations
 */
class SandboxesAPI {
    /**
     * Represents SandboxesAPI
     * @constructor
     * @param {Object} config Configuration parameter with credentials
     */
    constructor(config) {
        this.username = config.username;
        this.password = config.password;
        this.clientId = config.clientId;
        this.clientSecret = config.clientSecret;
        this.clientIdOdsua = config.clientIdOdsua;
        this.token = "";
        this.ttl = 0;
    }

    /**
     * Get user Auth token. Renew it in case of expiration
     * @return {Promise} Promise for further API calls
     **/
    getToken() {
        return new Promise((resolve, reject) => {
            //check if token was previously requested and didn't expire
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
            grant_type: 'client_credentials',
            client_id: this.clientId,
            client_secret: this.clientSecret
        });

        const options = {
            method: 'POST',
            body,
            headers: {
                accept: 'application/json',
                'content-type': 'application/x-www-form-urlencoded',
            },
        };

        return fetch(tokenUrl, options).then((res) => {
            return res.json();
        });
    }

    /**
     * Performs sandbox API calls
     * @return {Promise} Promise with call response
     **/
    api(path, options) {
        return this.getToken().then((token) => {
            options = Object.assign({}, options, {
                headers: {
                    authorization: `Bearer ${token}`,
                    "content-type": "application/json",
                },
            });
            return fetch(adminUrl + path, options).then((res) => res.json());
        });
    }

    /**
     * Wrapper for sandbox get status call
     * @param {String} sandboxId Sandbox ID
     * @return {Promise} Promise with call response
     **/
    getStatus(sandboxId) {
        return this.api(`sandboxes/${sandboxId}/`, {
            method: "GET",
        });
    }

    /**
     * Wrapper for sandbox operation call
     * @param {String} operation Operation: stop | start | restart | reset
     * @param {String} sandboxId Sandbox ID
     * @return {Promise} Promise with call response
     **/
    exucuteOperation(operation, sandboxId) {
        return this.api(`sandboxes/${sandboxId}/operations`, {
            method: "POST",
            body: JSON.stringify({ operation }),
        });
    }

    /**
     * Wrapper for getting sandbox list call
     * @return {Promise} Promise with call response
     **/
    getSandboxesList() {
        const params = {include_deleted: true}

        return this.api(`sandboxes?${new URLSearchParams(params)}`, {
            method: "GET",
        });
    }

    /**
     * Wrapper for sandbox getting usage call
     * @param {Date} fromDate required start date of sandbox usage
     * @param {Date} toDate required end date of sandbox usage
     * @param {String} sandboxId Sandbox ID
     * @return {Promise} Promise with call response
     **/
    getSandboxUsage(fromDate, toDate, sandboxId) {
        const params = {
            from: dateHelper.getShortISOString(fromDate),
            to: dateHelper.getShortISOString(toDate)
        }

        return this.api(`sandboxes/${sandboxId}/usage?${new URLSearchParams(params)}`, {
            method: "GET",
        });
    }

    /**
     * Create sandbox
    * @param {String} endOfLife Sandbox end of life 
    * @return {Promise} Promise with call response
     **/
     createSandbox(endOfLife) {
        const body = {
            realm: 'zzky',
            ttl: endOfLife,
            autoScheduled: false,
            resourceProfile: "medium",
            settings: {
                ocapi: [
                    {
                        client_id: this.clientIdOdsua,
                        resources: [
                            {
                                resource_id: '/**',
                                methods: [
                                    'get',
                                    'post',
                                    'put',
                                    'patch',
                                    'delete'
                                ],
                                read_attributes: '(**)',
                                write_attributes: ''
                            }
                        ]
                    }
                ],
                webdav: [
                    {
                        client_id: this.clientIdOdsua,
                        permissions: [
                            {
                                path: '/cartridges',
                                operations: [
                                    'read_write'
                                ]
                            },
                            {
                                path: '/impex',
                                operations: [
                                    'read_write'
                                ]
                            }
                        ]
                    }
                ]
            }
        }

        return this.api('sandboxes', {
            method: "POST",
            body: JSON.stringify(body),
        }); 
    }
}

module.exports = SandboxesAPI;
