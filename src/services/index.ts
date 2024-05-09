import log4js from "log4js";
import type { Bot } from "../index.js";
import DynmapInfo from "./dynmapInfo.js";
import ServerInfo from "./serverInfo.js";
export const Logger = log4js.getLogger("Service");
const Services: Service[] = [];

function initialize(client: Bot): void {
    Logger.debug("Initializing");
    Services.push(...[ServerInfo, DynmapInfo]);
    Services.forEach(S => {
        S.initialize(client);
        Logger.debug(`Initialized: ${S.name}`);
    });
    Logger.debug("Initializing done");
}

function reload() {
    Logger.debug("Reloading");
    Services.forEach(S => {
        if (S.reload) {
            S.reload();
            Logger.debug(`Reloaded: ${S.name}`);
        }
    });
    Logger.debug("Reloading done");
}

function start() {
    Logger.debug("Starting");
    Services.forEach(S => {
        if (S.start) {
            S.start();
            Logger.debug(`Started: ${S.name}`);
        }
    });
    Logger.debug("Starting done");
}

export default { initialize, reload, start };

export interface Service {
    name: string
    initialize(client: Bot): void;
    reload?(): Promise<unknown>;
    start?(): Promise<unknown>
}
