import log4js from "log4js";
import mysql from "mysql2/promise";
import type { DtDWebhook } from "../DtDWebhook.js";
import type { Task } from "../tasks.js";
import { sleep } from "./../helpers/index.js";
import type { Service } from "./index.js";

const Logger = log4js.getLogger("Database");
let Client: DtDWebhook;
let Config: mysql.ConnectionOptions;
let Connection: mysql.Connection;

const Online: Online[] = [];
const Messages: Message[] = [];

function initialize(client: DtDWebhook) {
    Client = client;
}

async function start() {
    reload();
    if (!Client.config.dynmap) {
        Logger.warn("Dynmap URL not set. Service disabled");
        return;
    }
    Connection = await mysql.createConnection(Config);
    await Connection.connect();
    Logger.info("Started");

    const serverWait = 30 * 1000;
    for (; ;) {
        try {
            SaveToDB();
            await sleep(serverWait);
        } catch (error) {
            Logger.error(error);
            await sleep(serverWait * 2);
        }
    }
}
function reload() {
    Config = {
        host: process.env["host"] as string,
        user: process.env["user"] as string,
        database: "chat_log"
    };
    Logger.info("Reloaded");
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

export function AddOnline(online: number, date: Date) {
    Online.push({ online: online, date: date });
}

export function AddMessage(message: Message) {
    Messages.push(message);
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
const name = "Database";
const Database: Service & Task = { name, initialize, reload, start };
export default Database;
