"use server";
import { ElevenLabsClient } from 'elevenlabs';
export async function getAudioList(elevenlabs_api_key: string) {
    try {
        const elevenlabs = new ElevenLabsClient({
            apiKey: elevenlabs_api_key // Defaults to process.env.ELEVENLABS_API_KEY
        })

        const voices = await elevenlabs.voices.getAll();
        return { status: true, voices: voices.voices };
    } catch (error) {
        console.log("Error on fetch audio list: ", error);

        return { error: "Something went wrong." };
    }
}