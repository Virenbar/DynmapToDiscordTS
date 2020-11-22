import { FetchError } from 'node-fetch'
import { logger } from '..'
import { config } from "../lib/config"
import { get } from './../lib/fetch'
import { sleep } from './../utils'
import { sendMessage, MiniEmbed } from './../lib/discord'

let noConFlag = false
let dynmapInfo: DynmapFile
let timestamp = 0 //420000
const dynmapWait = 10 * 1000

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
        logger.error(`Player not found: ${name}`)
        logger.error(err)
        return '00000000-0000-0000-0000-000000000000'
    }
}

function getPos(name: string): string {
    const player = dynmapInfo.players.filter((p) => {
        return p.account == name
    })
    if (player.length > 0) {
        const P = player[0]
        return `(${P.x} ${P.y} ${P.z})`
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
                    //console.log(event.timestamp)
                    const time = new Date(event.timestamp).toISOString()
                    switch (event.source) {
                        case 'player': {
                            const player = event.account.replace(/[&]./g, '')
                            const uuid = await getUUID(player.replace(/\[.*?\]/g, ''))
                            myEmbeds.push({
                                //"name" = player,
                                //"icon" = 'https://crafatar.com/avatars/'..getUUID(player:gsub('%[.-%]',''))..'?overlay',   --Steve 00000000-0000-0000-0000-000000000000 Alex ..0001
                                "message": event.message,
                                "color": parseInt((event.playerName.match(/"color:#(.+)"/) || ['', 'ffffff'])[1], 16),
                                "footer_icon": `https://crafatar.com/avatars/${uuid}?overlay`,
                                "footer": `${player} ${getPos(event.account)}`,
                                "timestamp": time
                            })
                            break
                        }
                        case 'plugin':
                            if (event.message.startsWith('[Server]')) {
                                //myEmbeds.push(new Embed())
                                myEmbeds.push({
                                    //"name" : 'Server',
                                    //"icon" : serverInfo.favicon,
                                    "message": event.message.substr(8),
                                    "color": 0xFF55FF,
                                    //"footer_icon": '',
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
                                    //"name" : 'Server',
                                    //"icon" : serverInfo.favicon,
                                    "message": event.message,
                                    "color": 0xFFFF55,
                                    //"footer_icon": '',
                                    "footer": 'Unknown',
                                    "timestamp": time
                                })
                            }
                            break
                        case 'web':
                            myEmbeds.push({
                                //"name" : '[Web]'..event.playerName,
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
        if (/*!noConFlag &&*/ err instanceof FetchError && err.code == 'ECONNREFUSED') {
            logger.warn('No connection to dynmap.')
            logger.warn(err)
            noConFlag = true
        } else { throw err }

    }
}

async function DynmapLoop() {
    try {
        CheckDynmap()
        await sleep(dynmapWait)
    } catch (err) {
        logger.error("Unknown error")
        logger.error(err)
        await sleep(60 * 1000)
    } finally {
        DynmapLoop()
    }
}

export default async function (): Promise<void> {
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