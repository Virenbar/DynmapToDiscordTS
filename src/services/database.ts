import log4js from "log4js";
import mysql from "mysql2/promise";
import type { DtDWebhook } from "../DtDWebhook.js";
import { sleepS } from "../helpers/index.js";
import type { Event, Message, Online } from "../models/index.js";
import type { TaskService } from "./index.js";

const Logger = log4js.getLogger("Database");
let Client: DtDWebhook;
let Config: mysql.ConnectionOptions;
let Connection: mysql.Connection;

const Online: Online[] = [];
const Messages: Message[] = [];
const Events: Event[] = [];

function initialize(client: DtDWebhook) {
    Client = client;
}

function reload() {
    Config = {
        host: process.env["host"] as string,
        user: process.env["user"] as string,
        database: "chat_log"
    };
}

async function start() {
    if (!Client.config.dynmap) {
        Logger.warn("Dynmap URL not set. Task disabled");
        return;
    }
    Connection = await mysql.createConnection(Config);
    await Connection.connect();
    Logger.info("Started");

    for (; ;) {
        try {
            SaveToDB();
            await sleepS(30);
        } catch (error) {
            Logger.error(error);
            await sleepS(60);
        }
    }
}

async function SaveToDB() {
    for (const item of Online) {
        await Connection.query("call insertOnline(?,?)", [item.timestamp, item.online]);
    }
    Online.length = 0;
    for (const item of Messages) {
        await Connection.query("call insertMessage(?,?)", [item.user, item.message]);
    }
    Messages.length = 0;
}

function addOnline(timestamp: Date, online: number) {
    Online.push({ timestamp, online });
}

function addMessage(message: Message) {
    Messages.push(message);
}

function addEvent(event: Event) {
    Events.push(event);
}

const name = "Database";
const TS: TaskService = { name, initialize, reload, start };
const Database = { ...TS, SaveToDB, addMessage, addOnline, addEvent } as const;
export default Database;
