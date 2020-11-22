import fetch from "node-fetch"
import { logger } from '../index'
import { Message } from '../lib/discord'

export async function get(url: string): Promise<string> {
  return await (await fetch(url)).text()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function trySendRequest(url: string, payload: Message): Promise<boolean> {
  try {
    //console.log(payload.embeds[0])
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        "Content-Type": 'application/json'//,
        //"Content-Length": payload.
      },
      body: JSON.stringify(payload)
    })
    //console.log(JSON.stringify(response,null,10))
    if (!res.ok) {
      logger.error('Response:\n' + res.body + ', code = ' + res.status)
    }
    /* console.log('Left '+response.headers['x-ratelimit-remaining']+
      '/'+response.headers['x-ratelimit-limit']+
      '. Reset in '+new Date(response.headers['x-ratelimit-reset']*1000)+
      ' '+(response.headers['x-ratelimit-reset']-Math.floor(Date.now()/1000))
    ) */
    return true
  } catch (err) {
    logger.error('Error sending post request')
    logger.error(err)
    return false
    //Добавить повторную отправку
  }
}
