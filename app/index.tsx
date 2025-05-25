import { useRouter } from 'expo-router/build/hooks';
import { Button, View } from "react-native";

export default function HomeScr() {
  const router = useRouter();

  return (
    <View style={{flex: 1, justifyContent: "center", alignItems: "center",}}>
      <Button title="Singleplayer" onPress={() => router.push('/singleplayer')} />
    </View>
  );
}
