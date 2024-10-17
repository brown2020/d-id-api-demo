import { AUDIO_LIST } from "./constants";

export function getAudioDetails(audio_id: string) {
    return AUDIO_LIST.find((audio) => audio.voice_id === audio_id);
}