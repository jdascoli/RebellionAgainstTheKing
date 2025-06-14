import { useLayoutEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Box } from "react-native-ficus-ui";
import Video from 'react-native-video';

export default function Singleplayer() {

    const [coin, setCoin] = useState('heads');
    const [flipping, setFlipping] = useState(false);
    const [flipResult, setFlipResult] = useState('heads');
    const [flipMessage, setFlipMessage] = useState('');

    useLayoutEffect(() => {
        setFlipping(true);
        const num = Math.floor(Math.random() * 2);
        const result = num === 1 ? 'Heads' : 'Tails';
        setFlipResult(result);
        if (num === 1) {
            if (coin === "heads") setFlipMessage("You go first");
            else setFlipMessage("You go second");
        }
        else {
            if (coin === "tails") setFlipMessage("You go first");
            else setFlipMessage("You go second");
        }
    },[coin]);

    const styles = StyleSheet.create({
        videoContainer: { width: 300, height: 300, justifyContent: "center", alignItems: "center" },
        video: { width: "100%", height: "100%" }
    });

    return (
        <Box style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "black" }}>
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
        </Box>);
}