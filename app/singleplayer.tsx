import { useLayoutEffect, useState } from "react";
import { ImageBackground, StyleSheet, View } from "react-native";
import { Box } from "react-native-ficus-ui";
import { Video } from "react-native-video";

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
        image: { flex: 1, alignItems: "center", justifyContent: "center" }
    });

    return (
        <ImageBackground source={require('../assets/images/mossWall.png')} resizeMode="cover" style={[styles.image, styles.video]}>
            <Box style={{ width: "85%", height: "85%", justifyContent: "center", alignItems: "center", backgroundColor: "rgb(61, 61, 61)"}}>
                <Box style={{ width: "98%", height: "97%", justifyContent: "center", alignItems: "center", backgroundColor: "black"}}>
                    {flipping && (
                        <Box>
                            <View style={styles.videoContainer}>
                                <Video
                                    source={{ uri: `assets/videos/${flipResult}.mp4` }}
                                    style={styles.video}
                                    resizeMode="contain"
                                    repeat={false}
                                    onEnd={() => setFlipping(false)}
                                />
                            </View>
                            <Box style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>{flipMessage}</Box>
                        </Box>
                    )}
                </Box>
            </Box>
        </ImageBackground>);
}