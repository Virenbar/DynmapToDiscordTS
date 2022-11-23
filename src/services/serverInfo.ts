import { EmbedBuilder } from "discord.js";
import _ from "lodash";
import log4js from "log4js";
import { JavaStatusResponse, status } from "minecraft-server-util";
import { FetchError } from "node-fetch";
import type { DtDWebhook } from "../DtDWebhook.js";
import { fixMD, sleep, sleepS } from "./../helpers/index.js";
import Database from "./database.js";
import type { TaskService } from "./index.js";

const Logger = log4js.getLogger("Server Info");
let Client: DtDWebhook;
let Server: { host: string, port: number | undefined };

let lostConnection = false;
let serverInfo: JavaStatusResponse;
let playersOnline: Set<string> = new Set<string>();

function initialize(client: DtDWebhook) {
    Client = client;
}

function reload() {
    Server.host = Client.config.host;
    Server.port = Client.config.port ?? undefined;
}

async function start() {
    await refreshInfo();
    playersOnline = await getPlayerList();
    Logger.info("Started");
    Logger.info(`Connected to ${serverInfo.srvRecord?.host}:${serverInfo.srvRecord?.port}`);

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

function playersSample(): string[] {
    if (serverInfo.players.sample == null) {
        return [];
    }
    let players = serverInfo.players.sample.map(p => p.name);
    const counts: { [name: string]: number } = {};
    players = players.map(name => {
        counts[name] = (counts[name] || 0) + 1;
        return `${name} #${counts[name]}`;
    });
    return players;
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
        Database.addOnline(new Date(), playersOnline.size);

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
        if (error instanceof FetchError && (error.code == "ECONNREFUSED" || error.code == "ETIMEDOUT")) {
            lostConnection = true;
            Logger.warn("Connection lost");
            Logger.warn(error);
        } else {
            throw error;
        }
    }
}
const name = "Dynmap Info";
const ServerInfo: TaskService = { name, initialize, reload, start };
export default ServerInfo;
