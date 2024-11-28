import { CanvasObjects } from "@/types/did";
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



export const getApiBaseUrl = () => process.env.NEXT_PUBLIC_API_BASE_URL ? process.env.NEXT_PUBLIC_API_BASE_URL : window.location.origin;
export const imageProxyUrl = (baseUrl: string, image: string) => `${baseUrl}/api/imageproxy/${image}`;
export const videoImageProxyUrl = (baseUrl: string, image: string) => `${baseUrl}/api/video-image-proxy/${encodeURIComponent(image)}`;
export const getWebhookUrl = (baseUrl: string, id: string, secret_token: string) => `${baseUrl}/api/video-generated/${id}?token=${secret_token}`;

export const checkCanvasObjectImageDomain = (fabricJSON: CanvasObjects) => {
    // If image url is from different domain, then replace it with proxy url
    const newOrigin = new URL(getApiBaseUrl());
    return fabricJSON.map((obj) => {
        if("src" in obj && obj.src){
            // Check src is valid url
            try {
                const srcUrl = new URL(obj.src);
                srcUrl.protocol = newOrigin.protocol;
                srcUrl.host = newOrigin.host;
                obj.src = srcUrl.toString()
                
            } catch (error) {
               console.log("srcUrl", error);
                
            }
        }
        return obj;
    });
}