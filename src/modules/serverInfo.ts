import _ from 'lodash'
import { status } from "minecraft-server-util"
import { sleep, fixMD } from './../utils'
import { sendMessage } from './../lib/discord'
import { config } from "../lib/config"
import { logger } from '..'
import { StatusResponse } from 'minecraft-server-util/dist/model/StatusResponse'
//import { FetchError } from 'node-fetch'

let noConFlag = false
let serverInfo: StatusResponse
let playersOnline: Set<string> = new Set<string>()
//var playersHash: string = ''
const listWait = 5 * 1000
const serverWait = 60 * 1000

function Ping(host: string, port: number): Promise<StatusResponse> {
    return status(host, { "port": port })
}
function getServerInfo(): Promise<StatusResponse> {
    return Ping(config.host, config.port)
}
/*
async function getFullServerInfo(): Promise<PingResult> {
    const SI = await Ping({ host: host, port: port })
    const players = new Set<string>()
    return SI
}*/

async function getPlayerList(): Promise<Set<string>> {
    if (!serverInfo.onlinePlayers) { return new Set<string>() }
    const players = new Set<string>(_.map(serverInfo.samplePlayers, 'name'))

    while (serverInfo.onlinePlayers > 12 && players.size < serverInfo.onlinePlayers) {
        serverInfo = await getServerInfo()
        serverInfo.samplePlayers.forEach(player => {
            if (!players.has(player.name)) {
                players.add(player.name)
            }
        })
        await sleep(listWait)
    }
    let arr = Array.from(players)
    arr = _.sortBy<string>(arr, (x) => x.toLowerCase())
    return new Set<string>(arr)
}

async function CheckServer(): Promise<void> {
    try {
        serverInfo = await getServerInfo()
        const playersNewOnline = await getPlayerList()

        /*let playersHashNew = players.join('')
        if (playersHash == playersHashNew) {
            //exit if no changes
            return
        }*/
        if (_.isEqual(playersNewOnline, playersOnline)) {
            return
        }
        //playersHash = playersHashNew
        const playersList = []
        playersNewOnline.forEach(player => {
            if (playersOnline.has(player)) {
                playersOnline.delete(player)
                playersList.push(fixMD(player))
            } else {
                playersList.unshift(`__${fixMD(player)}__`)
            }
        })
        playersOnline.forEach(player => {
            playersList.push(`~~${fixMD(player)}~~`)
        })
        playersOnline = playersNewOnline

        await sendMessage({
            'message': playersList.join(' '),
            'footer': `Список игроков (${playersNewOnline.size})`,
            'timestamp': new Date().toISOString()
        })
        if (noConFlag) {
            noConFlag = false
            logger.info('Connection to server restored')
        }
    } catch (err) {
        if (!(err === undefined) && err.code == 'ECONNREFUSED') {
            logger.warn('No connection to server.')
            logger.warn(err)
            noConFlag = true
        } else { throw err }
    }
}

async function ServerLoop() {
    try {
        await CheckServer()
        const ps = 4 * 60 * 1000 * (serverInfo.onlinePlayers / serverInfo.maxPlayers)
        await sleep(serverWait + ps)
    } catch (err) {
        logger.error('Server - Unknown error')
        logger.error(err)
        await sleep(serverWait * 2)
    } finally {
        ServerLoop()
    }
}

export default async function (): Promise<void> {
    serverInfo = await getServerInfo()
    playersOnline = await getPlayerList()
    logger.info(`Connected to ${serverInfo.description.descriptionText} on ${config.host}:${config.port}`)
    ServerLoop()
}
