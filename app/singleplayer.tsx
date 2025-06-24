import { ResizeMode, Video } from "expo-av";
import { useLayoutEffect, useState } from "react";
import { ImageBackground, StyleSheet, View } from "react-native";


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
    },[]);

    const styles = StyleSheet.create({
        videoContainer: { width: 300, height: 300, justifyContent: "center", alignItems: "center" },
        video: { width: "100%", height: "100%" },
        image: { flex: 1, alignItems: "center", justifyContent: "center" },
        outBox: { width: "85%", height: "85%", justifyContent: "center", alignItems: "center", backgroundColor: "rgb(61, 61, 61)"},
        inBox: { width: "98%", height: "97%", justifyContent: "center", alignItems: "center", backgroundColor: "black"}
    });

    const videoSource = flipResult === 'heads' ? require('../assets/videos/Heads.mp4') : require('../assets/videos/Tails.mp4');

    return (
        <ImageBackground source={require('../assets/images/mossWall.png')} resizeMode="cover" style={[styles.image, styles.video]}>
            <View style={styles.outBox}>
                <View style={styles.inBox}>
                    {flipping && (
                        <View>
                            <View style={styles.videoContainer}>
                                <Video
                                    source={videoSource}
                                    style={styles.video}
                                    resizeMode={ResizeMode.CONTAIN}
                                    shouldPlay
                                    isLooping={false}
                                    onPlaybackStatusUpdate={status => {console.log("Video status:", status); if (status.isLoaded && status.didJustFinish) setFlipping(false);}}
                                    useNativeControls={false}
                                />
                            </View>
                            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>{flipMessage}</View>
                        </View>
                    )}
                </View>
            </View>
        </ImageBackground>);
}