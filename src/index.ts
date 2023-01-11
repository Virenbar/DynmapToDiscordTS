import "dotenv/config";
import log4js from "log4js";
import { DtDWebhook } from "./DtDWebhook.js";
//import Export from "./export.js";

const DEBUG = process.env["DEBUG"];
log4js.configure({
    appenders: {
        console: { type: "console", layout: { type: "colored" } },
        fileDebug: { type: "file", filename: "logs/debug.log", maxLogSize: 1024 * 1024 * 10, backups: 5, compress: true },
        fileError: { type: "file", filename: "logs/error.log", maxLogSize: 1024 * 1024 * 10, backups: 5, compress: true },
        infoConsole: { type: "logLevelFilter", appender: "console", level: "info" },
        errorFile: { type: "logLevelFilter", appender: "fileError", level: "error" }
    },
    categories: {
        default: { appenders: ["fileDebug", "errorFile", DEBUG ? "console" : "infoConsole"], level: "debug" }
    }
});

//const e = process.env["EXPORT"] as string;
//await Export.start(e);

const url = process.env["URL"] as string;
const Client = new DtDWebhook(url);

Client.start();
