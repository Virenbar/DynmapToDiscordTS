import log4js from "log4js";
import mysql from "mysql2/promise";
import type { DtDWebhook } from "../DtDWebhook.js";
import type { Task } from "../tasks.js";
import { sleepS } from "./../helpers/index.js";
import type { Service } from "./index.js";

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
function reload() {
    Config = {
        host: process.env["host"] as string,
        user: process.env["user"] as string,
        database: "chat_log"
    };
}

async function SaveToDB() {
    for (const item of Online) {
        await Connection.query("call insertOnline(?,?)", [item.online, item.date]);
    }
    Online.length = 0;
    for (const item of Messages) {
        await Connection.query("call insertMessage(?,?)", [item.player, item.text]);
    }
    Messages.length = 0;
}

function addOnline(online: number, date: Date) {
    Online.push({ online: online, date: date });
}

function addMessage(message: Message) {
    Messages.push(message);
}

function addEvent() {
    Events.push();
}

interface Message {
    player: string
    uuid: string
    text: string
    dimension: string | null
    x: number | null
    y: number | null
    z: number | null
}

interface Online {
    online: number,
    date: Date
}

interface Event {
    player: string
    event: string
}

const name = "Database";
const f: Service & Task = { name, initialize, reload, start };
const Database = { ...f, addMessage, addOnline, addEvent };
export default Database;
