import { Video as ExpoVideo, ResizeMode } from "expo-av";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, ImageBackground, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Video as WebVideo } from "react-native-video";


export default function Singleplayer() {

    const [flipping, setFlipping] = useState(false);
    const [flipResult, setFlipResult] = useState('heads');
    const [flipMessage, setFlipMessage] = useState('');
    const [showCards, setShowCards] = useState(false);
    const [hand, setHand] = useState<string[]>([]);
    const [opHand, setOpHand] = useState<string[]>([]);
    const [playedPairs, setPlayedPairs] = useState<{ me: string; op: string }[]>([]);
    const [revealedRounds, setRevealedRounds] = useState<number[]>([]);
    const [hoveredCard, setHoveredCard] = useState<number | null>(null);
    const [canPlay, setCanPlay] = useState(true);
    const [gameResult, setGameResult] = useState<"win" | "lose" | null>(null);
    const [playerTurn, setPlayerTurn] = useState<"me" | "op">("me");
    const [hiddenBotCard, setHiddenBotCard] = useState<string | null>(null);
    const [roundInProgress, setRoundInProgress] = useState(false);
    const [nextStarter, setNextStarter] = useState<"me" | "op">("me");

    const router = useRouter();

    const headImg = "https://flip-video-host.vercel.app/Heads.mp4"
    const tailImg = "https://flip-video-host.vercel.app/Tails.mp4"
    const kingImg = require('../assets/images/king.png');
    const peasantImg = require('../assets/images/peasant.png');
    const villagerImg = require('../assets/images/villager.png');
    const mossImg = require('../assets/images/mossWall.png');
    const backImg = require('../assets/images/back.png');

    const tableWidth = 400;
    const maxOffset = tableWidth * 0.33;
    const spacing = Math.min(maxOffset / (playedPairs.length - 1 || 1), 40);

    const beats: Record<string, string> = {
        king: "villager",
        villager: "peasant",
        peasant: "king",
    };

    const determineWinner = (playerCard: string, opponentCard: string) => {
        if (beats[playerCard] === opponentCard) return "win";
        else if (beats[opponentCard] === playerCard) return "lose";
        return "tie";
    };
    useEffect(() => {
        if (playerTurn === "op" && !gameResult && showCards && !flipping && !roundInProgress && opHand.length > 0) {
            setRoundInProgress(true);
            setCanPlay(false);

            setTimeout(() => {
                const randIndex = Math.floor(Math.random() * opHand.length);
                const opCard = opHand[randIndex];
                setOpHand((prev) => prev.filter((_, i) => i !== randIndex));

                const lastPair = playedPairs[playedPairs.length - 1];

                if (lastPair && lastPair.me !== "" && lastPair.op === "") { //player goes first
                    setPlayedPairs((prev) => {
                        const updated = [...prev];
                        updated[updated.length - 1] = { ...updated[updated.length - 1], op: opCard };
                        return updated;
                    });

                    setTimeout(() => {
                        const result = determineWinner(lastPair.me, opCard);
                        setRevealedRounds((prev) => [...prev, prev.length]);
                        if (result === "win" || result === "lose") setGameResult(result);
                        else setPlayerTurn("me");
                        setTimeout(() => {
                            setCanPlay(true);
                            setRoundInProgress(false);
                        }, 800);
                    }, 800);
                } else { //bot goes first
                    setHiddenBotCard(opCard);
                    setPlayedPairs((prev) => [...prev, { me: "", op: opCard }]);
                    setTimeout(() => {
                        setPlayerTurn("me");
                        setCanPlay(true);
                        setRoundInProgress(false);
                    }, 800);
                }
            }, 800);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playerTurn, gameResult, showCards, flipping, roundInProgress, opHand, playedPairs]);



    useEffect(() => {
        setFlipping(true);
        const num = Math.floor(Math.random() * 2);
        const result = num === 1 ? "heads" : "tails";
        const msg = num === 1 ? "You go first" : "You go second";
        setFlipResult(result);
        setFlipMessage(msg);
    }, []);

    const endFlip = () => {
        setFlipping(false);
        setShowCards(true);
        if (flipResult === "heads") {
            setHand(["king", "villager", "villager", "villager", "villager"]);
            setOpHand(["peasant", "villager", "villager", "villager", "villager"]);
            setPlayerTurn("me");
            setNextStarter("op");
        }
        else {
            setHand(["peasant", "villager", "villager", "villager", "villager"]);
            setOpHand(["king", "villager", "villager", "villager", "villager"]);
            setPlayerTurn("op");
            setNextStarter("me");
        }
    };

    const playCard = (card: string, index: number) => {
        if (!canPlay || playerTurn !== "me" || roundInProgress) return;
        setCanPlay(false);
        setRoundInProgress(true);
        setHand((prev) => prev.filter((_, i) => i !== index));

        const lastPair = playedPairs[playedPairs.length - 1];

        if (lastPair && lastPair.op !== "" && lastPair.me === "") {
            const opCard = hiddenBotCard;
            if (!opCard) {
                console.warn("Opponent card not ready yet.");
                return;
            }
            setHiddenBotCard(null);
            setPlayedPairs((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { me: card, op: opCard };
                return updated;
            });

            setTimeout(() => {
                const result = determineWinner(card, lastPair.op);
                setRevealedRounds((prev) => [...prev, prev.length]);
                if (result === "win" || result === "lose") setGameResult(result);
                
                else {
                    setNextStarter((prev) => (prev === "me" ? "op" : "me"));
                    setPlayerTurn(nextStarter);
                }

                setTimeout(() => {
                    setCanPlay(true);
                    setRoundInProgress(false);
                }, 800);
            }, 800);
        } else {
            setPlayedPairs((prev) => [...prev, { me: card, op: "" }]);
            setTimeout(() => {
                const randIndex = Math.floor(Math.random() * opHand.length);
                const opCard = opHand[randIndex];
                setOpHand((prev) => prev.filter((_, i) => i !== randIndex));

                setPlayedPairs((prev) => {
                    const updated = [...prev];
                    const lastIndex = updated.length - 1;
                    updated[lastIndex] = { ...updated[lastIndex], op: opCard };
                    return updated;
                });

                setTimeout(() => {
                    const result = determineWinner(card, opCard);
                    setRevealedRounds((prev) => [...prev, prev.length]);
                    if (result === "win" || result === "lose") setGameResult(result);
                    else {
                        setNextStarter((prev) => (prev === "me" ? "op" : "me"));
                        setPlayerTurn(nextStarter);
                    }

                    setTimeout(() => {
                        setCanPlay(true);
                        setRoundInProgress(false);
                    }, 1000);
                }, 800);
            }, 800);
        }
    };


    const styles = StyleSheet.create({
        videoContainer: { width: 300, height: 300, justifyContent: "center", alignItems: "center" },
        video: { width: "100%", height: "100%" },
        image: { flex: 1, alignItems: "center", justifyContent: "center" },
        outBox: { width: "85%", height: "85%", justifyContent: "center", alignItems: "center", backgroundColor: "rgb(61, 61, 61)" },
        inBox: { width: "98%", height: "97%", justifyContent: "center", alignItems: "center", backgroundColor: "black" },
        cardRow: { position: "absolute", bottom: -20, flexDirection: "row", justifyContent: "center", alignItems: "center", },
        opCardRow: { position: "absolute", top: -20, flexDirection: "row", justifyContent: "center", alignItems: "center", }
    });

    const videoUri = flipResult === "heads" ? headImg : tailImg;

    return (
        <ImageBackground source={mossImg} resizeMode="cover" style={[styles.image, styles.video]}>
            <View style={styles.outBox}>
                <View style={styles.inBox}>
                    {flipping && (
                        <View>
                            <View style={styles.videoContainer}>
                                {Platform.OS === "web" ? (
                                    <WebVideo
                                        key={Date.now()}
                                        source={{ uri: videoUri }}
                                        style={styles.video}
                                        resizeMode="contain"
                                        repeat={false}
                                        controls={false}
                                        paused={false}
                                        onEnd={endFlip}
                                    />
                                ) : (
                                    <ExpoVideo
                                        source={{ uri: videoUri }}
                                        shouldPlay
                                        isMuted
                                        isLooping={false}
                                        useNativeControls={false}
                                        resizeMode={ResizeMode.CONTAIN}
                                        style={{ width: 300, height: 300 }}
                                        onPlaybackStatusUpdate={(status) => { if ('isLoaded' in status && status.isLoaded && status.didJustFinish) endFlip() }}
                                    />
                                )}
                            </View>
                            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}> <Text>{flipMessage}</Text></View>
                        </View>
                    )}
                    {playedPairs.length > 0 && (
                        <View style={{ position: "absolute", top: "30%", left: "27.3%", flexDirection: "row" }}>
                            {playedPairs.map((pair, idx) => {
                                const revealed = revealedRounds.includes(idx);
                                return (
                                    <View key={idx} style={{ marginLeft: idx === 0 ? 0 : spacing, alignItems: "center" }}>
                                        {pair.op !== "" ? (
                                            <Image source={revealed ? pair.op === "king" ? kingImg : pair.op === "peasant" ? peasantImg : villagerImg : backImg}
                                                style={{ width: 90, height: 120, marginBottom: 10 }} />) :
                                            (<View style={{ width: 90, height: 120, marginBottom: 10 }} />)}
                                        {pair.me !== "" ? (
                                            <Image
                                                source={revealed ? pair.me === "king" ? kingImg : pair.me === "peasant" ? peasantImg : villagerImg : backImg}
                                                style={{ width: 90, height: 120 }}/> ) : 
                                                idx === playedPairs.length - 1 && pair.op !== "" ? 
                                        (<View style={{ width: 90, height: 120 }} />) : 
                                        (<View style={{ width: 90, height: 120 }} />)}
                                    </View>
                                );
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
                        <View style={styles.opCardRow}>
                            {opHand.map((_, index) => (
                                <Image key={index} source={backImg} style={{ width: 90, height: 120 }} />
                            ))}
                        </View>
                        <View style={styles.cardRow}>
                            {hand.map((card, index) => (
                                <Pressable
                                    key={index}
                                    disabled={!canPlay}
                                    onPress={() => playCard(card, index)}
                                    onHoverIn={() => setHoveredCard(index)}
                                    onHoverOut={() => setHoveredCard(null)}
                                    style={({ pressed }) => [
                                        {
                                            marginHorizontal: 5,
                                            transform: [{ translateY: pressed || hoveredCard === index ? -10 : 0 }],
                                            shadowColor: "#ffffff",
                                            shadowOffset: { width: 0, height: 0 },
                                            shadowOpacity: pressed || hoveredCard === index ? 1 : 0,
                                            shadowRadius: pressed || hoveredCard === index ? 20 : 0,
                                        },
                                    ]}
                                >
                                    <Image
                                        source={card === "king" ? kingImg : card === "peasant" ? peasantImg : villagerImg}
                                        style={{ width: 90, height: 120 }}
                                    />
                                </Pressable>
                            ))}
                        </View>
                    </>
                )}
            </View>
        </ImageBackground>);
}