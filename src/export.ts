import { Client, Embed, IntentsBitField, TextChannel } from "discord.js";
import { createWriteStream } from "fs";
import { tryParseInt } from "./helpers/index.js";
import type { Event, Message } from "./models/index.js";

const Messages: Message[] = [];
const Events: Event[] = [];
const RFooter = /(?<U>\w{2,})( (?<D>\w*)?\((?<X>-?\d+) (?<Y>-?\d+) (?<Z>-?\d+)\))?/g;
const RLogin = /__([\w\\]+)__/g;
const RLogout = /~~([\w\\]+)~~/g;
const EndID = "538065995689099275";

async function start(token: string) {
    const myIntents = new IntentsBitField();
    myIntents.add("Guilds", "GuildMessages");
    const Bot = new Client({ intents: myIntents });
    await Bot.login(token);

    const M = createWriteStream("messages.csv");

    const E = createWriteStream("events.csv");

    const Channel = await Bot.channels.fetch("443434961895292929") as TextChannel;
    const Messages = await Channel.messages.fetch();

    const LastID = Messages.lastKey();
    const Embeds = Array.from(Messages.values()).flatMap(m => m.embeds);

    processEmbeds(Embeds);

    console.log(Embeds[0], LastID);

}

function processEmbeds(embeds: Embed[]) {
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
            continue;
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
            const dimension = Match.groups["D"];
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
    console.log(Messages);
    console.log(Events);
    Messages.map(M => `${M.server},${M.uuid},${M.user},${M.message},${M.timestamp},${M.dimension},${M.X},${M.Y},${M.Z}\n`);
}

const Export = { start };
export default Export;

