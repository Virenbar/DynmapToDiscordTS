import log4js from "log4js";
import Database from "./services/database.js";
import DynmapInfo from "./services/dynmapInfo.js";
import ServerInfo from "./services/serverInfo.js";

const Logger = log4js.getLogger("Task");

//const Tasks;

function start() {
    Logger.info("Starting");
    ServerInfo.start();
    DynmapInfo.start();
    Database.start();
}

export default { start };

export interface Task {
    name: string
    start(): void;
}
