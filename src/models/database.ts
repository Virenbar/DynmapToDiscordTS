export interface Message {
    server: string
    user: string
    uuid: string | null
    message: string
    timestamp: Date
    dimension: string | null
    X: number | null
    Y: number | null
    Z: number | null
}

export interface Event {
    user: string
    type: "join" | "left" | "first_join"
    timestamp: Date
}

export interface Online {
    online: number,
    timestamp: Date
}
