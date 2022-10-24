import "dotenv/config";
import log4js from "log4js";
import { DtDWebhook } from "./DtDWebhook.js";
import Tasks from "./tasks.js";

log4js.configure({
    appenders: {
        debugFile: { type: "file", filename: "logs/debug.log", maxLogSize: 1024 * 1024 * 10, backups: 5, compress: true },
        errorFile: { type: "file", filename: "logs/error.log", maxLogSize: 1024 * 1024 * 10, backups: 5, compress: true },
        console: { type: "console", layout: { type: "colored" } },
        info: { type: "logLevelFilter", appender: "console", level: "info" },
        errors: { type: "logLevelFilter", appender: "errorFile", level: "error" },
    },
    categories: {
        default: { appenders: ["debugFile", "info", "errors"], level: "debug" },
    },
});

const Client = new DtDWebhook(process.env["id"] as string, process.env["token"] as string);

Client.logger.info("Initializing");
Client.initialize();
Client.reload();
Client.SendTitle();
Client.logger.info(`Running as ${Client.id}`);
Tasks.start();
