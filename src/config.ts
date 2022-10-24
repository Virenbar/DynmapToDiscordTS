import fs from "fs";
import log4js from "log4js";

const Logger = log4js.getLogger("Config");
const file = new URL("../config.json", import.meta.url);

let fsw: fs.FSWatcher;
const Config: Config = {
    host: "",
    port: null,
    dynmap: null
};

function loadConfig(watch = false): void {
    const raw = fs.readFileSync(file, "utf8");
    const json = JSON.parse(raw) as Config;
    Config.host = json.host;
    Config.port = json.port;
    Config.dynmap = json.dynmap;
    Logger.info("Loaded");
    if (watch) {
        fsw = fs.watch(file);
        fsw.on("change", () => {
            Logger.debug("Reloading config");
            loadConfig();
        });
    }
}

export default { Config, loadConfig };

export interface Config {
    "host": string,
    "port": number | null,
    "dynmap": string | null
}
