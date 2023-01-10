import log4js from "log4js";

const Logger = log4js.getLogger("Fetch");

export async function get<T>(url: string) {
    const response = await fetch(url, { headers: { "User-Agent": "DtD/5.0" } });
    if (!response.ok) {
        Logger.error(await response.text());
        throw new FetchError(response);
        //throw new Error(`${response.status}: ${response.statusText}`);
    }
    return await response.json() as T;
}

export async function getText(url: string): Promise<string> {
    return await (await fetch(url)).text();
}

export async function getJSON<T>(url: string): Promise<T>
export async function getJSON(url: string): Promise<unknown> {
    return await (await fetch(url)).json();
}

export class FetchError extends Error {
    constructor(response: Response) {
        super(`${response.status}: ${response.statusText}`);
        this.status = response.status;
        this.statusText = response.statusText;
    }
    public status: number;
    public statusText: string;
}

