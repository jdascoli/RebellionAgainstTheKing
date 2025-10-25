import { Peer } from "peerjs";

export class MultiplayerConnection {
  peer: Peer
  conn: any
  onMessage?: (data: any) => void

  constructor(id?: string) {
    if(!id) id = ""
    this.peer = new Peer(id) 
  }

  initListeners() {
    this.peer.on("connection", (conn) => {
      this.conn = conn
      this.conn.on("data", (data: any) => this.onMessage?.(data))
    })
  }

  connectTo(id: string) {
    this.conn = this.peer.connect(id)
    this.conn.on("open", () => console.log("Connected to peer"))
    this.conn.on("data", (data: any) => this.onMessage?.(data))
  }

  send(data: any) {
    if (this.conn && this.conn.open) this.conn.send(data)
  }

  getId(): string {
    return this.peer.id
  }

  destroy() {
    this.peer.destroy()
  }
}
