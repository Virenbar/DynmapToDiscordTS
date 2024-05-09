import { Client, Collection, Message as DMessage, Embed, IntentsBitField, TextChannel } from "discord.js";
import { WriteStream, createWriteStream } from "fs";
import { tryParseInt } from "./helpers/index.js";
import type { Event, Message, Online } from "./types/index.js";

const Messages: Message[] = [];
const Events: Event[] = [];
const Online: Online[] = [];
const RFooter = /(?<U>\w{2,})( (?<D>\w*)?\((?<X>-?\d+) (?<Y>-?\d+) (?<Z>-?\d+)\))?/g;
const RLogin = /__([\w\\]+)__/g;
const RLogout = /~~([\w\\]+)~~/g;
//const FirstID = "538065995689099275";
const FirstID = "598228713833758733";
let MFile: WriteStream;
let EFile: WriteStream;
let OFile: WriteStream;

async function start(token: string) {
    const myIntents = new IntentsBitField();
    myIntents.add("Guilds", "GuildMessages");
    const Bot = new Client({ intents: myIntents });
    //Bot.rest.on("rateLimited", e => console.log(e.limit, e.timeToReset));
    await Bot.login(token);

    MFile = createWriteStream("messages.tsv");
    MFile.write("server\tuser\tuuid\tmessage\ttimestamp\tdimension\tX\tY\tZ\n");
    EFile = createWriteStream("events.tsv");
    EFile.write("name\ttype\ttimestamp\n");
    OFile = createWriteStream("online.tsv");
    OFile.write("timestamp\tonline\n");

    let count = 0;
    const channel = await Bot.channels.fetch("443434961895292929") as TextChannel;
    let messages: Collection<string, DMessage>;
    let lastID = FirstID;
    while (lastID) {
        messages = await channel.messages.fetch({ after: lastID, limit: 100 });
        lastID = messages.firstKey() as string;

        const Embeds = Array.from(messages.values()).flatMap(m => m.embeds);
        processEmbeds(Embeds);
        console.log(count, messages.lastKey(), lastID);
        count++;
        if (count == 50) { break; }
    }
    MFile.close();
    EFile.close();
    OFile.close();
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
                Events.push({ user, type: "join", timestamp: new Date(embed.timestamp) });
            }
            for (const logout of embed.description.matchAll(RLogout)) {
                const user = logout[1].replaceAll("\\", "");
                Events.push({ user, type: "left", timestamp: new Date(embed.timestamp) });
            }
            const online = tryParseInt(embed.footer.text.match(/\d+/)?.[0] ?? "");
            if (online) {
                Online.push({ timestamp: new Date(embed.timestamp), online });
            }
        } else if (embed.footer.text.startsWith("Server")) {
            Messages.push({
                server: "minecrafting.ru",
                user: "Server",
                uuid: null,
                message: embed.description,
                timestamp: new Date(embed.timestamp),
                dimension: null,
                X: null,
                Y: null,
                Z: null
            });
        } else if (embed.footer.text == "Впервые вошел") {
            const user = embed.description.match(/^(\w+) /)?.[1] ?? "";
            Events.push({ user, type: "first_join", timestamp: new Date(embed.timestamp) });
        } else if (
            embed.footer.text == "/me" ||
            (embed.footer.text == "Unknown" && embed.description.startsWith("* "))
        ) {
            const user = embed.description.match(/\* (\w+) /)?.[1] ?? "";
            Messages.push({
                server: "minecrafting.ru",
                user: user,
                uuid: null,
                message: embed.description,
                timestamp: new Date(embed.timestamp),
                dimension: null,
                X: null,
                Y: null,
                Z: null
            });
        } else if (embed.footer.text == "Unknown") {
            continue;
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
                timestamp: new Date(embed.timestamp),
                dimension,
                X,
                Y,
                Z
            });
        }
    }
    Messages
        .map(M => `${M.server}\t${M.user}\t${M.uuid}\t${M.message}\t${M.timestamp.toISOString()}\t${M.dimension}\t${M.X}\t${M.Y}\t${M.Z}\n`)
        .forEach(S => MFile.write(S));
    Messages.length = 0;
    Events
        .map(E => `${E.user}\t${E.type}\t${E.timestamp.toISOString()}\n`)
        .forEach(S => EFile.write(S));
    Events.length = 0;
    Online
        .map(O => `${O.timestamp.toISOString()}\t${O.online}\n`)
        .forEach(S => OFile.write(S));
    Online.length = 0;
}

const Export = { start };
export default Export;

