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