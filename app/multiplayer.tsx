import { useEffect, useState } from "react"
import { Button, Text, TextInput, View } from "react-native"
import { MultiplayerConnection } from "../components/multiplayerConnection"

export default function Multiplayer() {
  const [conn, setConn] = useState<MultiplayerConnection | null>(null)
  const [peerId, setPeerId] = useState("")
  const [targetId, setTargetId] = useState("")
  const [log, setLog] = useState("")

  useEffect(() => {
    const c = new MultiplayerConnection()
    c.initListeners()
    c.onMessage = (msg) => setLog(prev => prev + "\n" + JSON.stringify(msg))
    c.peer.on("open", (id) => setPeerId(id))
    setConn(c)
    return () => c.destroy()
  }, [])

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 10 }}>
      <Text>Your ID: {peerId || "Loading..."}</Text>
      <TextInput
        value={targetId}
        onChangeText={setTargetId}
        placeholder="Enter opponent ID"
        style={{ borderWidth: 1, width: 200, padding: 6 }}
      />
      <Button title="Connect" onPress={() => conn?.connectTo(targetId)} />
      <Button title="Send Test" onPress={() => conn?.send({ type: "PING", time: Date.now() })} />
      <Text>{log}</Text>
    </View>
  )
}
