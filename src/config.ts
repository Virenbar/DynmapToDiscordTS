import fs from "fs";
import log4js from "log4js";

const Logger = log4js.getLogger("Config");
const file = new URL("../config.json", import.meta.url);

const config: Config = {
    host: "",
    port: null,
    dynmap: null
};

function loadConfig() {
    const raw = fs.readFileSync(file, "utf8");
    const json = JSON.parse(raw) as Config;
    config.host = json.host;
    config.port = json.port;
    config.dynmap = json.dynmap;
    Logger.info("Loaded");
}

export default { config, loadConfig };

export interface Config {
    host: string
    port: number | null
    dynmap: string | null
}
