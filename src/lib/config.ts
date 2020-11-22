
import fs from "fs"
import path from "path"
import { logger } from "../index"

const file = path.join(__dirname, "../config.json")
let fsw: fs.FSWatcher
export let config: Config

export default function (watch = false): void {
    if (fs.existsSync(file)) {
        Load()
        if (watch) {
            fsw = fs.watch(file)
            fsw.on("change", () => {
                logger.debug("Reloading config")
                Load()
            })
        }
    } else {
        throw new Error("No config found");
    }
}
function Load(): void {
    const raw = fs.readFileSync(file, 'utf8')
    config = JSON.parse(raw)
}

interface Config {
    "host": string,
    "port": number,
    "dynmap": string,
    "webhook": string,
}