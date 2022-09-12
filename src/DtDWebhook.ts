import { EmbedBuilder, WebhookClient } from "discord.js";
import Config from "./config.js";
import log4js from "log4js";

export class DtDWebhook extends WebhookClient {
    constructor(id: string, token: string) {
        super({ id: id, token: token });
        this.config = Config.Config;
        this.logger = log4js.getLogger("DtD");
    }
    public config;
    public logger;

    public SendTitle() {
        let description = "Version: 5.0.0";
        description += `\nServer: ${this.config.host}:${this.config.port}`;
        description += `\nDynmap: ${this.config.dynmap}`;
        const Embed = new EmbedBuilder()
            .setTitle("Dynmap to Discord")
            .setDescription(description)
            .setTimestamp(Date.now());

        this.send({ embeds: [Embed] });
    }
}
