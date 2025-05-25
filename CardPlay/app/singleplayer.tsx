import { useState } from "react";
import { Pressable, HStack, Image, Box } from "react-native-ficus-ui";

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

    return (
        <Box style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            {flipping ? (<video width="640" height="360" controls><source src='../assets/videos/Heads.png' type="video/mp4" /></video>) : null}
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