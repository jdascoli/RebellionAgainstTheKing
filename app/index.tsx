import { useRouter } from "expo-router/build/hooks";
import { ImageBackground, Pressable, Text, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ImageBackground source={require(`../assets/images/mossWall.png`)} style={{flex: 1, justifyContent: "center", alignItems: "center",  width: "100%", height: "100%"}}>
      <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
        <Pressable onPress={() => router.push("/singleplayer")}style={{ backgroundColor: "rgb(8, 44, 11)", paddingVertical: 20, paddingHorizontal: 40, borderRadius: 10,}}>
        <Text style={{ fontSize: 24, color: "white", fontWeight: "bold" }}>Singleplayer</Text>
      </Pressable>
      </View>
    </ImageBackground>
  );
}
