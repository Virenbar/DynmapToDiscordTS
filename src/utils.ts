/**
 * Sleep for ms
 * @param ms milliseconds
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Escape markdown chars
 */
export function fixMD(str: string): string {
    return str.replace(/_/g, '\\_').replace(/\*/g, '\\*')
}

export function timeout(ms: number): Promise<void> {
    return new Promise((_resolve, reject) => setTimeout(() => reject(new Error("")), ms))
}

export async function withTimeout<T>(promise: () => Promise<T>, ms: number, message?: string): Promise<T> {
    let timeoutHandle: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_resolve, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error(message)), ms)
    })

    const result = await Promise.race([
        promise(),
        timeoutPromise,
    ]);
    clearTimeout(timeoutHandle);
    return result;
}
