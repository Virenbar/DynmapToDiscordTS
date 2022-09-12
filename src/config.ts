import fs from "fs";
import log4js from "log4js";
import path from "path";
import url from "url";
import type { Config } from "./models/index.js";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const Logger = log4js.getLogger("Config");
const file = path.join(__dirname, "../config.json");

let fsw: fs.FSWatcher;
const Config: Config = {
    host: "",
    port: null,
    dynmap: null
};

function loadConfig(watch = false): void {
    const raw = fs.readFileSync(file, "utf8");
    const parsed = JSON.parse(raw) as Config;
    Config.host = parsed.host;
    Config.port = parsed.port;
    Config.dynmap = parsed.dynmap;
    Logger.info("Loaded");
    Logger.debug(Config);
    if (watch) {
        fsw = fs.watch(file);
        fsw.on("change", () => {
            Logger.debug("Reloading config");
            loadConfig();
        });
    }
}

export default { Config, loadConfig };
