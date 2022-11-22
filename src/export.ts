import { Client, Collection, Embed, IntentsBitField, Message as DMessage, TextChannel } from "discord.js";
import { createWriteStream, WriteStream } from "fs";
import { tryParseInt } from "./helpers/index.js";
import type { Event, Message } from "./models/index.js";

const Messages: Message[] = [];
const Events: Event[] = [];
let MFile: WriteStream;
let EFile: WriteStream;
const RFooter = /(?<U>\w{2,})( (?<D>\w*)?\((?<X>-?\d+) (?<Y>-?\d+) (?<Z>-?\d+)\))?/g;
const RLogin = /__([\w\\]+)__/g;
const RLogout = /~~([\w\\]+)~~/g;
const FirstID = "538065995689099275";

async function start(token: string) {
    const myIntents = new IntentsBitField();
    myIntents.add("Guilds", "GuildMessages");
    const Bot = new Client({ intents: myIntents });
    await Bot.login(token);

    MFile = createWriteStream("messages.tsv");
    MFile.write("server\tuser\tuuid\tmessage\ttimestamp\tdimension\tX\tY\tZ\n");
    EFile = createWriteStream("events.tsv");
    EFile.write("name\ttype\ttimestamp\n");

    let Count = 0;
    const Channel = await Bot.channels.fetch("443434961895292929") as TextChannel;
    let Messages: Collection<string, DMessage>;
    let LastID = FirstID;
    while (LastID) {
        Messages = await Channel.messages.fetch({ after: LastID, limit: 100 });
        LastID = Messages.firstKey() as string;

        const Embeds = Array.from(Messages.values()).flatMap(m => m.embeds);
        processEmbeds(Embeds);
        console.log(Count, LastID);
        Count++;
        if (Count == 50) { break; }
    }
    MFile.close();
    EFile.close();
}

function processEmbeds(embeds: Embed[]) {
    embeds.reverse();
    for (const embed of embeds) {
        if (
            !embed.description ||
            !embed.footer?.text ||
            !embed.timestamp
        ) { continue; }

        if (embed.footer.text.startsWith("Список")) {
            for (const login of embed.description.matchAll(RLogin)) {
                const user = login[1].replaceAll("\\", "");
                Events.push({ user, type: "join", timestamp: embed.timestamp });
            }
            for (const logout of embed.description.matchAll(RLogout)) {
                const user = logout[1].replaceAll("\\", "");
                Events.push({ user, type: "left", timestamp: embed.timestamp });
            }
        } else if (embed.footer.text.startsWith("Server")) {
            Messages.push({
                server: "minecrafting.ru",
                user: "Server",
                uuid: null,
                message: embed.description,
                timestamp: embed.timestamp,
                dimension: null,
                X: null,
                Y: null,
                Z: null
            });
        } else if (embed.footer.text == "Unknown") {
            continue;
        } else if (embed.footer.text == "Впервые вошел") {
            const user = embed.description.match(/^(\w+) /)?.[1] ?? "";
            Events.push({ user, type: "first_join", timestamp: embed.timestamp });
        } else if (embed.footer.text == "/me") {
            const user = embed.description.match(/\* (\w+) /)?.[1] ?? "";
            Messages.push({
                server: "minecrafting.ru",
                user: user,
                uuid: null,
                message: embed.description,
                timestamp: embed.timestamp,
                dimension: null,
                X: null,
                Y: null,
                Z: null
            });
        } else {
            const Match = [...embed.footer.text.matchAll(RFooter)][0];
            if (Match == null || Match.groups == null) {
                console.log(embed.footer.text);
                continue;
            }
            const user = Match.groups["U"];
            const dimension = Match.groups["D"] ?? null;
            const X = tryParseInt(Match.groups["X"]);
            const Y = tryParseInt(Match.groups["Y"]);
            const Z = tryParseInt(Match.groups["Z"]);
            const uuid = embed.footer.iconURL?.match(/\/(\w+)\?/)?.[1] ?? null;
            Messages.push({
                server: "minecrafting.ru",
                user: user,
                uuid,
                message: embed.description,
                timestamp: embed.timestamp,
                dimension,
                X,
                Y,
                Z
            });
        }
    }
    Messages
        .map(M => `${M.server}\t${M.uuid}\t${M.user}\t${M.message}\t${M.timestamp}\t${M.dimension}\t${M.X}\t${M.Y}\t${M.Z}\n`)
        .forEach(S => MFile.write(S));
    Events
        .map(E => `${E.user}\t${E.type}\t${E.timestamp}\n`)
        .forEach(S => EFile.write(S));
    Messages.length = 0;
    Events.length = 0;
}

const Export = { start };
export default Export;

