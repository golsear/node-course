const dotenv = require('dotenv');
const path = require('path');
const express = require("express");
const app = express();
const commandsMgr = require("./managers/commands");
const botFramework = require("./managers/botFramework");
const credentials = require("./configurations/credentials.json");
const logger = require("./utils/logger");

app.use(express.json());
const ENV_FILE = path.join(__dirname, '.env');

dotenv.config({path: ENV_FILE});
const port = process.env.port || process.env.PORT || 3978;

app.listen(port, () => {
    logger.info('Server is started! Port: ' + port);
});

app.post('/api/messages', (req, res) => {
    const update = req.body;
    if (update.conversation && isAllowedCommunicateWithBot(update)) {
        switch (update.type) {
            case 'message':
                commandsMgr.processCommand(update);
                break;
            case 'invoke':
                commandsMgr.processInvokeFile(update);
                break;
            default:
                logger.info('Command is not supported ' + update.type);
        }

        res.json({
            result: "success",
        });
    } else {
        logger.error(`Incorect request, Service: ${update.serviceUrl}`);
        res.json({
            result: "error",
        });
    }
});

function isAllowedCommunicateWithBot(update) {
    return update.conversation.tenantId === credentials.teams.tenantId;
}