import log4js from "log4js";
import type { DtDWebhook } from "../DtDWebhook.js";
//import Database from "./database.js";
import DynmapInfo from "./dynmapInfo.js";
import ServerInfo from "./serverInfo.js";
export const Logger = log4js.getLogger("Service");
const Services: Service[] = [];
const Tasks: Task[] = [];

function initialize(client: DtDWebhook): void {
    Logger.debug("Initializing");
    Services.push(...[ServerInfo, DynmapInfo]);
    Services.forEach(M => {
        M.initialize(client);
        Logger.debug(`Initialized: ${M.name}`);
    });
    Logger.debug("Initializing done");
    Tasks.push(...[ServerInfo, DynmapInfo]);
}

function reload() {
    Logger.debug("Reloading");
    Services.forEach(M => {
        if (M.reload) {
            M.reload();
            Logger.debug(`Reloaded: ${M.name}`);
        }
    });
    Logger.debug("Reloading done");
}

function start() {
    Logger.debug("Starting");
    Tasks.forEach(T => {
        Logger.debug(`Starting: ${T.name}`);
        T.start();
    });
    Logger.debug("Starting done");
}

export default { initialize, reload, start };
export interface Service {
    name: string
    initialize(client: DtDWebhook): void;
    reload?(): void;
}
export interface Task {
    name: string
    start(): Promise<unknown>
}
export type TaskService = Service & Task
