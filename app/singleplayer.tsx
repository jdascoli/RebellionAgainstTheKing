import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Box, HStack, Image, Pressable } from "react-native-ficus-ui";
import Video from 'react-native-video';

export default function Singleplayer() {

    const [coin, setCoin] = useState('heads');
    const [flipping, setFlipping] = useState(false);

    const Flip = () => {
        setFlipping(true);
        const num = Math.floor(Math.random() * 2);
        if (num === 1) {
            console.log("heads");
            if (coin === "heads") console.log("you go first");
            else console.log("you go second");
        }
        else {
            console.log("tails");
            if (coin === "tails") console.log("you go first");
            else console.log("you go second");
        }
    }

    const styles = StyleSheet.create({
        videoContainer: {
            width: 300,
            height: 300,
            justifyContent: "center",
            alignItems: "center"
        },
        video: {
            width: "100%",
            height: "100%"
        }
    });

    return (
        <Box style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            {flipping && (
                <View style={styles.videoContainer}>
                    <Video
                        source={require('../assets/videos/Heads.mp4')}
                        style={styles.video}
                        resizeMode="contain"
                        repeat={false}
                        onEnd={() => setFlipping(false)}
                    />
                </View>
            )}
            <HStack>
                <Pressable bg="black" borderRadius="xl" onPress={() => { console.log("You pressed heads"); setCoin("heads"); Flip(); }}>
                    <Image h={180} w={180} source={require('../assets/images/head.png')} />
                </Pressable>
                <Pressable bg="black" borderRadius="xl" onPress={() => { console.log("You pressed tails"); setCoin("tails"); Flip(); }}>
                    <Image h={180} w={180} source={require('../assets/images/tails.png')} />
                </Pressable>
            </HStack>
        </Box>);
}