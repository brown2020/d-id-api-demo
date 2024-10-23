"use client";

import { db } from "@/firebase/firebaseClient";
import { AVATAR_TYPE_TEMPLATE } from "@/libs/constants";
import { DIDTalkingPhoto, Emotion, Movement } from "@/types/did";
import { useAuthStore } from "@/zustand/useAuthStore";
import { collection, onSnapshot, or, query, where } from "firebase/firestore";
import { Captions, Meh, Smile, UserRound, Video } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { getApiBaseUrl, getAudioDetails } from "@/libs/utils";
import { Controller, useForm } from "react-hook-form";
import SuprisedIcon from "@/assets/icons/suprised-emoji.svg";
import CustomAudioOption from "../CustomAudioOption";
import { generateVideo } from "@/actions/generateVideo";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import useProfileStore from "@/zustand/useProfileStore";

const steps = [
    {
        icon: UserRound,
        title: "Select Avatar",
        code: 'select-avatar'
    },
    {
        icon: Captions,
        title: "Write Script",
        code: 'write-script'
    },
]

const movements: { code: Movement, label: string, icon: any }[] = [
    {
        code: 'neutral',
        label: 'Neutral',
        icon: Video
    },
    {
        code: 'lively',
        label: 'Lively',
        icon: Video
    }
]
const emotions: { code: Emotion, label: string, icon: any }[] = [
    {
        'code': "neutral",
        'label': 'Neutral',
        'icon': Meh
    },
    {
        'code': 'happy',
        'label': 'Happy',
        'icon': Smile
    },
    {
        'code': 'surprise',
        'label': 'Surprise',
        'icon': <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" strokeLinejoin="round" stroke-width="1.5"><path d="M12 17a2 2 0 1 1 0-4a2 2 0 0 1 0 4" /><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12s4.477 10 10 10" /><path fill="currentColor" d="M8.5 9a.5.5 0 1 1 0-1a.5.5 0 0 1 0 1m7 0a.5.5 0 1 1 0-1a.5.5 0 0 1 0 1" /></g></svg>
    },
    {
        'code': 'serious',
        'label': 'Serious',
        'icon': SuprisedIcon,
        // 'icon': <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 9H8m8 0h-2m4 6H6m-4-3c0 5.523 4.477 10 10 10s10-4.477 10-10S17.523 2 12 2S2 6.477 2 12" /></svg>
    }
]


const schema = Yup.object().shape({
    talking_photo_id: Yup.string().required("Required."),
    voice_id: Yup.string().required("Required."),
    emotion: Yup.string().required("Required.").oneOf(emotions.map((emotion) => emotion.code)),
    movement: Yup.string().required("Required.").oneOf(movements.map((movement) => movement.code)),
});

