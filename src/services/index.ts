import log4js from "log4js";
import type { DtDWebhook } from "../DtDWebhook.js";
import DynmapInfo from "./dynmapInfo.js";
import ServerInfo from "./serverInfo.js";
export const Logger = log4js.getLogger("Service");
const Services: Service[] = [];

function initialize(client: DtDWebhook): void {
    Logger.debug("Initializing");
    Services.push(...[DynmapInfo, ServerInfo]);
    Services.forEach(M => {
        M.initialize(client);
        Logger.debug(`Initialized: ${M.name}`);
    });
    Logger.debug("Initializing done");
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

export default { initialize, reload };
export interface Service {
    name: string
    initialize(client: DtDWebhook): void;
    reload?(): void;
}
