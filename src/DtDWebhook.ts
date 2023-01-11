import { EmbedBuilder, WebhookClient } from "discord.js";
import log4js from "log4js";
import Config from "./config.js";
import { meta } from "./helpers/index.js";
import Services from "./services/index.js";
import ServerInfo from "./services/serverInfo.js";

export class DtDWebhook extends WebhookClient {
    constructor(url: string) {
        super(
            { url },
            { allowedMentions: { parse: ["users"] } }
        );
        this.config = Config.config;
        this.logger = log4js.getLogger("DtD");
    }
    public config;
    public logger;
    public reload() {
        Config.loadConfig();
        Services.reload();
    }
    public start() {
        this.logger.info("Initializing");
        Services.initialize(this);
        this.reload();
        this.sendTitle();
        this.logger.info(`Running as ${this.id}`);
        Services.start();
    }
    public async sendTitle() {
        let description = `Version: ${meta.version}`;
        description += `\nNode: ${meta.nodeVersion} Discord.js: v${meta.discord}`;
        description += `\nServer: ${await ServerInfo.srvRecord()}`;
        description += `\nDynmap: ${this.config.dynmap}`;
        const Embed = new EmbedBuilder()
            .setTitle("Dynmap to Discord")
            .setDescription(description)
            .setTimestamp(Date.now());

        await this.send({ embeds: [Embed] });
    }
}
