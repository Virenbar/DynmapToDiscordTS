// No types?
// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/60924
declare global {
    export const {
        fetch,
        FormData,
        Headers,
        Request,
        Response
    }: typeof import("undici");
}
export { };

