import "dotenv/config";
import log4js from "log4js";
import { DtDWebhook } from "./DtDWebhook.js";
//import Export from "./export.js";

//const e = process.env["EXPORT"] as string;
//await Export.start(e);
export type Bot = DtDWebhook

const DEBUG = process.env["DEBUG"];
log4js.configure({
    appenders: {
        console: { type: "console", layout: { type: "colored" } },
        fileInfo: { type: "file", filename: "logs/info.log", maxLogSize: 1024 * 1024 * 10, backups: 5, compress: true },
        fileError: { type: "file", filename: "logs/error.log", maxLogSize: 1024 * 1024 * 10, backups: 5, compress: true },
        info: { type: "logLevelFilter", appender: "fileInfo", level: "info" },
        error: { type: "logLevelFilter", appender: "fileError", level: "error" }
    },
    categories: {
        default: { appenders: ["info", "error", "console"], level: DEBUG ? "debug" : "info" }
    }
});

const url = process.env["URL"] as string;
const Client = new DtDWebhook(url);
Client.start();