export default function CreateVideo() {
    const uid = useAuthStore((state) => state.uid);
    const profile = useProfileStore((state) => state.profile);
    const router = useRouter();
    const [personalTalkingPhotos, setPersonalTalkingPhotos] = useState<DIDTalkingPhoto[]>([]);
    const [selectedAvatar, setSelectedAvatar] = useState<DIDTalkingPhoto | null>(null);
    const [processing, setProcessing] = useState(false);

    const selectAvatarForm = useForm<{
        talking_photo_id: string;
        voice_id: string;
        emotion: Emotion;
        movement: Movement;
    }>({
        mode: 'all',
        resolver: yupResolver(schema),
        defaultValues: {
            emotion: 'neutral',
            movement: 'neutral'
        },
    });

    const writeScriptForm = useForm<{
        script: string;
    }>({
        mode: 'all',
    });

    useEffect(() => {
        selectAvatarForm.setValue('talking_photo_id', selectedAvatar ? selectedAvatar.talking_photo_id : '')
        selectAvatarForm.setValue('voice_id', selectedAvatar && selectedAvatar.voiceId ? selectedAvatar.voiceId : '')
    }, [selectedAvatar, selectAvatarForm])

    const [activeStep, setActiveStep] = useState('select-avatar')

    useEffect(() => {
        const personalTalkingPhotosCollection = query(
            collection(db, "didTalkingPhotos"),
            or(
                where('owner', '==', uid),
                where('type', '==', AVATAR_TYPE_TEMPLATE)
            ),
        );
        const unsubscribeTalkingPhotos = onSnapshot(
            personalTalkingPhotosCollection,
            (snapshot) => {
                const talkingPhotosList = snapshot.docs.map(
                    (doc) => doc.data() as DIDTalkingPhoto
                );
                setPersonalTalkingPhotos(talkingPhotosList);
            }
        );


        return () => {
            unsubscribeTalkingPhotos();
        };
    }, [uid]);

    useEffect(() => {
        selectAvatarForm.handleSubmit(() => { })
    }, [])

    const errors = useMemo(() => {
        return JSON.stringify(selectAvatarForm.formState.errors)
    }, [selectAvatarForm.formState])

    const audioDetails = useMemo(() => {
        return selectedAvatar && selectedAvatar.voiceId ? getAudioDetails(selectedAvatar.voiceId) : null
    }, [selectedAvatar])


    const onSubmit = writeScriptForm.handleSubmit(async (data) => {
        if (selectedAvatar) {
            toast.promise(
                new Promise(async (resolve, reject) => {
                    setProcessing(true);
                    try {
                        const imageUrl = `${getApiBaseUrl()}/api/imageproxy/${selectedAvatar.talking_photo_id}.png`;
                        const response = await generateVideo(
                            profile.did_api_key, imageUrl,
                            {
                                'thumbnail_url': selectedAvatar.preview_image_url,
                            },
                            selectedAvatar.talking_photo_id, writeScriptForm.getValues('script'), selectedAvatar.voiceId, undefined, profile.elevenlabs_api_key, selectAvatarForm.getValues('emotion'), selectAvatarForm.getValues('movement'),
                        )
                        if (response.status) {
                            resolve(true);
                            setTimeout(() => {
                                router.push(`/videos/${response.id}/show`);
                                setProcessing(false);
                            }, 2000);
                        } else {
                            reject(response.message);
                            setProcessing(false);
                        }
                    } catch (error) {
                        console.log("Error", errors);
                        /**
                         * TODO: Handle error
                         */
                        setProcessing(false);
                    }
                }),
                {
                    loading: 'Requesting to generate your video...',
                    success: `Successfully requested, Processing your video.`,
                    error: err => `Error : ${err}`,
                }
            );
        }
    });

    return <div className="px-4 max-h-full h-full flex flex-col">
        <ol className="flex items-center w-full gap-4">
            {
                steps.map((step, index) => <li key={index} className="flex-1 ">
                    <button disabled={processing}  onClick={() => { setActiveStep(step.code) }} className={`disabled:cursor-not-allowed flex items-center font-medium px-4 py-5 w-full create-video-step ${activeStep == step.code && 'active'}`}>
                        <span className="w-8 h-8 bg-gray-600  rounded-full flex justify-center items-center mr-3 text-sm text-white lg:w-10 lg:h-10">
                            <step.icon />
                        </span>
                        <h4 className="text-base  text-gray-600">{step.title}</h4>
                    </button>
                </li>)
            }
        </ol>

        <div className="py-4 px-1 grow overflow-hidden">
            {activeStep == 'select-avatar' ? <div className="flex w-full max-h-full h-full gap-4 overflow-auto">
                <div className={`${selectedAvatar ? 'w-1/4' : 'w-full'} flex flex-col h-full  max-h-full overflow-auto relative`}>
                    <ul className="w-full grid gap-4 grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
                        {personalTalkingPhotos.map((avatar, index) => (
                            <article key={index} onClick={() => { setSelectedAvatar(avatar) }} className="group/avatar relative border-transparent border-2 hover:border-gray-300 hover:drop-shadow-2xl transition-all cursor-pointer ease-in-out duration-300 isolate flex flex-col justify-end overflow-hidden rounded-2xl px-6 pb-6 pt-10 lg:pt-16 xl:pt-20 2xl:pt-32 mx-auto w-full">
                                {
                                    avatar.preview_image_url ? 
                                    <Image
                                        src={avatar.preview_image_url}
                                        alt={avatar.talking_photo_name}
                                        width={512}
                                        height={512}
                                        className="absolute inset-0 h-full w-full object-cover"
                                    /> : <></>
                                }
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/0"></div>
                                <h3 className="z-10 mt-3 text-xl font-bold text-white transition duration-300">{avatar.talking_photo_name}</h3>
                            </article>
                        ))}
                    </ul>
                </div>
                {selectedAvatar ?
                    <div className="grow bg-gray-50 rounded-lg p-4">
                        <div className="flex h-full">
                            <div className="self-center">
                                {
                                    selectedAvatar.preview_image_url ? 
                                    <Image
                                        src={selectedAvatar.preview_image_url}
                                        alt={selectedAvatar.talking_photo_name}
                                        width={512}
                                        height={512}
                                        className="h-56 w-56 object-cover"
                                    /> : <></>
                                }
                            </div>
                            <div className="grow px-4 flex flex-col">
                                <p className="text-2xl font-bold">{selectedAvatar.talking_photo_name}</p>
                                {/* <p className="text-2xl font-bold">{selectedAvatar.voiceId}</p> */}
                                <div className="flex flex-col gap-4 mt-5 px-4 grow">
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Audio</label>
                                        {
                                            audioDetails ?
                                                <div className="flex w-full gap-4 items-center">
                                                    <CustomAudioOption data={audioDetails} />
                                                    <div>
                                                        <audio controls key={audioDetails.voice_id}>
                                                            <source src={audioDetails.preview_url} type="audio/mpeg" />
                                                            Your browser does not support the audio element.
                                                        </audio>
                                                    </div>
                                                </div>
                                                : <Fragment />
                                        }
                                    </div>
                                    <Controller
                                        control={selectAvatarForm.control}
                                        name="emotion"
                                        render={({ field }) => (
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Emotions</label>

                                                <ul className="items-center w-full text-sm font-medium border-gray-200 rounded-lg sm:flex ">
                                                    {
                                                        emotions.map((emotion, index) => <li key={index} onClick={() => { selectAvatarForm.setValue('emotion', emotion.code) }} className={`cursor-pointer w-full border-gray-200 sm:border-r first:rounded-l-lg last:rounded-r-lg ${field.value == emotion.code ? 'bg-slate-600 text-white' : 'bg-white border text-gray-900'}`}>
                                                            <div className="flex items-center ps-3 ">
                                                                <label className="w-full py-3 ms-2 text-sm font-medium cursor-pointer">{emotion.label}</label>
                                                            </div>
                                                        </li>)
                                                    }

                                                </ul>

                                            </div>
                                        )}
                                    />
                                    <Controller
                                        control={selectAvatarForm.control}
                                        name="movement"
                                        rules={{
                                            required: { message: 'Required.', value: true },
                                        }}
                                        render={({ field }) => (
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Movements</label>

                                                <ul className="items-center w-full text-sm font-medium border-gray-200 rounded-lg sm:flex ">
                                                    {
                                                        movements.map((movements, index) => <li key={index} onClick={() => { selectAvatarForm.setValue('movement', movements.code) }} className={`cursor-pointer w-full border-gray-200 sm:border-r first:rounded-l-lg last:rounded-r-lg ${field.value == movements.code ? 'bg-slate-600 text-white' : 'bg-white border text-gray-900'}`}>
                                                            <div className="flex items-center ps-3 ">
                                                                <label className="w-full py-3 ms-2 text-sm font-medium cursor-pointer">{movements.label}</label>
                                                            </div>
                                                        </li>)
                                                    }

                                                </ul>

                                            </div>
                                        )}
                                    />

                                </div>
                                <div className="">
                                    <button onClick={() => { setActiveStep('write-script') }} className="float-end bg-gray-500 text-white px-4 py-2 h-10 rounded-md flex items-center justify-center mt-4">
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div> : <Fragment />
                }
            </div> : <Fragment />}

            {
                activeStep == 'write-script' ? <div className="grow bg-gray-50 rounded-lg px-4 pt-6 pb-4 h-full flex flex-col">
                    <form onSubmit={onSubmit}>
                        <div><h3 className="text-2xl font-bold mb-2">Write Script</h3></div>
                        <div className="grow">
                            <Controller
                                control={writeScriptForm.control}
                                name="script"
                                rules={{
                                    required: { message: 'Required.', value: true },
                                }}
                                render={({ field }) => (
                                    <textarea {...field} id="message" rows="10" className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Write Script..."></textarea>
                                )}
                            />
                        </div>
                        <div>
                            <button disabled={processing} type="submit" className="disabled:cursor-not-allowed float-end bg-gray-500 text-white px-4 py-2 h-10 rounded-md flex items-center justify-center mt-4">
                                {processing ? 'Processing...' : 'Generate Video'}
                            </button>
                        </div>

                    </form>
                </div> : <Fragment />
            }

        </div>
    </div>
}
