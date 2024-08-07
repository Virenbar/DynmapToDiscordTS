import { EmbedBuilder } from "discord.js";
import _ from "lodash";
import log4js from "log4js";
import { JavaStatusResponse, status } from "minecraft-server-util";
import { Bot } from "../index.js";
import { FetchError, fixMD, sleep, sleepS } from "./../helpers/index.js";
import type { Service } from "./index.js";

const Logger = log4js.getLogger("Server Info");
let Client: Bot;
let Server: { host: string, port: number | undefined };

let lostConnection = false;
let serverInfo: JavaStatusResponse;
let playersOnline: Set<string> = new Set<string>();

function initialize(client: Bot) {
    Client = client;
}

async function reload() {
    Server = {
        host: Client.config.host,
        port: Client.config.port ?? undefined
    };
}

async function start() {
    await refreshInfo();
    playersOnline = await getPlayerList();
    Logger.info(`Connected to ${await srvRecord()}`);

    for (; ;) {
        try {
            await CheckServer();
            const ps = 4 * 60 * (serverInfo.players.online / serverInfo.players.max);
            await sleepS(60 + ps);
        } catch (error) {
            Logger.error(error);
            await sleepS(120);
        }
    }
}

async function refreshInfo() {
    serverInfo = await status(Server.host, Server.port);
}

async function srvRecord() {
    await refreshInfo();
    return `${serverInfo.srvRecord?.host}:${serverInfo.srvRecord?.port}`;
}

function playersSample(): string[] {
    if (serverInfo.players.sample == null) {
        return [];
    }
    const players = serverInfo.players.sample.map(p => p.name);
    let anonymous = 1;
    return players.map(name => name == "Anonymous Player" ? `Anonymous#${anonymous++}` : name);
}

async function getPlayerList(): Promise<Set<string>> {
    if (serverInfo.players.online == 0 || serverInfo.players.sample == null) {
        return new Set<string>();
    }

    const Players = new Set<string>(playersSample());
    while (Players.size < serverInfo.players.online) {
        await refreshInfo();
        playersSample().forEach(name => {
            if (!Players.has(name)) {
                Players.add(name);
            }
        });
        await sleep(5 * 1000);
    }
    return Players;
}

async function CheckServer(): Promise<void> {
    try {
        await refreshInfo();
        const playersOnlineNew = await getPlayerList();
        if (_.isEqual(playersOnlineNew, playersOnline)) {
            return;
        }

        const playersList: string[] = [];
        let players = Array.from(playersOnlineNew);
        players = _.sortBy<string>(players, name => name.toLowerCase());
        players.forEach(player => {
            if (playersOnline.has(player)) {
                playersOnline.delete(player);
                playersList.push(fixMD(player));
            } else {
                playersList.unshift(`__${fixMD(player)}__`);
            }
        });
        playersOnline.forEach(player => {
            playersList.push(`~~${fixMD(player)}~~`);
        });
        playersOnline = playersOnlineNew;

        const Embed = new EmbedBuilder()
            .setDescription(playersList.join(" "))
            .setFooter({ text: `Список игроков (${playersOnline.size})` })
            .setTimestamp(Date.now());

        Client.send({ embeds: [Embed] });

        if (lostConnection) {
            lostConnection = false;
            Logger.info("Connection restored");
        }
    } catch (error) {
        if (error instanceof FetchError) {
            lostConnection = true;
            Logger.warn("Connection lost");
            Logger.warn(error);
        } else {
            throw error;
        }
    }
}

const name = "Server Info";
const ServerInfo: Service = { name, initialize, reload, start };
export default { ...ServerInfo, srvRecord } as const;
