"use client";
import { getFileUrl } from "@/actions/getFileUrl";
import { db, storage } from "@/firebase/firebaseClient";
import { DEFAULT_AUDIO, DOCUMENT_COLLECTION } from "@/libs/constants";
import { AvatarValues, DIDTalkingPhoto } from "@/types/did";
import { resizeImage } from "@/utils/resizeImage";
import { useAuthStore } from "@/zustand/useAuthStore";
import { ErrorMessage } from "@hookform/error-message";
import { deleteDoc, doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import { Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { Controller, useForm } from "react-hook-form";
import Select, { components, ControlProps } from "react-select";
import CustomAudioOption from "./CustomAudioOption";
import { useAudio } from "@/hooks/useAudio";
import { ElevenLabs } from "@elevenlabs/elevenlabs-js";
import CustomAudioOption2 from "./CustomAudioOption2";
import { createDIDAvatarProfile } from "@/actions/createDIDAvatarProfile";
import useProfileStore from "@/zustand/useProfileStore";

export default function AvatarForm({
  submit,
  create,
  avatarDetail,
}: {
  create: boolean;
  submit: (val: { status: boolean; data: AvatarValues | null }) => void;
  avatarDetail: DIDTalkingPhoto | null;
}) {
  const { handleSubmit, control, formState, reset, watch, setValue } =
    useForm<AvatarValues>({ mode: "all" });
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const { audioList: options, isFetching: fetchingAudio } = useAudio();
  const profile = useProfileStore((state) => state.profile);
  const [errorMessage, setErrorMessage] = useState("");

  const onSubmit = handleSubmit(async (data) => {
    setProcessing(true);
    setErrorMessage("");

    try {
      // First step is same: upload image
      // But we also need D-ID API key for validation
      const d_id_api_key = profile.did_api_key;

      if (!d_id_api_key) {
        setErrorMessage(
          "D-ID API key is missing. Please add it in your profile settings."
        );
        setProcessing(false);
        return;
      }

      // Check if we have a preview image
      if (!data.preview_image_url) {
        setErrorMessage("Please upload an image for your avatar.");
        setProcessing(false);
        return;
      }

      // Validate the avatar with D-ID API
      const avatarResponse = await createDIDAvatarProfile(
        d_id_api_key,
        data.name,
        data.preview_image_url,
        data.voiceId,
        data.talking_photo_id,
        uid
      );

      if (!avatarResponse.status) {
        setErrorMessage(avatarResponse.error);
        setProcessing(false);
        return;
      }

      // Now save to Firestore (the avatar already has the D-ID presenter_id)
      const docRef = doc(db, "didTalkingPhotos", data.talking_photo_id);

      await setDoc(docRef, avatarResponse.avatar, { merge: true });

      // Success! Close the form
      setProcessing(false);
      submit({ status: true, data });
    } catch (error) {
      console.error("Error creating avatar:", error);
      setErrorMessage("Failed to create avatar. Please try again.");
      setProcessing(false);
    }
  });

  const [processing, setProcessing] = useState<boolean>(false);
  const [avatarId, setAvatarId] = useState<string>("");
  const uid = useAuthStore((state) => state.uid);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);

    const file = e.dataTransfer.files[0];
    setLoading(true);
    setProcessing(true);
    const id = avatarId;

    try {
      // Resize the image before uploading
      const resizedImage = await resizeImage(file);
      const filePath = `images/${uid}/${id}/${file.name}`;
      const storageRef = ref(storage, filePath);

      await uploadBytes(storageRef, resizedImage);
      const url = await getFileUrl(filePath);
      setValue("preview_image_url", url);
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setLoading(false);
      setProcessing(false);
    }
  };

  useEffect(() => {
    // Skip if still fetching audio to prevent form reset during initial load
    if (fetchingAudio) return;

    if (create) {
      if (!avatarId || !avatarId.startsWith("new-")) {
        const _avatarId = `new-${Date.now()}`;
        reset({
          voiceId: DEFAULT_AUDIO || "",
          name: "",
          preview_image_url: "",
          talking_photo_id: _avatarId,
        });
        setAvatarId(_avatarId);
      }
    } else if (avatarDetail !== null) {
      if (avatarId !== avatarDetail.talking_photo_id) {
        reset({
          voiceId: avatarDetail.voiceId || "",
          name: avatarDetail.talking_photo_name || "",
          preview_image_url: avatarDetail.preview_image_url || "",
          talking_photo_id: avatarDetail.talking_photo_id || "",
        });
        setAvatarId(avatarDetail.talking_photo_id);
      }
    }
  }, [create, avatarDetail, reset, avatarId, fetchingAudio]);

  const voiceId = watch("voiceId") || "";
  const previewImageUrl = watch("preview_image_url") || "";

  // Add these refs to prevent re-renders
  const previousFetchingState = useRef(fetchingAudio);
  const initialLoad = useRef(true);

  // Add a state variable to store memoized options
  const [stableOptions, setStableOptions] = useState<ElevenLabs.Voice[]>([]);

  // Update our approach to voice options memoization
  useEffect(() => {
    // Skip the effect on first render to avoid re-render loop
    if (initialLoad.current) {
      initialLoad.current = false;
      return;
    }

    // Only update if fetchingAudio transitions from true to false
    // This prevents re-renders during the loading process
    if (previousFetchingState.current && !fetchingAudio) {
      previousFetchingState.current = fetchingAudio;
      // Update stable options once loading is complete
      setStableOptions(options);
    } else {
      previousFetchingState.current = fetchingAudio;
    }
  }, [fetchingAudio, options]);

  // Update our lookups to use stable options if available, otherwise use original options
  const voiceDetail = useMemo(() => {
    const optionsToUse = stableOptions.length > 0 ? stableOptions : options;
    return optionsToUse.find((audio) => audio.voiceId === voiceId);
  }, [voiceId, options, stableOptions]);

  const voiceValue = useMemo(() => {
    const optionsToUse = stableOptions.length > 0 ? stableOptions : options;
    return optionsToUse.find((option) => option.voiceId === voiceId);
  }, [voiceId, options, stableOptions]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const id = avatarId;

      // Resize the image before uploading
      const resizedImage = await resizeImage(file);
      const filePath = `images/${uid}/${id}/${file.name}`;
      const storageRef = ref(storage, filePath);

      await uploadBytes(storageRef, resizedImage);
      const url = await getFileUrl(filePath);

      setValue("preview_image_url", url);
    }
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const cancelEdit = useCallback(() => {
    submit({ status: false, data: null });
  }, [submit]);

  const deleteAvatar = useCallback(async () => {
    try {
      const docRef = doc(db, DOCUMENT_COLLECTION, avatarId);
      await deleteDoc(docRef);
      submit({ status: true, data: null });
    } catch (e) {
      console.log(e);
    }
  }, [avatarId, submit]);

  // Replace formElements memoization with more optimized version by adding a check for loading state
  const formElements = useMemo(() => {
    // During initial loading, use an empty or minimal UI to avoid re-renders
    if (initialLoad.current && fetchingAudio) {
      return (
        <form>
          <div className="bg-white">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-xl font-semibold leading-6 text-gray-900">
                  {create ? "Create" : "Edit"} Avatar
                </h3>
                <div className="w-full mt-4 mb-5">
                  <label className="block mb-2 text-sm text-slate-600">
                    Loading...
                  </label>
                  <div className="flex items-center space-x-2 text-slate-500">
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-slate-500 animate-spin"></div>
                    <span>Loading form data...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      );
    }

    // Regular form for when data is loaded
    return (
      <form onSubmit={onSubmit}>
        <div className="bg-white">
          <div className="sm:flex sm:items-start">
            <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left">
              <h3
                className="text-xl font-semibold leading-6 text-gray-900"
                id="modal-title"
              >
                {create ? "Create" : "Edit"} Avatar
              </h3>
              <div className="w-full mt-4 mb-5">
                <label className="block mb-2 text-sm text-slate-600">
                  Avatar Name
                </label>
                <Controller
                  control={control}
                  name="name"
                  defaultValue=""
                  rules={{
                    required: { message: "Required.", value: true },
                    minLength: { value: 3, message: "Too short name." },
                    maxLength: { value: 50, message: "Too long name." },
                  }}
                  render={({ field }) => (
                    <input
                      {...field}
                      value={field.value || ""}
                      className="w-full bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-200 rounded-md px-3 py-2 transition duration-300 ease focus:outline-hidden focus:border-slate-400 hover:border-slate-300 shadow-xs focus:shadow-sm"
                      placeholder="Type name..."
                    />
                  )}
                />
                <p className="text-red-500 text-sm">
                  <ErrorMessage errors={formState.errors} name="name" />
                </p>
                {errorMessage && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-sm text-sm text-red-600">
                    {errorMessage}
                  </div>
                )}
              </div>

              <div className="w-full mt-4 mb-5">
                <label className="block mb-2 text-sm text-slate-600">
                  Audio
                </label>
                <Controller
                  control={control}
                  name="voiceId"
                  defaultValue=""
                  render={({ field }) =>
                    fetchingAudio ? (
                      <div className="flex items-center space-x-2 text-slate-500">
                        <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-slate-500 animate-spin"></div>
                        <span>Loading voices...</span>
                      </div>
                    ) : !options.length ? (
                      <div className="py-2 px-3 border border-amber-200 bg-amber-50 rounded-sm text-sm text-amber-700">
                        <p>
                          No voices found. Please ensure you have added your
                          ElevenLabs API key in your profile.
                        </p>
                        <p className="mt-1">
                          <a
                            href="/profile"
                            className="text-blue-600 underline"
                          >
                            Go to Profile Settings
                          </a>
                        </p>
                      </div>
                    ) : (
                      <Select
                        value={voiceValue || null}
                        onChange={(e) => {
                          setValue("voiceId", (e as ElevenLabs.Voice)?.voiceId || "");
                          field.onBlur();
                        }}
                        options={options}
                        components={{
                          Option: CustomAudioOption,
                          Control: ({
                            children,
                            ...props
                          }: ControlProps<ElevenLabs.Voice, false>) => {
                            return (
                              <components.Control {...props}>
                                {voiceValue ? (
                                  <CustomAudioOption2 data={voiceValue} />
                                ) : (
                                  <></>
                                )}
                                {children}
                              </components.Control>
                            );
                          },
                        }}
                      />
                    )
                  }
                />

                {voiceDetail ? (
                  <audio controls key={voiceDetail.voiceId} className="mt-2">
                    <source src={voiceDetail.previewUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                ) : (
                  <Fragment />
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 sm:flex sm:flex-row-reverse">
          <button
            type="submit"
            disabled={processing}
            className="disabled:cursor-not-allowed disabled:opacity-50 inline-flex w-full justify-center rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-sky-500 sm:ml-3 sm:w-auto"
          >
            {create ? "Add" : "Update"}
          </button>
          <button
            disabled={processing}
            onClick={cancelEdit}
            type="button"
            className="disabled:cursor-not-allowed disabled:opacity-50 mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
          >
            Cancel
          </button>
          {!create && (
            <button
              disabled={processing}
              onClick={deleteAvatar}
              type="button"
              className="sm:mr-3 disabled:cursor-not-allowed disabled:opacity-50 mt-3 inline-flex bg-red-600 w-full justify-center rounded-md  px-3 py-2 text-sm font-semibold shadow-xs ring-1 ring-inset ring-gray-300 text-white hover:bg-red-400 sm:mt-0 sm:w-auto"
            >
              Delete
            </button>
          )}
        </div>
      </form>
    );
  }, [
    create,
    control,
    formState.errors,
    onSubmit,
    cancelEdit,
    deleteAvatar,
    processing,
    options,
    fetchingAudio,
    voiceValue,
    voiceDetail,
    setValue,
    errorMessage,
    initialLoad,
  ]);

  return (
    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
      <div className="relative transform px-4 pb-4 pt-5 sm:p-4 sm:pb-4 rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-xl">
        <div className="grid grid-cols-3">
          <div className="relative">
            <div className="relative h-full w-full bg-white rounded-md border border-dashed border-gray-400">
              <div
                className={`${!previewImageUrl && "hidden"}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {previewImageUrl && previewImageUrl.trim() !== "" ? (
                  <Image
                    src={previewImageUrl}
                    alt="Avatar Image"
                    width={512}
                    height={512}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : null}
                <button
                  onClick={() => {
                    if (fileInputRef.current) fileInputRef.current.click();
                  }}
                  className="absolute bg-white text-gray-500 p-2 rounded-full bottom-3 right-3 shadow-lg"
                >
                  <ImageIcon size={20} />
                </button>
              </div>
              <label
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex text-center p-2 h-full ${
                  previewImageUrl && "hidden"
                }`}
                htmlFor="avatar_image"
              >
                <input
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  type="file"
                  id="avatar_image"
                  name="avatar_image"
                  className="hidden"
                />
                <div className="self-center">
                  <ImageIcon size={45} className="text-gray-500 m-auto" />
                  <p className="text-xs">Drop your image here, or Browse</p>
                </div>
              </label>
            </div>
            {loading && (
              <div className="backdrop-blur-xs absolute border top-0 h-full w-full rounded-md border-dashed border-gray-400 z-20 flex items-center justify-center">
                <div
                  className="w-12 h-12 rounded-full animate-spin
                    border-2 border-white border-dashed border-t-transparent"
                ></div>
              </div>
            )}
            {dragging && (
              <div className="bg-black opacity-40 absolute border top-0 h-full w-full rounded-md border-dashed border-gray-400 z-20 flex items-center justify-center"></div>
            )}
          </div>
          <div className="col-span-2">{formElements}</div>
        </div>
      </div>
    </div>
  );
}
