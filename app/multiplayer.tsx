import { useEventListener } from "expo"
import { useRouter } from "expo-router"
import { VideoView as ExpoVideo, useVideoPlayer } from "expo-video"
import { useEffect, useState } from "react"
import { Animated, Dimensions, Easing, Image, ImageBackground, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import { Video as WebVideo } from "react-native-video"
import { MultiplayerConnection } from "../components/multiplayerConnection"

export default function Multiplayer() {
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
    const [hoveredCard, setHoveredCard] = useState<number | null>(null)
    const [canPlay, setCanPlay] = useState(true)
    const [roundInProgress, setRoundInProgress] = useState(false)
    const router = useRouter()
    const [revealedRounds, setRevealedRounds] = useState<number[]>([])
    const [gameResult, setGameResult] = useState<"win" | "lose" | null>(null)
    const [playerTurn, setPlayerTurn] = useState<"me" | "op">("me")
    const [, setNextStarter] = useState<"me" | "op">("me")
    const [popupMessage, setPopupMessage] = useState<string | null>(null)

    type Card = "king" | "villager" | "peasant"
    const beats: Record<Card, Card> = { king: "villager", villager: "peasant", peasant: "king" }
    const determineWinner = (me: Card, op: Card) => beats[me] === op ? "win" : beats[op] === me ? "lose" : "tie"

    const [screen, setScreen] = useState(Dimensions.get("window"))
    useEffect(() => {
        const sub = Dimensions.addEventListener("change", ({ window }) => setScreen(window))
        return () => sub.remove()
    }, [])

    const screenW = screen.width
    const screenH = screen.height
    const isMobile = Platform.OS !== "web"
    const widthScale = 0.45
    const heightScale = 0.15
    const maxCards = 5
    const maxWidthPerCard = screenW * widthScale / (maxCards + 1.2)
    const baseSize = Math.min(maxWidthPerCard, screenH * heightScale)
    const cardW = Math.min(Math.max(baseSize, 45), isMobile ? 80 : 140)
    const cardH = cardW * 1.33
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

    const [popupAnim] = useState(new Animated.Value(0))
    const showPopup = (msg: string) => {
        setPopupMessage(msg)
        Animated.sequence([
            Animated.timing(popupAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.delay(2000),
            Animated.timing(popupAnim, { toValue: 0, duration: 300, useNativeDriver: true })
        ]).start(() => setPopupMessage(null))
    }


    // -------------------------------
    // Connection setup
    // -------------------------------
    useEffect(() => {
        const c = new MultiplayerConnection()
        c.initListeners()
        c.peer.on("open", (id) => setPeerId(id))
        c.onMessage = handleMessage
        c.peer.on("error", (err: any) => {
            console.warn("Peer error:", err)
            showPopup("Lobby does not exist or is already full")
        })
        setConn(c)
        return () => c.destroy()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleMessage = (msg: any) => {
        if (msg.type === "FLIP_RESULT") {
            const myResult = isHost ? msg.result : msg.result === "heads" ? "tails" : "heads"
            setFlipResult(myResult)
            playFlipAnimation(myResult)
        }
        if (msg.type === "PLAY_CARD") handleOpponentPlay(msg.card)
    }

    // -------------------------------
    // Coin Flip Logic
    // -------------------------------
    const flipCoin = () => {
        if (!conn) return
        const res = Math.random() < 0.5 ? "heads" : "tails"
        conn.send({ type: "FLIP_RESULT", result: res })
        playFlipAnimation(res)
    }

    const playFlipAnimation = (res: "heads" | "tails") => {
        setFlipping(true)
        setFlipResult(res)
        setShowCards(false)
        setShowFlipMessage(false)
    }

    const startGame = (res: "heads" | "tails") => {
        setFlipping(false)
        setShowCards(true)

        if (res === "heads") {
            setFlipMessage("You go first")
            setHand(["king", "villager", "villager", "villager", "villager"])
            setOpHand(["peasant", "villager", "villager", "villager", "villager"])
            setPlayerTurn("me")
            setNextStarter("op")
            setCanPlay(true)
        } else {
            setFlipMessage("You go second")
            setHand(["peasant", "villager", "villager", "villager", "villager"])
            setOpHand(["king", "villager", "villager", "villager", "villager"])
            setPlayerTurn("op")
            setNextStarter("me")
            setCanPlay(false)
        }

        setShowFlipMessage(true)
        setTimeout(() => setShowFlipMessage(false), 2000)
    }

    // -------------------------------
    // Card Play Handling
    // -------------------------------
    const handleOpponentPlay = (opCard: Card) => {
        setPlayedPairs(p => {
            const u = [...p]
            const last = u[u.length - 1];
            if (u.length && last.me && !last.op) { //you play first
                u[u.length - 1] = { ...last, op: opCard };
                setOpHand(prev => prev.filter((_, i) => i !== 0));
                setTimeout(() => {
                    const res = determineWinner(last.me as Card, opCard)
                    setRevealedRounds(prev => [...prev, prev.length])
                    if (res === "win" || res === "lose") setGameResult(res)
                    setNextStarter(prev => {
                        const next = prev === "me" ? "op" : "me";
                        setPlayerTurn(next);
                        setCanPlay(next === "me");
                        return next;
                    });
                }, 1000)
            } else { //opponent plays first
                u.push({ me: "", op: opCard })
                setOpHand(prev => prev.filter((_, i) => i !== 0));
                setPlayerTurn("me");
                setTimeout(() => setCanPlay(true), 400)
            }
            return u
        })
    }

    const playCard = (card: Card, index: number) => {
        if (!canPlay || playerTurn !== "me" || roundInProgress) return
        setCanPlay(false)
        setRoundInProgress(true)
        setHand(p => p.filter((_, i) => i !== index))
        conn?.send({ type: "PLAY_CARD", card })

        setPlayedPairs(prev => {
            const u = [...prev]
            const last = u[u.length - 1]
            // If opponent played first
            if (u.length && last.op && !last.me) {
                u[u.length - 1] = { ...last, me: card };
                setTimeout(() => {
                    const res = determineWinner(card, last.op as Card)
                    setRevealedRounds(r => [...r, r.length])
                    if (res === "win" || res === "lose") setGameResult(res)
                    setNextStarter(prev => {
                        const next = prev === "me" ? "op" : "me";
                        setPlayerTurn(next);
                        setCanPlay(next === "me");
                        return next;
                    });
                    setRoundInProgress(false);
                }, 1000)
            } else {
                // You play first
                u.push({ me: card, op: "" })
                setPlayerTurn("op");
                setCanPlay(false);
                setRoundInProgress(false);
            }
            return u
        })
    }


    // -------------------------------
    // Coin Flip Video
    // -------------------------------
    const vid = flipResult === "heads" ? imgs.head : imgs.tail
    const player = useVideoPlayer(vid, (p) => { p.play(); p.loop = false; p.muted = true })
    useEventListener(player, "playingChange", () => {
        if (!player.playing && flipping && flipResult) startGame(flipResult)
    })

    // -------------------------------
    // Animations & Styles
    // -------------------------------
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

    const s = StyleSheet.create({
        videoBox: { width: 300, height: 300, justifyContent: "center", alignItems: "center" },
        video: { width: "100%", height: "100%" },
        image: { flex: 1, alignItems: "center", justifyContent: "center" },
        out: { width: "85%", height: "85%", justifyContent: "center", alignItems: "center", backgroundColor: "rgb(61,61,61)" },
        in: { width: "98%", height: "97%", justifyContent: "center", alignItems: "center", backgroundColor: "black" },
        row: { position: "absolute", bottom: -20, flexDirection: "row", justifyContent: "center", alignItems: "center" },
        opRow: { position: "absolute", top: -20, flexDirection: "row", justifyContent: "center", alignItems: "center" }
    })

    // -------------------------------
    // Connection Screen
    // -------------------------------
    if (!connected) {
        return (
            <ImageBackground source={imgs.moss} style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <View style={{ alignItems: "center", marginBottom: 20 }}>
                    <Text style={{ color: "white", fontSize: 20, marginBottom: 10 }}>Your ID:</Text>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text selectable style={{ color: "white", fontSize: 16 }}>{peerId || "..."}</Text>
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
                            style={{ marginLeft: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 6 }}
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
                    onPress={async () => {
                        if (!targetId.trim()) {
                            showPopup("Enter a valid ID first")
                            return
                        }
                        try {
                            await conn?.connectTo(targetId)
                            setConnected(true)
                        } catch (err: any) {
                            if (err.message === "LOBBY_NOT_FOUND") {
                                showPopup("Lobby does not exist or is not hosted yet")
                            } else {
                                showPopup("Lobby is already full or unavailable")
                            }
                        }
                    }}
                    style={{ marginTop: 20, backgroundColor: "rgb(12, 66, 14)", padding: 12, borderRadius: 10 }}
                >
                    <Text style={{ color: "white", fontSize: 18 }}>Connect</Text>
                </Pressable>
                <Pressable
                    onPress={() => { setConnected(true); setIsHost(true) }}
                    style={{ marginTop: 10, backgroundColor: "rgb(12, 66, 14)", padding: 12, borderRadius: 10 }}
                >
                    <Text style={{ color: "white", fontSize: 18 }}>Start as Host</Text>
                </Pressable>
                {popupMessage && (
                    <Animated.View
                        style={{
                            position: "absolute",
                            bottom: 100,
                            left: 0,
                            right: 0,
                            justifyContent: "center",
                            alignItems: "center",
                            opacity: popupAnim,
                            zIndex: 9999,
                        }}
                    >
                        <View style={{
                            backgroundColor: "rgba(0,0,0,0.8)",
                            paddingHorizontal: 20,
                            paddingVertical: 10,
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: "white",
                        }}>
                            <Text style={{ color: "white", fontSize: 16 }}>{popupMessage}</Text>
                        </View>
                    </Animated.View>
                )}
            </ImageBackground>
        )
    }

    // -------------------------------
    // Game Screen
    // -------------------------------
    return (
        <ImageBackground source={imgs.moss} resizeMode="cover" style={[s.image, s.video]}>
            <View style={s.out}>
                <View style={s.in}>
                    {isHost && connected && !flipResult && (
                        <Pressable onPress={flipCoin} style={{ marginTop: 20, backgroundColor: "rgb(40,90,40)", padding: 12, borderRadius: 10 }}>
                            <Text style={{ color: "white", fontSize: 18 }}>Flip Coin</Text>
                        </Pressable>
                    )}
                    {flipping && (
                        <View style={s.videoBox}>
                            {Platform.OS === "web" ? (
                                <WebVideo key={Date.now()} source={{ uri: vid }} style={s.video} resizeMode="contain"
                                    repeat={false} controls={false} paused={false} onEnd={() => startGame(flipResult!)} />
                            ) : (
                                <ExpoVideo player={player} style={{ width: 300, height: 300 }}
                                    contentFit="contain" allowsFullscreen={false}
                                    allowsPictureInPicture={false} nativeControls={false} />
                            )}
                        </View>
                    )}
                    {showFlipMessage && (
                        <Animated.View style={{
                            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                            justifyContent: "center", alignItems: "center",
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
                                            <Image
                                                source={revealed ? imgs[p.op as keyof typeof imgs] : imgs.back}
                                                style={{ width: cardW, height: cardH, marginBottom: 10 }}
                                            />
                                        ) : (
                                            <View style={{ width: cardW, height: cardH, marginBottom: 10 }} />
                                        )}
                                        {p.me ? (
                                            <Image
                                                source={revealed ? imgs[p.me as keyof typeof imgs] : imgs.back}
                                                style={{ width: cardW, height: cardH }}
                                            />
                                        ) : (
                                            <View style={{ width: cardW, height: cardH }} />
                                        )}
                                    </View>
                                )
                            })}
                        </View>
                    )}
                </View>
                {showCards && (
                    <>
                        {isHost ? (
                            <>
                                <View style={s.opRow}>{opHand.map((_, i) => <Image key={i} source={imgs.back} style={{ width: cardW, height: cardH }} />)}</View>
                                <View style={s.row}>
                                    {hand.map((c, i) => (
                                        <Pressable key={i} disabled={!canPlay} onPress={() => playCard(c, i)} onHoverIn={() => setHoveredCard(i)} onHoverOut={() => setHoveredCard(null)} style={({ pressed }) => [{
                                            marginHorizontal: 5,
                                            transform: [{ translateY: pressed || hoveredCard === i ? -10 : 0 }],
                                            shadowColor: "#fff",
                                            shadowOffset: { width: 0, height: 0 },
                                            shadowOpacity: pressed || hoveredCard === i ? 1 : 0,
                                            shadowRadius: pressed || hoveredCard === i ? 20 : 0
                                        }]}>
                                            <Image source={c === "king" ? imgs.king : c === "peasant" ? imgs.peasant : imgs.villager} style={{ width: cardW, height: cardH }} />
                                        </Pressable>
                                    ))}
                                </View>
                            </>
                        ) : (
                            <>
                                <View style={s.row}>
                                    {hand.map((c, i) => (
                                        <Pressable key={i} disabled={!canPlay} onPress={() => playCard(c, i)} onHoverIn={() => setHoveredCard(i)} onHoverOut={() => setHoveredCard(null)} style={({ pressed }) => [{
                                            marginHorizontal: 5,
                                            transform: [{ translateY: pressed || hoveredCard === i ? -10 : 0 }],
                                            shadowColor: "#fff",
                                            shadowOffset: { width: 0, height: 0 },
                                            shadowOpacity: pressed || hoveredCard === i ? 1 : 0,
                                            shadowRadius: pressed || hoveredCard === i ? 20 : 0
                                        }]}>
                                            <Image source={c === "king" ? imgs.king : c === "peasant" ? imgs.peasant : imgs.villager} style={{ width: cardW, height: cardH }} />
                                        </Pressable>
                                    ))}
                                </View>
                                <View style={s.opRow}>{opHand.map((_, i) => <Image key={i} source={imgs.back} style={{ width: cardW, height: cardH }} />)}</View>
                            </>
                        )}
                    </>
                )}
                {gameResult && (
                    <View style={{ position: "absolute", top: "40%", alignItems: "center" }}>
                        <Text style={{ fontSize: 32, color: "white" }}>
                            {gameResult === "win" ? "You Win!" : "You Lose!"}
                        </Text>
                        <Pressable
                            onPress={() => router.push("/")}
                            style={{ marginTop: 20, padding: 10, backgroundColor: "blue", borderRadius: 8 }}
                        >
                            <Text style={{ color: "white" }}>Return to Menu</Text>
                        </Pressable>
                    </View>
                )}
            </View>
        </ImageBackground>
    )
}
