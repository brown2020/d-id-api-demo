import { findAudio } from "@/actions/findAudio";
import { getAudioList } from "@/actions/getAudioList";
import useProfileStore from "@/zustand/useProfileStore";
import { Voice } from "elevenlabs/api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

export const useAudio = () => {
  const profile = useProfileStore((state) => state.profile);

  // Use ref for loading state to avoid triggering re-renders
  const loadingRef = useRef(false);

  // Use a stable reference for an empty voice list to avoid triggering re-renders
  const emptyVoiceList = useRef<Voice[]>([]);

  // Only use state for the final, loaded voice list
  const [voiceList, setVoiceList] = useState<Voice[]>(emptyVoiceList.current);

  // Track refs for API status
  const hasAttemptedLoadRef = useRef(false);
  const hasApiKeyRef = useRef(false);
  const apiKeyRef = useRef(profile.elevenlabs_api_key);

  // Add debug logging
  useEffect(() => {
    console.log(
      "Profile in useAudio:",
      JSON.stringify({
        hasApiKey: !!profile.elevenlabs_api_key,
        apiKeyLength: profile.elevenlabs_api_key?.length || 0,
      })
    );
  }, [profile.elevenlabs_api_key]);

  // Provide a stable isFetching value
  const isFetching = useMemo(() => loadingRef.current, []);

  const findVoice = useCallback(
    async (voiceId: string) => {
      // Check if we have a valid API key
      if (!apiKeyRef.current) {
        // Only show toast if we're not in initial loading
        if (hasAttemptedLoadRef.current) {
          toast.error(
            "ElevenLabs API key is missing. Please add it in your profile."
          );
        }
        return { status: false };
      }

      // Check if voice list already has the voice
      const voice = voiceList.find((v) => v.voice_id === voiceId);
      if (voice) {
        return { status: true, voice };
      } else {
        loadingRef.current = true;
        try {
          const voice = await findAudio(apiKeyRef.current, voiceId);
          loadingRef.current = false;

          if (voice.status) {
            return { status: true, voice: voice.voice };
          }

          if ("error" in voice && voice.error) {
            // Only show toast if we're not in initial loading
            if (hasAttemptedLoadRef.current) {
              toast.error(voice.error);
            } else {
              console.warn("Voice error during initial load:", voice.error);
            }
          }

          return { status: false };
        } catch (error) {
          loadingRef.current = false;
          console.error("Error finding voice:", error);
          // Only show toast if we're not in initial loading
          if (hasAttemptedLoadRef.current) {
            toast.error("Failed to fetch voice details");
          }
          return { status: false };
        }
      }
    },
    [voiceList]
  );

  const loadAudioList = useCallback(async () => {
    // Check if API key exists
    if (!apiKeyRef.current) {
      console.log("No ElevenLabs API key found, skipping voice load");
      setVoiceList(emptyVoiceList.current);
      return;
    }

    // Don't reload if already loading
    if (loadingRef.current) {
      console.log("Already loading voices, skipping duplicate load");
      return;
    }

    try {
      console.log(
        "Loading audio list with key:",
        apiKeyRef.current ? "Key exists" : "No key"
      );
      loadingRef.current = true;
      hasAttemptedLoadRef.current = true;
      hasApiKeyRef.current = !!apiKeyRef.current;

      const audioList = await getAudioList(apiKeyRef.current);

      if ("error" in audioList && audioList.error) {
        console.error("Error fetching audio list:", audioList.error);
        // Only show toast error if this isn't the first load attempt
        if (hasAttemptedLoadRef.current && hasApiKeyRef.current) {
          toast.error(audioList.error);
        }
        // Use the empty ref to avoid triggering re-renders
        setVoiceList(emptyVoiceList.current);
      } else if (audioList.status && Array.isArray(audioList.voices)) {
        console.log(`Successfully loaded ${audioList.voices.length} voices`);
        // Only update state when we have actual voices
        setVoiceList(audioList.voices);
      } else {
        console.warn("Unexpected response from getAudioList:", audioList);
        // Use the empty ref to avoid triggering re-renders
        setVoiceList(emptyVoiceList.current);
      }
    } catch (error) {
      console.error("Error in loadAudioList:", error);
      // Use the empty ref to avoid triggering re-renders
      setVoiceList(emptyVoiceList.current);
    } finally {
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Update the ref when the API key changes
    const newApiKey = profile.elevenlabs_api_key;
    const apiKeyChanged = apiKeyRef.current !== newApiKey;

    if (apiKeyChanged) {
      console.log("API key changed, updating ref and reloading voices");
      apiKeyRef.current = newApiKey;

      // Only attempt to load voices if API key exists
      if (newApiKey) {
        hasApiKeyRef.current = true;
        loadAudioList();
      } else {
        hasApiKeyRef.current = false;
        // Clear voice list if API key is removed
        setVoiceList(emptyVoiceList.current);
      }
    } else if (!hasAttemptedLoadRef.current && newApiKey) {
      // Initial load with API key
      console.log("Initial load with API key present");
      loadAudioList();
    }
  }, [profile.elevenlabs_api_key, loadAudioList]);

  // Memoize the return values to prevent unnecessary re-renders
  return useMemo(
    () => ({
      audioList: voiceList,
      isFetching,
      findVoice,
      hasApiKey: hasApiKeyRef.current,
    }),
    [voiceList, isFetching, findVoice]
  );
};
