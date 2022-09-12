import { EmbedBuilder } from "discord.js";
import _ from "lodash";
import log4js from "log4js";
import { FetchError } from "node-fetch";
import type { DtDWebhook } from "../DtDWebhook.js";
import { fixMD, getJSON, sleep } from "../helpers/index.js";
import type { Profile } from "../models/index.js";
import { AddMessage } from "./database.js";
import type { Service } from "./index.js";

const Logger = log4js.getLogger("Dynmap Info");
let Client: DtDWebhook;
let FileURL: string;

let lostConnection = false;
let dynmapInfo: DynmapFile;
let timestamp = 0; //420000

const dims: { [dim: string]: string } = {
    "world": "O",//"🟢",
    "world_nether": "N", //"🔴",
    "world_end": "E",
    "world_oldnether": "~~E~~",
    "test": "🟡"
};

function Initialize(client: DtDWebhook) {
    Client = client;
}

async function Start() {
    Reload();
    if (FileURL == "") {
        Logger.warn("Dynmap URL not set. Service disabled");
        return;
    }
    await RefreshInfo();
    Logger.info("Started");
    Logger.info(`Dynmap file: ${FileURL} Timestamp: ${dynmapInfo.timestamp}`);

    for (; ;) {
        try {
            await CheckDynmap();
            await sleep(10 * 1000);
        } catch (error) {
            Logger.error(error);
            await sleep(60 * 1000);
        }
    }
}
function Reload() {
    FileURL = Client.config.dynmap ?? "";
    Logger.info("Reloaded");
}

async function RefreshInfo() {
    dynmapInfo = await getJSON<DynmapFile>(FileURL);
}

async function getUUID(name: string): Promise<string> {
    try {
        const json = await getJSON<Profile>(`https://api.mojang.com/users/profiles/minecraft/${name}`);
        return json.id;
    } catch (error) {
        Logger.warn(`Error fetching profile: ${name}`);
        Logger.warn(error);
        return "00000000-0000-0000-0000-000000000000";
    }
}

async function PlayerEmbed(event: ChatEvent) {
    const name = event.account.replace(/&./g, "");
    const account = name.replace(/\[.*?\]/g, "");
    const uuid = await getUUID(account);
    let position = "";
    const player = _.find(dynmapInfo.players, p => p.account == account);
    if (player) {
        const D = dims[player?.world] ?? "";
        position = `${D}(${player?.x} ${player?.y} ${player?.z})`;
    }
    AddMessage({
        player: account,
        uuid: uuid,
        text: event.message,
        dimension: player?.world ?? null,
        x: player?.x ?? null,
        y: player?.y ?? null,
        z: player?.z ?? null
    });

    //--Steve 00000000-0000-0000-0000-000000000000 Alex ..0001
    const Embed = new EmbedBuilder()
        .setDescription(fixMD(event.message))
        .setColor(parseInt((event.playerName.match(/"color:#(.+)"/) || ["", "ffffff"])[1], 16))
        .setFooter({
            text: `${name} ${position}`,
            iconURL: `https://crafatar.com/avatars/${uuid}?overlay`
        })
        .setTimestamp(new Date(event.timestamp));
    return Embed;
}

function PluginEmbed(event: ChatEvent) {
    const Embed = new EmbedBuilder();
    if (event.message.startsWith("[Server]")) {
        Embed.setDescription(event.message.substr(8))
            .setColor(0xFF55FF)
            .setFooter({ text: "Server" });
    } else if (event.message.startsWith("* ")) {
        Embed.setDescription(event.message)
            .setColor(0xFFFF55)
            .setFooter({ text: "/me" });
    } else if (event.message.match(/впервые вошел/)) {
        Embed.setDescription(event.message)
            .setColor(0xFBA800)
            .setFooter({ text: "Впервые вошел" });
    } else if (!event.message.match(/вошел|вышел/i)) {
        Embed.setDescription(event.message)
            .setColor(0xFFFF55)
            .setFooter({ text: "Unknown" });
    } else {
        return null;
    }
    Embed.setTimestamp(new Date(event.timestamp));
    return Embed;
}

function WebEmbed(event: ChatEvent) {
    const Embed = new EmbedBuilder()
        .setDescription(event.message)
        .setColor(0xFFFFFF)
        .setFooter({ text: `[Web]${event.playerName}` })
        .setTimestamp(new Date(event.timestamp));
    return Embed;
}

async function ChatEmbed(event: ChatEvent) {
    switch (event.source) {
        case "player":
            return await PlayerEmbed(event);
        case "plugin":
            return PluginEmbed(event);
        case "web":
            return WebEmbed(event);
        default:
            return null;
    }
}

async function CheckDynmap(): Promise<void> {
    try {
        await RefreshInfo();
        const Embeds: EmbedBuilder[] = [];
        for (const event of dynmapInfo.updates) {
            if (event.timestamp > timestamp && event.type != "tile") {
                if (event.type == "chat") {
                    const Embed = await ChatEmbed(event as ChatEvent);
                    if (Embed != null) { Embeds.push(Embed); }
                }
            }
            if (Embeds.length == 10) {
                await Client.send({ embeds: Embeds });
                Embeds.length = 0;
            }
        }
        if (Embeds.length > 0) {
            await Client.send({ embeds: Embeds });
        }
        timestamp = dynmapInfo.timestamp;
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

interface DynmapFile {
    currentcount: number,
    hasStorm: boolean,
    players: [{
        world: string,
        armor: number,
        name: string,
        x: number,
        y: number,
        health: number,
        z: number,
        sort: number,
        type: string,
        account: string
    }],
    isThundering: boolean,
    confighash: number,
    servertime: number,
    updates: Event[],
    timestamp: number
}
interface Event {
    type: string
    timestamp: number
}
interface ChatEvent extends Event {
    type: "chat"
    source: string
    playerName: string
    message: string
    account: string
    channel: string
}

const DynmapInfo: Service = { Initialize, Start, Reload };
export default DynmapInfo;
