import log4js from "log4js";
import type { DtDWebhook } from "../DtDWebhook.js";
//import Database from "./database.js";
import DynmapInfo from "./dynmapInfo.js";
import ServerInfo from "./serverInfo.js";
export const Logger = log4js.getLogger("Service");
const Services: Service[] = [];

function initialize(client: DtDWebhook): void {
    Logger.debug("Initializing");
    Services.push(...[ServerInfo, DynmapInfo]);
    Services.forEach(M => {
        M.initialize(client);
        Logger.debug(`Initialized: ${M.name}`);
    });
    Logger.debug("Initializing done");
}

async function reload() {
    Logger.debug("Reloading");
    for (const service of Services) {
        if (service.reload) {
            await service.reload();
            Logger.debug(`Reloaded: ${service.name}`);
        }
    }
    Logger.debug("Reloading done");
}

function start() {
    Logger.debug("Starting");
    for (const service of Services) {
        if (service.start) {
            service.start();
            Logger.debug(`Starting: ${service.name}`);
        }
    }
    Logger.debug("Starting done");
}

export default { initialize, reload, start };

export interface Service {
    name: string
    initialize(client: DtDWebhook): void;
    reload?(): Promise<unknown>;
    start?(): Promise<unknown>
}
