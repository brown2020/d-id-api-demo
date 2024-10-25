import { AUDIO_LIST } from "./constants";

export function getAudioDetails(audio_id: string) {
    return AUDIO_LIST.find((audio) => audio.voice_id === audio_id);
}

export function randomString(n: number) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < n; i++) {
        token += chars[Math.floor(Math.random() * chars.length)];
    }
    return token;
}

export const getApiBaseUrl = () => process.env.NEXT_PUBLIC_IS_LOCAL == "1" ? process.env.NEXT_PUBLIC_API_BASE_URL : window.location.origin;