import fetch from "node-fetch";

export async function getText(url: string): Promise<string> {
    return await (await fetch(url)).text();
}
export async function getJSON<T>(url: string): Promise<T>
export async function getJSON(url: string): Promise<unknown> {
    return await (await fetch(url)).json();
}

