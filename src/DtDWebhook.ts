import { EmbedBuilder, WebhookClient } from "discord.js";
import log4js from "log4js";
import Config from "./config.js";
import { meta } from "./helpers/index.js";
import Services from "./services/index.js";
import ServerInfo from "./services/serverInfo.js";
export class DtDWebhook extends WebhookClient {
    constructor(id: string, token: string) {
        super({ id: id, token: token });
        this.config = Config.config;
        this.logger = log4js.getLogger("DtD");
    }
    public config;
    public logger;
    public initialize() {
        this.logger.info("Initializing");
        Services.initialize(this);
    }
    public reload() {
        Config.loadConfig();
        Services.reload();
    }
    public start() {
        this.sendTitle();
        this.logger.info(`Running as ${this.id}`);
        Services.start();
    }
    public async sendTitle() {
        let description = `Version: ${meta.version} (Node: ${meta.nodeVersion})`;
        description += `\nDiscord.js: ${meta.discord}`;
        description += `\nServer: ${await ServerInfo.srvRecord()}`;
        description += `\nDynmap: ${this.config.dynmap}`;
        const Embed = new EmbedBuilder()
            .setTitle("Dynmap to Discord")
            .setDescription(description)
            .setTimestamp(Date.now());

        await this.send({ embeds: [Embed] });
    }
}
