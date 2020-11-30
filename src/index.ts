import { configure, getLogger } from "log4js"
import { sendMessage } from './lib/discord'
import loadConfig, { config } from "./lib/config"
import Server from './modules/serverInfo'
import Dynmap from './modules/dynmapInfo'

loadConfig()
configure({
    appenders: {
        file: { type: "file", filename: "logs/debug.log", maxLogSize: 1024 * 1024 * 10, backups: 5, compress: true },
        console: { type: "console", layout: { type: "colored" } },
        "err-filter": { type: 'logLevelFilter', appender: 'console', level: 'error' }
    },
    categories: {
        default: { appenders: ["file", "console"], level: "debug" }
    }
});
export const logger = getLogger('DtD')
const name = 'Dynmap to Discord'
const version = '4.1'

async function Init() {
    logger.info('Starting')
    await sendMessage({
        "title": name,
        "message": `Version: ${version}\nServer: ${config.host}:${config.port}\nDynmap: ${config.dynmap}`,
        "timestamp": new Date().toISOString()
    })
    await Server()
    await Dynmap()
    logger.info('Ready')
}

Init()