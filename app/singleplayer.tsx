import { Video as ExpoVideo, ResizeMode } from "expo-av";
import { useLayoutEffect, useState } from "react";
import { ImageBackground, Platform, StyleSheet, View } from "react-native";
import { Video as WebVideo } from "react-native-video";


export default function Singleplayer() {

    const [flipping, setFlipping] = useState(false);
    const [flipResult, setFlipResult] = useState('heads');
    const [flipMessage, setFlipMessage] = useState('');

    useLayoutEffect(() => {
        setFlipping(true);
        const num = Math.floor(Math.random() * 2);
        const result = num === 1 ? "Heads" : "Tails";
        const msg = num === 1 ? "You go first" : "You go second";
        setFlipResult(result);
        setFlipMessage(msg);
    }, []);

    const styles = StyleSheet.create({
        videoContainer: { width: 300, height: 300, justifyContent: "center", alignItems: "center" },
        video: { width: "100%", height: "100%" },
        image: { flex: 1, alignItems: "center", justifyContent: "center" },
        outBox: { width: "85%", height: "85%", justifyContent: "center", alignItems: "center", backgroundColor: "rgb(61, 61, 61)" },
        inBox: { width: "98%", height: "97%", justifyContent: "center", alignItems: "center", backgroundColor: "black" }
    });

    const videoUri = flipResult === "heads" ? "https://flip-video-host.vercel.app/Heads.mp4" : "https://flip-video-host.vercel.app/Tails.mp4";

    return (
        <ImageBackground source={require('../assets/images/mossWall.png')} resizeMode="cover" style={[styles.image, styles.video]}>
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
                                        onEnd={() => setFlipping(false)}
                                    />
                                ) : (
                                    <ExpoVideo
                                        source={{ uri: videoUri }}
                                        shouldPlay
                                        isMuted
                                        useNativeControls
                                        resizeMode={ResizeMode.CONTAIN}
                                        style={{ width: 300, height: 300 }}
                                    />
                                )}
                            </View>
                            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>{flipMessage}</View>
                        </View>
                    )}
                </View>
            </View>
        </ImageBackground>);
}