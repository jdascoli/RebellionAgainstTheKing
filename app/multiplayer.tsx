import { useEventListener } from "expo"
import { useRouter } from "expo-router"
import { VideoView as ExpoVideo, useVideoPlayer } from "expo-video"
import { useEffect, useState } from "react"
import { Animated, Dimensions, Easing, Image, ImageBackground, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import { Video as WebVideo } from "react-native-video"
import { MultiplayerConnection } from "../components/multiplayerConnection"

type Card = "king" | "villager" | "peasant"
const beats: Record<Card, Card> = { king: "villager", villager: "peasant", peasant: "king" }
const determineWinner = (me: Card, op: Card) => beats[me] === op ? "win" : beats[op] === me ? "lose" : "tie"

export default function Multiplayer() {
    const router = useRouter()
    const [conn, setConn] = useState<MultiplayerConnection | null>(null)
    const [peerId, setPeerId] = useState("")
    const [targetId, setTargetId] = useState("")
    const [connected, setConnected] = useState(false)
    const [isHost, setIsHost] = useState(false)

    // Game State
    const [flipping, setFlipping] = useState(false)
    const [flipResult, setFlipResult] = useState<"heads" | "tails" | null>(null)
    const [showFlipMessage, setShowFlipMessage] = useState(false)
    const [flipMessage, setFlipMessage] = useState("")
    const [showCards, setShowCards] = useState(false)
    const [hand, setHand] = useState<Card[]>([])
    const [opHand, setOpHand] = useState<Card[]>([])
    const [playedPairs, setPlayedPairs] = useState<{ me: string; op: string }[]>([])
    const [revealedRounds, setRevealedRounds] = useState<number[]>([])
    const [hoveredCard, setHoveredCard] = useState<number | null>(null)
    const [canPlay, setCanPlay] = useState(true)
    const [gameResult, setGameResult] = useState<"win" | "lose" | null>(null)
    const [playerTurn, setPlayerTurn] = useState<"me" | "op">("me")
    const [roundInProgress, setRoundInProgress] = useState(false)
    const [nextStarter, setNextStarter] = useState<"me" | "op">("me")

    const [screen, setScreen] = useState(Dimensions.get("window"))

    // Update card sizing dynamically on resize / rotation
    useEffect(() => {
        const sub = Dimensions.addEventListener("change", ({ window }) => setScreen(window))
        return () => sub.remove()
    }, [])

    const screenW = screen.width
    const screenH = screen.height
    const isMobile = Platform.OS !== "web"

    // Card sizing logic 
    const widthScale = 0.45
    const heightScale = 0.15
    const maxCards = 5
    const maxWidthPerCard = screenW * widthScale / (maxCards + 1.2)
    const baseSize = Math.min(maxWidthPerCard, screenH * heightScale)
    const cardW = Math.min(Math.max(baseSize, 45), isMobile ? 80 : 140)
    const cardH = cardW * 1.33

    // Card spacing between played pairs
    const spacing = Math.min((400 * 0.33) / (playedPairs.length - 1 || 1), 40)

    const imgs = {
        head: "https://flip-video-host.vercel.app/Heads.mp4",
        tail: "https://flip-video-host.vercel.app/Tails.mp4",
        king: require("../assets/images/king.png"),
        peasant: require("../assets/images/peasant.png"),
        villager: require("../assets/images/villager.png"),
        moss: require("../assets/images/mossWall.png"),
        back: require("../assets/images/back.png")
    }

    const endFlip = () => {
        setFlipping(false); setShowCards(true)
        if (flipResult === "heads") {
            setHand(["king", "villager", "villager", "villager", "villager"])
            setOpHand(["peasant", "villager", "villager", "villager", "villager"])
            setPlayerTurn("me"); setNextStarter("op"); setFlipMessage("You go first")
        } else {
            setHand(["peasant", "villager", "villager", "villager", "villager"])
            setOpHand(["king", "villager", "villager", "villager", "villager"])
            setPlayerTurn("op"); setNextStarter("me"); setFlipMessage("You go second")
        }

        // Show “You go first/second” text briefly
        setShowFlipMessage(true)
        setTimeout(() => {
            setShowFlipMessage(false); setShowCards(true)
        }, 2000)
    }

    // Fade animation for “You go first / second”
    const [fadeAnim] = useState(new Animated.Value(0))

    useEffect(() => {
        if (showFlipMessage) {
            Animated.sequence([
                Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true, easing: Easing.out(Easing.exp) }),
                Animated.delay(1000),
                Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true, easing: Easing.in(Easing.exp) })
            ]).start()
        }
    }, [showFlipMessage, fadeAnim])

    // Connection setup
    useEffect(() => {
        const c = new MultiplayerConnection()
        c.initListeners()
        c.peer.on("open", (id) => setPeerId(id))
        c.onMessage = handleMessage
        setConn(c)
        return () => c.destroy()
    }, [])

    const handleMessage = (msg: any) => {
        if (msg.type === "FLIP_RESULT") startGame(msg.result)
        if (msg.type === "PLAY_CARD") handleOpponentPlay(msg.card)
    }

    // Coin flip logic
    const flipCoin = () => {
        if (!conn) return
        const res = Math.random() < 0.5 ? "heads" : "tails"
        conn.send({ type: "FLIP_RESULT", result: res })
        startGame(res)
    }

    const startGame = (res: "heads" | "tails") => {
        setFlipping(true)
        setFlipResult(res)
        setTimeout(() => {
            setFlipping(false)
            setShowCards(true)
            if (res === "heads") {
                setFlipMessage("You go first")
                setHand(["king", "villager", "villager", "villager", "villager"])
                setOpHand(["peasant", "villager", "villager", "villager", "villager"])
                setPlayerTurn("me")
                setNextStarter("op")
            } else {
                setFlipMessage("You go second")
                setHand(["peasant", "villager", "villager", "villager", "villager"])
                setOpHand(["king", "villager", "villager", "villager", "villager"])
                setPlayerTurn("op")
                setNextStarter("me")
            }
            setShowFlipMessage(true)
            setTimeout(() => setShowFlipMessage(false), 2000)
        }, 1500)
    }

    // Card play handling
    const handleOpponentPlay = (opCard: Card) => {
        setPlayedPairs(p => {
            const u = [...p]
            if (u.length && !u[u.length - 1].op) u[u.length - 1].op = opCard
            else u.push({ me: "", op: opCard })
            return u
        })
        setPlayerTurn("me")
        setCanPlay(true)
    }

    const playCard = (card: Card, index: number) => {
        if (!canPlay || playerTurn !== "me" || roundInProgress) return
        setCanPlay(false)
        setRoundInProgress(true)
        setHand(p => p.filter((_, i) => i !== index))
        conn?.send({ type: "PLAY_CARD", card })
        setPlayedPairs(p => [...p, { me: card, op: "" }])
        setTimeout(() => setRoundInProgress(false), 800)
    }

    // Coin flip video
    const vid = flipResult === "heads" ? imgs.head : imgs.tail
    const player = useVideoPlayer(vid, (p) => { p.play(); p.loop = false; p.muted = true })
    useEventListener(player, "playingChange", () => {
        if (!player.playing && flipping) setFlipping(false)
    })

    // -------------------------------
    // Layout Styles
    // -------------------------------
    const s = StyleSheet.create({
        videoBox: { width: 300, height: 300, justifyContent: "center", alignItems: "center" },
        video: { width: "100%", height: "100%" },
        image: { flex: 1, alignItems: "center", justifyContent: "center" },
        out: { width: "85%", height: "85%", justifyContent: "center", alignItems: "center", backgroundColor: "rgb(61,61,61)" },
        in: { width: "98%", height: "97%", justifyContent: "center", alignItems: "center", backgroundColor: "black" },
        row: { position: "absolute", bottom: -20, flexDirection: "row", justifyContent: "center", alignItems: "center" },
        opRow: { position: "absolute", top: -20, flexDirection: "row", justifyContent: "center", alignItems: "center" }
    })

    if (!connected) {
        return (
            <ImageBackground source={imgs.moss} style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <View style={{ alignItems: "center", marginBottom: 20 }}>
                    <Text style={{ color: "white", fontSize: 20, marginBottom: 10 }}>Your ID:</Text>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text selectable style={{ color: "white", fontSize: 16, marginBottom: 20 }}>{peerId || "..."}</Text>
                        <Pressable
                            onPress={async () => {
                                if (!peerId) return
                                try {
                                    if (Platform.OS === "web" && navigator?.clipboard) await navigator.clipboard.writeText(peerId)
                                    alert("Copied!")
                                } catch (err) {
                                    console.warn("Copy failed:", err)
                                }
                            }}
                            style={{
                                marginLeft: 8,
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                backgroundColor: "rgba(255,255,255,0.15)",
                                borderRadius: 6,
                            }}
                        >
                            <Text style={{ color: "white", fontSize: 14 }}>📋</Text>
                        </Pressable>
                    </View>
                </View>
                <TextInput
                    value={targetId}
                    onChangeText={setTargetId}
                    placeholder="Enter opponent ID"
                    placeholderTextColor="#ccc"
                    style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "white", borderRadius: 8, padding: 8, width: 200, textAlign: "center" }}
                />
                <Pressable
                    onPress={() => { conn?.connectTo(targetId); setConnected(true) }}
                    style={{ marginTop: 20, backgroundColor: "rgb(8, 44, 11)", padding: 12, borderRadius: 10 }}
                >
                    <Text style={{ color: "white", fontSize: 18 }}>Connect</Text>
                </Pressable>
                <Pressable
                    onPress={() => { setConnected(true); setIsHost(true) }}
                    style={{ marginTop: 10, backgroundColor: "rgb(12, 66, 14)", padding: 12, borderRadius: 10 }}
                >
                    <Text style={{ color: "white", fontSize: 18 }}>Start as Host</Text>
                </Pressable>
            </ImageBackground>
        )
    }

    return (
        <ImageBackground source={imgs.moss} resizeMode="cover" style={[s.image, s.video]}>
            <View style={s.out}>
                <View style={s.in}>
                    {flipping && (
                        <View>
                            <View style={s.videoBox}>
                                {Platform.OS === "web" ? (
                                    <WebVideo key={Date.now()} source={{ uri: vid }} style={s.video} resizeMode="contain"
                                        repeat={false} controls={false} paused={false} onEnd={endFlip} />
                                ) : (
                                    <ExpoVideo player={player} style={{ width: 300, height: 300 }} contentFit="contain" allowsFullscreen={false}
                                        allowsPictureInPicture={false} nativeControls={false} />
                                )}
                            </View>
                        </View>
                    )}
                    {showFlipMessage && (
                        <Animated.View style={{
                            position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center",
                            backgroundColor: "rgba(0,0,0,0.6)", opacity: fadeAnim
                        }}>
                            <Text style={{
                                fontSize: 36, color: "#fff", fontWeight: "bold", textShadowColor: "rgba(255,255,255,0.8)",
                                textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20
                            }}>
                                {flipMessage}
                            </Text>
                        </Animated.View>
                    )}
                    {playedPairs.length > 0 && (
                        <View style={{ position: "absolute", top: screenH * 0.22, width: "100%", flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
                            {playedPairs.map((p, i) => {
                                const revealed = revealedRounds.includes(i)
                                return (
                                    <View key={i} style={{ marginLeft: i === 0 ? 0 : spacing, alignItems: "center" }}>
                                        {p.op ? (
                                            <Image source={revealed ? imgs[p.op as keyof typeof imgs] ?? imgs.villager : imgs.back} style={{ width: cardW, height: cardH, marginBottom: 10 }} />
                                        ) : (
                                            <View style={{ width: cardW, height: cardH, marginBottom: 10 }} />
                                        )}
                                        {p.me ? (
                                            <Image source={revealed ? imgs[p.me as keyof typeof imgs] ?? imgs.villager : imgs.back} style={{ width: cardW, height: cardH }} />
                                        ) : i === playedPairs.length - 1 && p.op ? (
                                            <View style={{ width: cardW, height: cardH }} />
                                        ) : (
                                            <View style={{ width: cardW, height: cardH }} />
                                        )}
                                    </View>
                                )
                            })}
                        </View>
                    )}
                    {gameResult && (
                        <View style={{ position: "absolute", top: "40%", alignItems: "center" }}>
                            <Text style={{ fontSize: 32, color: "white" }}>{gameResult === "win" ? "You Win!" : "You Lose!"}</Text>
                            <Pressable onPress={() => router.push("/")} style={{ marginTop: 20, padding: 10, backgroundColor: "blue", borderRadius: 8 }}>
                                <Text style={{ color: "white" }}>Return to Menu</Text>
                            </Pressable>
                        </View>
                    )}
                </View>
                {showCards && (
                    <>
                        <View style={s.opRow}>{opHand.map((_, i) => <Image key={i} source={imgs.back} style={{ width: cardW, height: cardH }} />)}</View>
                        <View style={s.row}>
                            {hand.map((c, i) => (
                                <Pressable key={i} disabled={!canPlay} onPress={() => playCard(c, i)} onHoverIn={() => setHoveredCard(i)} onHoverOut={() => setHoveredCard(null)} style={({ pressed }) => [{ marginHorizontal: 5, transform: [{ translateY: pressed || hoveredCard === i ? -10 : 0 }], shadowColor: "#fff", shadowOffset: { width: 0, height: 0 }, shadowOpacity: pressed || hoveredCard === i ? 1 : 0, shadowRadius: pressed || hoveredCard === i ? 20 : 0 }]}>
                                    <Image source={c === "king" ? imgs.king : c === "peasant" ? imgs.peasant : imgs.villager} style={{ width: cardW, height: cardH }} />
                                </Pressable>
                            ))}
                        </View>
                    </>
                )}
            </View>
        </ImageBackground>
    )
}
