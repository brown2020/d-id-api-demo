'use client';
import { getFileUrl } from "@/actions/getFileUrl";
import { db, storage } from "@/firebase/firebaseClient";
import { AUDIO_LIST, AVATAR_TYPE_PERSONAL, DEFAULT_AUDIO } from "@/libs/constants";
import { AudioDetails, AvatarValues, DIDTalkingPhoto } from "@/types/did";
import { resizeImage } from "@/utils/resizeImage";
import { useAuthStore } from "@/zustand/useAuthStore";
import { ErrorMessage } from "@hookform/error-message";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import { Image as ImageIcon } from "lucide-react"
import Image from "next/image";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Select, { OptionProps } from 'react-select';
import CustomOption from "./CustomOption";

export default function AvatarForm({ submit, create, avatarDetail }: {
    create: boolean,
    submit: (val: { status: boolean, data: AvatarValues | null }) => void,
    avatarDetail: DIDTalkingPhoto | null
}) {
    const { handleSubmit, control, formState, reset, watch, setValue, getValues } = useForm<AvatarValues>({ mode: 'all' });
    const [dragging, setDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const onSubmit = handleSubmit((data) => {
        setProcessing(true);
        try {
            createNewTalkingPhoto().then(() => {
                setProcessing(false);
                submit({ status: true, data: data });
            });
        } catch (error) {
            /**
             * TODO: Handle error
             */
            setProcessing(false);
        }
    });
    const [processing, setProcessing] = useState<boolean>(false);
    const [avatarId, setAvatarId] = useState<string>('');
    const uid = useAuthStore((state) => state.uid);

    const options = AUDIO_LIST.map((audio) => {
        return {
            value: audio.voice_id,
            label: audio.name,
            name: audio.name,
            gender: audio.gender,
            language: audio.language,
            accent: audio.accent
        }
    })


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
            setValue('preview_image_url', url);
        } catch (error) {
            console.error('Error uploading file:', error);
        } finally {
            setLoading(false);
            setProcessing(false);
        }
    };

    useEffect(() => {
        if (create) {
            const _avatarId = `new-${Date.now()}`;
            reset({
                voiceId: DEFAULT_AUDIO,
                name: '',
                preview_image_url: '',
                talking_photo_id: _avatarId
            })
            setAvatarId(_avatarId)
        } else if (avatarDetail !== null) {
            reset({
                voiceId: avatarDetail.voiceId,
                name: avatarDetail.talking_photo_name,
                preview_image_url: avatarDetail.preview_image_url,
                talking_photo_id: avatarDetail.talking_photo_id
            })
            setAvatarId(avatarDetail.talking_photo_id)
        }
    }, [create])

    const voiceId = watch('voiceId');
    const previewImageUrl = watch('preview_image_url');
    const voiceDetail = useMemo(() => {
        return AUDIO_LIST.find((audio) => audio.voice_id === voiceId);
    }, [voiceId]);
    const voiceValue = useMemo(() => {
        return options.find((option) => option.value === voiceId);
    }, [voiceId]);

    const createNewTalkingPhoto = async () => {
        const formValues = getValues();
        const newPhotoId = formValues.talking_photo_id;
        // Define the new talking photo object
        const newPhoto: DIDTalkingPhoto = {
            talking_photo_id: formValues.talking_photo_id,
            talking_photo_name: formValues.name,
            preview_image_url: formValues.preview_image_url, // Placeholder URL or default image
            favorite: false,
            type: AVATAR_TYPE_PERSONAL,
            voiceId: formValues.voiceId,
            owner: uid
        };

        // Save the new talking photo to Firestore
        const docRef = doc(db, "didTalkingPhotos", newPhotoId);

        // Ensure the document is created only if it doesn't exist already
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            await setDoc(docRef, newPhoto, { merge: true });
        } else {
            await setDoc(docRef, newPhoto);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            const id = avatarId;

            // Resize the image before uploading
            const resizedImage = await resizeImage(file);
            const filePath = `images/${uid}/${id}/${file.name}`;
            const storageRef = ref(storage, filePath);

            await uploadBytes(storageRef, resizedImage);
            const url = await getFileUrl(filePath)

            setValue('preview_image_url', url);
        }
    };

    const cancelEdit = () => {
        submit({ status: false, data: null });
    }
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    return <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform px-4 pb-4 pt-5 sm:p-4 sm:pb-4 rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-xl">
            <div className="grid grid-cols-3">
                <div className="relative">
                    <div className="relative h-full w-full bg-white rounded-md border border-dashed border-gray-400">
                        <div className={`${!previewImageUrl && 'hidden'}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        >
                        {/* {previewImageUrl} */}
                            <Image
                                src={previewImageUrl}
                                alt="Avatar Image"
                                width={512}
                                height={512}
                                className="absolute inset-0 h-full w-full object-cover"
                            />
                            <button onClick={() => { if (fileInputRef.current) fileInputRef.current.click() }} className="absolute bg-white text-gray-500 p-2 rounded-full bottom-3 right-3 shadow-lg">
                                <ImageIcon size={20} />
                            </button>
                        </div>
                        <label onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`flex text-center p-2 h-full ${previewImageUrl && 'hidden'}`} htmlFor="avatar_image">
                            <input ref={fileInputRef} onChange={handleImageUpload} type="file" id="avatar_image" name="avatar_image" className="hidden" />
                            <div className="self-center">
                                <ImageIcon size={45} className="text-gray-500 m-auto" />
                                <p className="text-xs">Drop your image here, or Browse</p>
                            </div>
                        </label>
                    </div>
                    { loading &&
                        <div className="backdrop-blur-sm absolute border top-0 h-full w-full rounded-md border-dashed border-gray-400 z-20 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full animate-spin
                    border-2 border-white border-dashed border-t-transparent"></div>
                    </div>
                    }
                    { dragging &&
                        <div className="bg-black opacity-40 absolute border top-0 h-full w-full rounded-md border-dashed border-gray-400 z-20 flex items-center justify-center">
                    </div>
                    }
                </div>
                <div className="col-span-2">
                    <form onSubmit={onSubmit}>
                        <div className="bg-white">
                            <div className="sm:flex sm:items-start">

                                <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left">
                                    <h3 className="text-xl font-semibold leading-6 text-gray-900" id="modal-title">{create ? 'Create' : 'Edit'} Avatar</h3>
                                    <div className="w-full mt-4 mb-5">
                                        <label className="block mb-2 text-sm text-slate-600">
                                            Avatar Name
                                        </label>
                                        <Controller
                                            control={control}
                                            name="name"
                                            rules={{
                                                required: { message: 'Required.', value: true },
                                                minLength: { value: 3, message: "Too short name." },
                                                maxLength: { value: 50, message: "Too long name." }
                                            }}
                                            render={({ field }) => (
                                                <input {...field} className="w-full bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-200 rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow" placeholder="Type name..." />
                                            )}
                                        />
                                        <p className="text-red-500 text-sm"><ErrorMessage errors={formState.errors} name="name" /></p>
                                    </div>

                                    <div className="w-full mt-4 mb-5">
                                        <label className="block mb-2 text-sm text-slate-600">
                                            Audio
                                        </label>
                                        <Controller
                                            control={control}
                                            name="voiceId"
                                            render={({ field }) => (
                                                <Select value={voiceValue} onChange={e => { setValue('voiceId', e?.value); field.onBlur(); }} options={options}
                                                components={{ Option: CustomOption }}   
                                                />
                                            )}
                                        />

                                        {
                                            voiceDetail ?
                                                <audio controls key={voiceDetail.voice_id} className="mt-2">
                                                    <source src={voiceDetail.preview_url} type="audio/mpeg" />
                                                    Your browser does not support the audio element.
                                                </audio> : <Fragment />
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 sm:flex sm:flex-row-reverse">
                            <button type="submit" disabled={processing} className="disabled:cursor-not-allowed disabled:opacity-50 inline-flex w-full justify-center rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 sm:ml-3 sm:w-auto">
                                {create ? 'Add' : 'Update'}
                            </button>
                            <button disabled={processing} onClick={cancelEdit} type="button" className="disabled:cursor-not-allowed disabled:opacity-50 mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
}