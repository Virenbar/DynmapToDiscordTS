import type { DtDWebhook } from "../DtDWebhook.js";
import DynmapInfo from "./dynmapInfo.js";
import ServerInfo from "./serverInfo.js";

const Services: Service[] = [];

function Initialize(client: DtDWebhook): void {
    Services.push(...[DynmapInfo, ServerInfo]);
    Services.forEach(M => M.Initialize(client));
}

function Start() {
    Services.forEach(M => M.Start());
}

function Reload() {
    Services.forEach(M => M.Reload());
}

export default { Initialize, Start, Reload };

export interface Service {
    Initialize(client: DtDWebhook): void;
    Start(): void;
    Reload(): void;
}
