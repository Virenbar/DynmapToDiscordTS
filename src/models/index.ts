export * from "./profile.js";

export interface Message {
    server: string
    user: string
    uuid: string | null
    message: string
    timestamp: string
    dimension: string | null
    X: number | null
    Y: number | null
    Z: number | null
}

export interface Event {
    user: string
    type: "join" | "left" | "first_join"
    timestamp: string
}
