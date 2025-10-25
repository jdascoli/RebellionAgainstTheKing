import { Video as ExpoVideo, ResizeMode } from "expo-av"
import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { Image, ImageBackground, Platform, Pressable, StyleSheet, Text, View } from "react-native"
import { Video as WebVideo } from "react-native-video"

export default function Singleplayer() {
    const [flipping, setFlipping] = useState(false)
    const [flipResult, setFlipResult] = useState<'heads' | 'tails'>('heads')
    const [flipMessage, setFlipMessage] = useState('')
    const [showCards, setShowCards] = useState(false)
    const [hand, setHand] = useState<Card[]>([])
    const [opHand, setOpHand] = useState<Card[]>([])
    const [playedPairs, setPlayedPairs] = useState<{ me: string; op: string }[]>([])
    const [revealedRounds, setRevealedRounds] = useState<number[]>([])
    const [hoveredCard, setHoveredCard] = useState<number | null>(null)
    const [canPlay, setCanPlay] = useState(true)
    const [gameResult, setGameResult] = useState<"win" | "lose" | null>(null)
    const [playerTurn, setPlayerTurn] = useState<"me" | "op">("me")
    const [hiddenBotCard, setHiddenBotCard] = useState<string | null>(null)
    const [roundInProgress, setRoundInProgress] = useState(false)
    const [nextStarter, setNextStarter] = useState<"me" | "op">("me")

    const router = useRouter()
    const imgs = {
        head: "https://flip-video-host.vercel.app/Heads.mp4",
        tail: "https://flip-video-host.vercel.app/Tails.mp4",
        king: require('../assets/images/king.png'),
        peasant: require('../assets/images/peasant.png'),
        villager: require('../assets/images/villager.png'),
        moss: require('../assets/images/mossWall.png'),
        back: require('../assets/images/back.png')
    }

    const spacing = Math.min((400 * 0.33) / (playedPairs.length - 1 || 1), 40)

    type Card = "king" | "villager" | "peasant"

    const beats: Record<Card, Card> = {
        king: "villager",
        villager: "peasant",
        peasant: "king"
    }

    const determineWinner = (me: Card, op: Card) =>
        beats[me] === op ? "win" : beats[op] === me ? "lose" : "tie"

    useEffect(() => {
        if (playerTurn !== "op" || gameResult || !showCards || flipping || roundInProgress || !opHand.length) return
        setRoundInProgress(true); setCanPlay(false)
        setTimeout(() => {
            const idx = Math.floor(Math.random() * opHand.length)
            const opCard = opHand[idx]
            setOpHand(p => p.filter((_, i) => i !== idx))
            const last = playedPairs[playedPairs.length - 1]
            if (last && last.me && !last.op) {
                setPlayedPairs(p => { const u = [...p]; u[u.length - 1] = { ...u[u.length - 1], op: opCard }; return u })
                setTimeout(() => {
                    const res = determineWinner(last.me as Card, opCard)
                    setRevealedRounds(p => [...p, p.length])
                    if (res === "win" || res === "lose") setGameResult(res)
                    else { setNextStarter(prev => prev === "me" ? "op" : "me"); setPlayerTurn(nextStarter) }
                    setTimeout(() => { setCanPlay(true); setRoundInProgress(false) }, 800)
                }, 800)
            } else {
                setHiddenBotCard(opCard)
                setPlayedPairs(p => [...p, { me: "", op: opCard }])
                setTimeout(() => { setPlayerTurn("me"); setCanPlay(true); setRoundInProgress(false) }, 800)
            }
        }, 800)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playerTurn, gameResult, showCards, flipping, roundInProgress, opHand, playedPairs])

    useEffect(() => {
        setFlipping(true)
        const res = Math.random() < 0.5 ? "heads" : "tails"
        setFlipResult(res)
        setFlipMessage(res === "heads" ? "You go first" : "You go second")
    }, [])

    const endFlip = () => {
        setFlipping(false); setShowCards(true)
        if (flipResult === "heads") {
            setHand(["king", "villager", "villager", "villager", "villager"])
            setOpHand(["peasant", "villager", "villager", "villager", "villager"])
            setPlayerTurn("me"); setNextStarter("op")
        } else {
            setHand(["peasant", "villager", "villager", "villager", "villager"])
            setOpHand(["king", "villager", "villager", "villager", "villager"])
            setPlayerTurn("op"); setNextStarter("me")
        }
    }

    const playCard = (card: string, index: number) => {
        if (!canPlay || playerTurn !== "me" || roundInProgress) return
        setCanPlay(false); setRoundInProgress(true)
        setHand(p => p.filter((_, i) => i !== index))
        const last = playedPairs[playedPairs.length - 1]

        // bot already played (you’re second)
        if (last && last.op && !last.me) {
            const opCard = hiddenBotCard; if (!opCard) return
            setHiddenBotCard(null)
            setPlayedPairs(p => { const u = [...p]; u[u.length - 1] = { me: card, op: opCard }; return u })
            setTimeout(() => {
                const res = determineWinner(card as Card, opCard as Card)
                setRevealedRounds(p => [...p, p.length])
                if (res === "win" || res === "lose") setGameResult(res)
                else { setNextStarter(prev => prev === "me" ? "op" : "me"); setPlayerTurn(nextStarter) }
                setTimeout(() => { setCanPlay(true); setRoundInProgress(false) }, 800)
            }, 800)
            return
        }

        // you go first
        setPlayedPairs(p => [...p, { me: card, op: "" }])
        setTimeout(() => {
            const idx = Math.floor(Math.random() * opHand.length)
            const opCard = opHand[idx]
            setOpHand(p => p.filter((_, i) => i !== idx))
            setPlayedPairs(p => { const u = [...p]; u[u.length - 1] = { ...u[u.length - 1], op: opCard }; return u })
            setTimeout(() => {
                const res = determineWinner(card as Card, opCard as Card)
                setRevealedRounds(p => [...p, p.length])
                if (res === "win" || res === "lose") setGameResult(res)
                else { setNextStarter(prev => prev === "me" ? "op" : "me"); setPlayerTurn(nextStarter) }
                setTimeout(() => { setCanPlay(true); setRoundInProgress(false) }, 1000)
            }, 800)
        }, 800)
    }

    const s = StyleSheet.create({
        videoBox: { width: 300, height: 300, justifyContent: "center", alignItems: "center" },
        video: { width: "100%", height: "100%" },
        image: { flex: 1, alignItems: "center", justifyContent: "center" },
        out: { width: "85%", height: "85%", justifyContent: "center", alignItems: "center", backgroundColor: "rgb(61,61,61)" },
        in: { width: "98%", height: "97%", justifyContent: "center", alignItems: "center", backgroundColor: "black" },
        row: { position: "absolute", bottom: -20, flexDirection: "row", justifyContent: "center", alignItems: "center" },
        opRow: { position: "absolute", top: -20, flexDirection: "row", justifyContent: "center", alignItems: "center" }
    })

    const vid = flipResult === "heads" ? imgs.head : imgs.tail

    return (
        <ImageBackground source={imgs.moss} resizeMode="cover" style={[s.image, s.video]}>
            <View style={s.out}>
                <View style={s.in}>
                    {flipping && (
                        <View>
                            <View style={s.videoBox}>
                                {Platform.OS === "web" ? (
                                    <WebVideo key={Date.now()} source={{ uri: vid }} style={s.video} resizeMode="contain" repeat={false} controls={false} paused={false} onEnd={endFlip} />
                                ) : (
                                    <ExpoVideo source={{ uri: vid }} shouldPlay isMuted isLooping={false} useNativeControls={false} resizeMode={ResizeMode.CONTAIN} style={{ width: 300, height: 300 }} onPlaybackStatusUpdate={s => { if ('isLoaded' in s && s.isLoaded && s.didJustFinish) endFlip() }} />
                                )}
                            </View>
                            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>
                                <Text>{flipMessage}</Text>
                            </View>
                        </View>
                    )}
                    {playedPairs.length > 0 && (
                        <View style={{ position: "absolute", top: "30%", left: "27.3%", flexDirection: "row" }}>
                            {playedPairs.map((p, i) => {
                                const revealed = revealedRounds.includes(i)
                                return (
                                    <View key={i} style={{ marginLeft: i === 0 ? 0 : spacing, alignItems: "center" }}>
                                        {p.op ? (
                                            <Image source={revealed ? imgs[p.op as keyof typeof imgs] ?? imgs.villager : imgs.back} style={{ width: 90, height: 120, marginBottom: 10 }} />
                                        ) : (
                                            <View style={{ width: 90, height: 120, marginBottom: 10 }} />
                                        )}
                                        {p.me ? (
                                            <Image source={revealed ? imgs[p.me as keyof typeof imgs] ?? imgs.villager : imgs.back} style={{ width: 90, height: 120 }} />
                                        ) : i === playedPairs.length - 1 && p.op ? (
                                            <View style={{ width: 90, height: 120 }} />
                                        ) : (
                                            <View style={{ width: 90, height: 120 }} />
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
                        <View style={s.opRow}>{opHand.map((_, i) => <Image key={i} source={imgs.back} style={{ width: 90, height: 120 }} />)}</View>
                        <View style={s.row}>
                            {hand.map((c, i) => (
                                <Pressable key={i} disabled={!canPlay} onPress={() => playCard(c, i)} onHoverIn={() => setHoveredCard(i)} onHoverOut={() => setHoveredCard(null)} style={({ pressed }) => [{ marginHorizontal: 5, transform: [{ translateY: pressed || hoveredCard === i ? -10 : 0 }], shadowColor: "#fff", shadowOffset: { width: 0, height: 0 }, shadowOpacity: pressed || hoveredCard === i ? 1 : 0, shadowRadius: pressed || hoveredCard === i ? 20 : 0 }]}>
                                    <Image source={c === "king" ? imgs.king : c === "peasant" ? imgs.peasant : imgs.villager} style={{ width: 90, height: 120 }} />
                                </Pressable>
                            ))}
                        </View>
                    </>
                )}
            </View>
        </ImageBackground>
    )
}
