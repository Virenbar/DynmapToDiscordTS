import fs from "fs";
import os from "os";
import process, { memoryUsage } from "process";

// Package
const pack = new URL("../../package.json", import.meta.url);
const json = JSON.parse(fs.readFileSync(pack, "utf8"));
const version = json["version"] as string;
const discord = (json["dependencies"]["discord.js"] as string).replace("^", "");
const repository = json["repository"]["url"] as string;
const dependencies = Object.keys(json["dependencies"]).length;
// System
const cpu = os.cpus();
const CPU = `${cpu[0].model} ${cpu.length}x${cpu[0].speed} MHz`;
const OS = `${os.version()}(${os.release()})`;
const nodeVersion = process.version;

function memory() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const process = memoryUsage().heapTotal;
    return {
        total,
        used,
        free,
        process
    };
}
export const meta = {
    version,
    discord,
    repository,
    dependencies,
    nodeVersion,
    CPU,
    OS,
    memory
} as const;
