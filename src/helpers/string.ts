/**
 * Escape markdown chars
 */
export function fixMD(str: string): string {
    return str.replace(/_/g, "\\_").replace(/\*/g, "\\*");
}

export function tryParseInt(str: string) {
    const n = parseInt(str, 10);
    return isNaN(n) ? null : n;
}
