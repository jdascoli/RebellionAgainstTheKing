import { Video as ExpoVideo, ResizeMode } from "expo-av";
import { useLayoutEffect, useState } from "react";
import { Image, ImageBackground, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Video as WebVideo } from "react-native-video";


export default function Singleplayer() {

    const [flipping, setFlipping] = useState(false);
    const [flipResult, setFlipResult] = useState('heads');
    const [flipMessage, setFlipMessage] = useState('');
    const [showCards, setShowCards] = useState(false);
    const [hand, setHand] = useState<string[]>([]);
    const [playedCard, setPlayedCard] = useState<string | null>(null);
    const [hoveredCard, setHoveredCard] = useState<number | null>(null);

    const headImg = "https://flip-video-host.vercel.app/Heads.mp4"
    const tailImg = "https://flip-video-host.vercel.app/Tails.mp4"
    const kingImg = require('../assets/images/king.png');
    const peasantImg = require('../assets/images/peasant.png');
    const villagerImg = require('../assets/images/villager.png');
    const mossImg = require('../assets/images/mossWall.png');
    const back = require('../assets/images/back.png');

    useLayoutEffect(() => {
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
        if (flipResult === "heads") setHand(["king", "villager", "villager", "villager", "villager"]);
        else setHand(["peasant", "villager", "villager", "villager", "villager"]);
    };

    const styles = StyleSheet.create({
        videoContainer: { width: 300, height: 300, justifyContent: "center", alignItems: "center" },
        video: { width: "100%", height: "100%" },
        image: { flex: 1, alignItems: "center", justifyContent: "center" },
        outBox: { width: "85%", height: "85%", justifyContent: "center", alignItems: "center", backgroundColor: "rgb(61, 61, 61)" },
        inBox: { width: "98%", height: "97%", justifyContent: "center", alignItems: "center", backgroundColor: "black" },
        cardRow: { position: "absolute", bottom: -20, left: 0, right: 0, flexDirection: "row", justifyContent: "center", alignItems: "center",},
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
                                        useNativeControls
                                        resizeMode={ResizeMode.CONTAIN}
                                        style={{ width: 300, height: 300 }}
                                        onPlaybackStatusUpdate={(status) => {if ('isLoaded' in status && status.isLoaded && status.didJustFinish) setFlipping(false);}}
                                    />
                                )}
                            </View>
                            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}> <Text>{flipMessage}</Text></View>
                        </View>
                    )}
                </View>
                {showCards && (
                    <View style={styles.cardRow}>
                        {hand.map((card, index) => (
                            <Pressable 
                                key={index} 
                                onPress={() => {
                                    setPlayedCard(card);
                                    setHand((prev) => prev.filter((_, i) => i !== index));
                                }}
                                onHoverIn={() => setHoveredCard(index)}
                                onHoverOut={() => setHoveredCard(null)}
                                style={({ pressed }) => [
                                            {
                                                marginHorizontal: 5,
                                                transform: [{translateY: pressed || hoveredCard === index ? -10 : 0,},],
                                                shadowColor: "#ffffff",
                                                shadowOffset: { width: 0, height: 0 },
                                                shadowOpacity: pressed || hoveredCard === index ? 1 : 0,
                                                shadowRadius:pressed || hoveredCard === index ? 20 : 0,
                                            },
                                        ]}
                            >
                                <Image source={card === 'king' ? kingImg : (card === 'peasant'? peasantImg : villagerImg)} style={{ width: 90, height: 120 }}/>        
                            </Pressable>
                        ))}
                    </View>
                )}
            </View>
        </ImageBackground>);
}