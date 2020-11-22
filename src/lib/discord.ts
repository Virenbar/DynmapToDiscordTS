import { trySendRequest } from './fetch';
import { config } from "./config"

export function sendMessage(msgs: MiniEmbed | MiniEmbed[]): Promise<boolean> {
    if (!Array.isArray(msgs)) {
        msgs = [msgs]
    }
    //console.log(msgs.length)
    const embeds: Embed[] = []
    for (const msg of msgs) {
        embeds.push({
            "author": {
                "name": msg.name,
                "url": '',
                "icon_url": msg.icon
            },
            "description": msg.message,
            "color": msg.color,
            "footer": {
                "icon_url": msg.footer_icon,
                "text": msg.footer
            },
            "timestamp": msg.timestamp
        })
    }
    const message: Message = {
        "embeds": embeds
    }
    //http.TrySendRequest()
    //let payload = JSON.stringify(message)
    return trySendRequest(config.webhook, message)
}
export interface MiniEmbed {
    "title"?: string,
    "name"?: string,
    "icon"?: string,
    "message": string,
    "color"?: number,
    "footer_icon"?: string,
    "footer"?: string,
    "timestamp": string
}

export interface Message {
    "content"?: string
    "username"?: string
    "avatar_url"?: string
    "embeds"?: Embed[]
}
interface Embed {
    "author"?: {
        "name"?: string,
        "url"?: string,
        "icon_url"?: string
    },
    "title"?: string,
    "description": string,
    "color"?: number,
    "footer"?: {
        "icon_url"?: string,
        "text"?: string
    },
    "timestamp"?: string
}
