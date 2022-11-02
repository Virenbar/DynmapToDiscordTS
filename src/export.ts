import { Client, Embed, IntentsBitField, TextChannel } from "discord.js";

const Messages: Message[] = [];
const MFooter = /(?<U>\w{2,})( (?<D>\w*)?\((?<X>-?\d+) (?<Y>-?\d+) (?<Z>-?\d+)\))?/g;
async function start(token: string) {
    const myIntents = new IntentsBitField();
    myIntents.add("Guilds", "GuildMessages");
    const Bot = new Client({ intents: myIntents });
    await Bot.login(token);
    const Channel = await Bot.channels.fetch("443434961895292929") as TextChannel;
    const Messages = await Channel.messages.fetch();

    const LastID = Messages.lastKey;
    const Embeds = Array.from(Messages.values()).flatMap(m => m.embeds);
    const E = Embeds[0];

    processEmbeds(Embeds);

    console.log(E, LastID);
}

function processEmbeds(embeds: Embed[]) {
    for (const embed of embeds) {
        if (embed.footer?.text.startsWith("Список")) {
            continue;
        } else if (embed.footer?.text.startsWith("Server")) {
            continue;
        } else {
            if (
                !embed.description ||
                !embed.footer?.text ||
                !embed.timestamp
            ) { continue; }

            const Match = MFooter.exec(embed.footer.text);
            if (Match == null || Match.groups == null) {
                console.log(embed.footer.text);
                continue;
            }
            const user = Match.groups["U"];
            const dimension = Match.groups["D"];
            const X = parseInt(Match.groups["X"] ?? 0);
            const Y = parseInt(Match.groups["Y"] ?? 0);
            const Z = parseInt(Match.groups["Z"] ?? 0);

            Messages.push({
                server: "minecrafting.ru",
                user: user,
                uuid: embed.footer?.iconURL,
                message: embed.description,
                date: embed.timestamp,
                dimension,
                X,
                Y,
                Z
            });
        }
    }
}

const Export = { start };
export default Export;

interface Message {
    server: string
    user: string
    uuid: string | undefined
    message: string
    date: string
    dimension: string | undefined
    X: number
    Y: number
    Z: number
}
