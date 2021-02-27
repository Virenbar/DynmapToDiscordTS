import { FetchError } from 'node-fetch'
import { logger } from '..'
import { config } from "../lib/config"
import { get } from './../lib/fetch'
import { fixMD, sleep } from './../utils'
import { sendMessage, MiniEmbed } from './../lib/discord'

let noConFlag = false
let dynmapInfo: DynmapFile
let timestamp = 0 //420000
const dynmapWait = 10 * 1000
const dims = {
    "world": "O",//"🟢",
    "world_nether": "N", //"🔴",
    "world_end": "E",
    "world_oldnether": "~~E~~",
    "test": "🟡"
}
async function getDynmapInfo(): Promise<DynmapFile> {
    const data = await get(config.dynmap)
    const json = JSON.parse(data) as DynmapFile
    return json
}

async function getUUID(name: string): Promise<string> {
    try {
        const data = await get(`https://api.mojang.com/users/profiles/minecraft/${name}`)
        const json = JSON.parse(data)
        return json.id
    } catch (err) {
        logger.warn(`Player not found: ${name}`)
        logger.warn(err)
        return '00000000-0000-0000-0000-000000000000'
    }
}

function getPos(account: string): string {
    const player = dynmapInfo.players.filter((p) => {
        return p.account == account
    })
    if (player.length > 0) {
        const P = player[0]
        const D = dims[P.world] || ""
        return `${D}(${P.x} ${P.y} ${P.z})`
    } else {
        return ""
    }
}

async function CheckDynmap(): Promise<void> {
    try {
        dynmapInfo = await getDynmapInfo()
        const myEmbeds: MiniEmbed[] = []
        for (const event of dynmapInfo.updates) {
            if (event.timestamp > timestamp && event.type != 'tile') {
                if (event.type == 'chat') {
                    const time = new Date(event.timestamp).toISOString()
                    switch (event.source) {
                        case 'player': {
                            const player = event.account.replace(/&./g, '')
                            const account = player.replace(/\[.*?\]/g, '')
                            const uuid = await getUUID(account)
                            myEmbeds.push({
                                //--Steve 00000000-0000-0000-0000-000000000000 Alex ..0001
                                "message": fixMD(event.message),
                                "color": parseInt((event.playerName.match(/"color:#(.+)"/) || ['', 'ffffff'])[1], 16),
                                "footer_icon": `https://crafatar.com/avatars/${uuid}?overlay`,
                                "footer": `${player} ${getPos(account)}`,
                                "timestamp": time
                            })
                            break
                        }
                        case 'plugin':
                            if (event.message.startsWith('[Server]')) {

                                myEmbeds.push({
                                    "message": event.message.substr(8),
                                    "color": 0xFF55FF,
                                    "footer": 'Server',
                                    "timestamp": time
                                })
                            } else if (event.message.startsWith('* ')) {
                                myEmbeds.push({
                                    "message": event.message,
                                    "color": 0xFFFF55,
                                    "footer": '/me',
                                    "timestamp": time
                                })
                            } else if (event.message.match(/впервые вошел/)) {
                                myEmbeds.push({
                                    "message": event.message,
                                    "color": 0xFBA800,
                                    "footer": 'Впервые вошел',
                                    "timestamp": time
                                })
                            } else if (!event.message.match(/вошел|вышел/i)) {
                                myEmbeds.push({
                                    "message": event.message,
                                    "color": 0xFFFF55,
                                    "footer": 'Unknown',
                                    "timestamp": time
                                })
                            }
                            break
                        case 'web':
                            myEmbeds.push({
                                "message": event.message,
                                "color": 0xffffff,
                                "footer": `[Web]${event.playerName}`,
                                "timestamp": time
                            })
                            break
                        default:
                            break
                    }
                }
            }
            if (myEmbeds.length == 10) {
                await sendMessage(myEmbeds)
                myEmbeds.length = 0
            }
        }
        if (myEmbeds.length > 0) {
            await sendMessage(myEmbeds)
        }
        timestamp = dynmapInfo.timestamp
        if (noConFlag) {
            noConFlag = false
            logger.info('Connection to dynmap restored')
        }
    } catch (err) {
        if (/*!noConFlag &&*/ err instanceof FetchError && (err.code == 'ECONNREFUSED' || err.code == 'ETIMEDOUT')) {
            logger.warn('No connection to dynmap.')
            logger.warn(err)
            noConFlag = true
        } else { throw err }

    }
}

async function DynmapLoop() {
    try {
        await CheckDynmap()
        await sleep(dynmapWait)
    } catch (err) {
        logger.error("Dynmap - Unknown error")
        logger.error(err)
        await sleep(60 * 1000)
    } finally {
        DynmapLoop()
    }
}

export default async function (): Promise<void> {
    if (config.dynmap == "") {
        logger.warn('Dynmap URL not set. Module disabled.')
        return
    }
    dynmapInfo = await getDynmapInfo()
    logger.info(`Dynmap file: ${config.dynmap} Timestamp: ${dynmapInfo.timestamp}`)
    DynmapLoop()
}

interface DynmapFile {
    "currentcount": number,
    "hasStorm": boolean,
    "players": [{
        "world": string,
        "armor": number,
        "name": string,
        "x": number,
        "y": number,
        "health": number,
        "z": number,
        "sort": number,
        "type": string,
        "account": string
    }],
    "isThundering": boolean,
    "confighash": number,
    "servertime": number,
    "updates": [
        {
            "type"?: string,
            "name"?: string,
            "source"?: string,
            "playerName"?: string,
            "message"?: string,
            "account"?: string,
            "channel"?: string,
            "timestamp"?: number,

        }],
    "timestamp": number
}