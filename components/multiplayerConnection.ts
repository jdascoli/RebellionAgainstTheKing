import { DataConnection, Peer } from "peerjs";

export class MultiplayerConnection {
  peer: Peer
  conn: DataConnection | null = null
  activeConn: DataConnection | null = null
  onMessage?: (data: any) => void

  constructor(id?: string) {
    if (!id) id = ""
    this.peer = new Peer(id)
  }

  initListeners() {
    this.peer.on("connection", (conn) => {
      // Only allow one active connection
      if (this.activeConn) {
        console.warn("Connection rejected: lobby full")
        conn.close()
        return
      }

      this.activeConn = conn
      this.conn = conn
      console.log("Client connected:", conn.peer)

      conn.on("data", (data) => this.onMessage?.(data))
      conn.on("close", () => {
        console.log("Connection closed")
        this.activeConn = null
        this.conn = null
      })
    })

    this.peer.on("error", (err) => {
      console.error("Peer error:", err)
    })
  }

  connectTo(targetId: string) {
    return new Promise<void>((resolve, reject) => {
      try {
        const conn = this.peer.connect(targetId, { reliable: true })
        let timeout: number

        timeout = setTimeout(() => {
          if (!conn.open) {
            console.warn("Lobby not found or host not ready.")
            conn.close()
            reject(new Error("LOBBY_NOT_FOUND"))
          }
        }, 4000)

        conn.on("open", () => {
          clearTimeout(timeout)
          console.log("Connected to host:", targetId)
          this.conn = conn
          this.activeConn = conn

          conn.on("data", (data) => this.onMessage?.(data))
          conn.on("close", () => {
            console.log("Connection closed by host")
            this.activeConn = null
            this.conn = null
          })
          resolve()
        })

        conn.on("error", (err: any) => {
          clearTimeout(timeout)
          console.error("Connection error:", err)
          if (String(err).includes("Could not connect")) {
            reject(new Error("LOBBY_NOT_FOUND"))
          } else {
            reject(err)
          }
        })
      } catch (err) {
        reject(err)
      }
    })
  }

  send(data: any) {
    if (this.conn?.open) {
      this.conn.send(data)
    } else {
      console.warn("No open connection to send data")
    }
  }

  getId(): string {
    return this.peer.id
  }

  destroy() {
    this.conn?.close()
    this.peer.destroy()
  }
}
