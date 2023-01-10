import { EmbedBuilder, WebhookClient } from "discord.js";
import log4js from "log4js";
import Config from "./config.js";
import { meta } from "./helpers/index.js";
import Services from "./services/index.js";

export class DtDWebhook extends WebhookClient {
    constructor(id: string, token: string) {
        super({ id: id, token: token });
        this.config = Config.config;
        this.logger = log4js.getLogger("DtD");
    }
    public config;
    public logger;
    public initialize() {
        Services.initialize(this);
    }
    public reload() {
        Config.loadConfig();
        Services.reload();
    }
    public start() {
        Services.start();
    }
    public sendTitle() {
        let description = `Version: ${meta.version}`;
        description += `\nServer: ${this.config.host}:${this.config.port}`;
        description += `\nDynmap: ${this.config.dynmap}`;
        const Embed = new EmbedBuilder()
            .setTitle("Dynmap to Discord")
            .setDescription(description)
            .setTimestamp(Date.now());

        this.send({ embeds: [Embed] });
    }
}
