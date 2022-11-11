export * from "./fetch.js";
export * from "./meta.js";
export * from "./string.js";

/**
 * Sleep for ms
 * @param ms milliseconds
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Sleep for {@link ms} milliseconds
 * @param ms milliseconds
 */
export function sleepMS(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Sleep for {@link s} seconds
 * @param s seconds
 */
export function sleepS(s: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, s * 1000));
}

