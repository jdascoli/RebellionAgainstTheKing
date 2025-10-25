import AsyncStorage from '@react-native-async-storage/async-storage';

export type Card = "king" | "villager" | "peasant"

interface PlayerMemory {
    positions: { king: number[]; peasant: number[] }
    counts: { first: Record<string, number>; second: Record<string, number> }
}

// --- Load / Save Memory ---
async function loadMemory(): Promise<PlayerMemory> {
    const raw = await AsyncStorage.getItem("playerMemory")
    if (raw) return JSON.parse(raw)
    return { positions: { king: [], peasant: [] }, counts: { first: {}, second: {} } }
}

async function saveMemory(mem: PlayerMemory) {
    await AsyncStorage.setItem("playerMemory", JSON.stringify(mem))
}

// --- Record a move ---
export async function recordPlayerMove(position: "first" | "second", card: Card, index?: number) {
    try {
        const data = await loadMemory()
        // update frequency counts
        data.counts[position][card] = (data.counts[position][card] || 0) + 1
        // update positional tendencies
        if ((card === "king" || card === "peasant") && typeof index === "number") {
            data.positions[card].push(index)
            if (data.positions[card].length > 50) data.positions[card].shift() // cap memory length
        }
        await saveMemory(data)
    } catch (err) {
        console.warn("Failed to record player move:", err)
    }
}

// --- Choose card adaptively ---
export async function chooseAdaptiveBotCard(
    hand: Card[],
    position: "first" | "second",
    playerRole: "king" | "peasant"
): Promise<{ card: Card; slot?: number }> {
    try {
        const data = await loadMemory()

        // calculate average slot tendencies
        const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null
        const avgKingSlot = avg(data.positions.king)
        const avgPeasantSlot = avg(data.positions.peasant)

        // default random pick
        let chosen: Card = hand[Math.floor(Math.random() * hand.length)]
        let slot: number | undefined

        if (playerRole === "king") {
            // Player tends to place King in a certain slot — counter with Peasant there
            if (avgKingSlot !== null && hand.includes("peasant")) {
                chosen = "peasant"
                slot = Math.round(avgKingSlot)
            }
        } else if (playerRole === "peasant") {
            // Player tends to place Peasant in a slot — avoid placing King there
            if (avgPeasantSlot !== null && hand.includes("king")) {
                const avoid = Math.round(avgPeasantSlot)
                // pick king but in a different slot if possible
                slot = (avoid + 2) % hand.length // simple offset
                chosen = "king"
            }
        }

        return { card: chosen, slot }
    } catch (err) {
        console.warn("Failed to choose adaptive card:", err)
        return { card: hand[Math.floor(Math.random() * hand.length)] }
    }
}

// --- Reset memory ---
export async function resetMemory() {
    await AsyncStorage.removeItem("playerMemory")
}
