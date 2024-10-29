import { findAudio } from "@/actions/findAudio";
import { getAudioList } from "@/actions/getAudioList";
import useProfileStore from "@/zustand/useProfileStore";
import { Voice } from "elevenlabs/api";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export const useAudio = () => {
    const profile = useProfileStore((state) => state.profile);

    const [voiceList, setVoiceList] = useState<Voice[]>([]);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        if (profile.elevenlabs_api_key !== null)
            loadAudioList()
    }, [profile])

    const findVoice = async (voiceId: string) => {
        // Check voice list already have voice
        // If not, then fetch voice 
        const voice = voiceList.find((v) => v.voice_id === voiceId);
        if (voice) { return { status: true, voice }; }
        else {
            setIsFetching(true);
            const voice = await findAudio(profile.elevenlabs_api_key, voiceId)
            if (voice.status) {
                return { status: true, voice: voice.voice }
            }
            if ("error" in voice && voice.error) {
                toast.error(voice.error);
            } else {

            }

            setIsFetching(false);
        }

        return { status: false }
    }

    const loadAudioList = async () => {
        if (profile.elevenlabs_api_key !== null) {
            setIsFetching(true);
            const audioList = await getAudioList(profile.elevenlabs_api_key);
            setIsFetching(false);
            if ("error" in audioList && audioList.error) {
                console.error("Error fetching audio list: ", audioList.error);
                toast.error(audioList.error);
                return;
            }

            if (audioList.status && Array.isArray(audioList.voices)) {
                setVoiceList(audioList.voices);
            } else {
                setVoiceList([]);
            }

        }
    }


    return {
        audioList: voiceList,
        isFetching,
        findVoice
    }
}