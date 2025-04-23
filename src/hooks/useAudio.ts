import { findAudio } from "@/actions/findAudio";
import { getAudioList } from "@/actions/getAudioList";
import useProfileStore from "@/zustand/useProfileStore";
import { Voice } from "elevenlabs/api";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

export const useAudio = () => {
  const profile = useProfileStore((state) => state.profile);
  const [voiceList, setVoiceList] = useState<Voice[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  const findVoice = async (voiceId: string) => {
    // Check if we have a valid API key
    if (!profile.elevenlabs_api_key) {
      toast.error(
        "ElevenLabs API key is missing. Please add it in your profile."
      );
      return { status: false };
    }

    // Check if voice list already has the voice
    const voice = voiceList.find((v) => v.voice_id === voiceId);
    if (voice) {
      return { status: true, voice };
    } else {
      setIsFetching(true);
      try {
        const voice = await findAudio(profile.elevenlabs_api_key, voiceId);
        setIsFetching(false);

        if (voice.status) {
          return { status: true, voice: voice.voice };
        }

        if ("error" in voice && voice.error) {
          toast.error(voice.error);
        }

        return { status: false };
      } catch (error) {
        setIsFetching(false);
        console.error("Error finding voice:", error);
        toast.error("Failed to fetch voice details");
        return { status: false };
      }
    }
  };

  const loadAudioList = useCallback(async () => {
    // Only attempt if there's an API key and we're not already fetching
    if (!profile.elevenlabs_api_key || isFetching) {
      return;
    }

    try {
      setIsFetching(true);
      setHasAttemptedLoad(true);
      setHasApiKey(!!profile.elevenlabs_api_key);

      const audioList = await getAudioList(profile.elevenlabs_api_key);

      if ("error" in audioList && audioList.error) {
        console.error("Error fetching audio list:", audioList.error);
        // Only show toast error if this isn't the first load attempt
        // This prevents showing errors on initial page load when API key might not be ready
        if (hasAttemptedLoad && hasApiKey) {
          toast.error(audioList.error);
        }
        setVoiceList([]);
      } else if (audioList.status && Array.isArray(audioList.voices)) {
        setVoiceList(audioList.voices);
      } else {
        setVoiceList([]);
      }
    } catch (error) {
      console.error("Error in loadAudioList:", error);
      setVoiceList([]);
    } finally {
      setIsFetching(false);
    }
  }, [profile.elevenlabs_api_key, isFetching, hasAttemptedLoad, hasApiKey]);

  useEffect(() => {
    // Only attempt to load voices if API key exists and has loaded
    if (profile.elevenlabs_api_key) {
      setHasApiKey(true);
      loadAudioList();
    } else {
      setHasApiKey(false);
    }
  }, [profile.elevenlabs_api_key, loadAudioList]);

  return {
    audioList: voiceList,
    isFetching,
    findVoice,
    hasApiKey: hasApiKey,
  };
};
