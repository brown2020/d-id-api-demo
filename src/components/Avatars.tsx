"use client";

import { useEffect, useState } from "react";
import AvatarCard from "./AvatarCard";
import { db, storage } from "@/firebase/firebaseClient";
import {
  collection,
  onSnapshot,
  setDoc,
  doc,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { DIDTalkingPhoto } from "@/types/did";
import { AUDIO_LIST, AVATAR_TYPE_PERSONAL, AVATAR_TYPE_TEMPLATE } from "@/libs/constants";
import { useAuthStore } from "@/zustand/useAuthStore";
import Select from 'react-select'
import { Image } from "lucide-react";
import { resizeImage } from "@/utils/resizeImage";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getFileUrl } from "@/actions/getFileUrl";
import { Resolver, useForm } from "react-hook-form";

type AvatarValues = {
  voiceId: string;
  name: string;
  preview_image_url: string;
  talking_photo_id: string;
};

export default function Avatars() {
  const [personalTalkingPhotos, setPersonalTalkingPhotos] = useState<DIDTalkingPhoto[]>([]);
  const [templateTalkingPhotos, setTemplateTalkingPhotos] = useState<DIDTalkingPhoto[]>([]);
  const [showModel, setShowModel] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [createAvatarId, setCreateAvatarId] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<DIDTalkingPhoto | null>(null);

  const uid = useAuthStore((state) => state.uid);

  const { register, handleSubmit } = useForm<AvatarValues>();
  const onSubmit = handleSubmit((data) => console.log(data));


  useEffect(() => {
    const personalTalkingPhotosCollection = query(
      collection(db, "didTalkingPhotos"),
      where('type', '==', AVATAR_TYPE_PERSONAL),
      where('owner', '==', uid)
    );
    const unsubscribeTalkingPhotos = onSnapshot(
      personalTalkingPhotosCollection,
      (snapshot) => {
        console.log("snapshot.docs", snapshot.docs);

        const talkingPhotosList = snapshot.docs.map(
          (doc) => doc.data() as DIDTalkingPhoto
        );
        setPersonalTalkingPhotos(talkingPhotosList);
      }
    );

    const templateTalkingPhotosCollection = query(
      collection(db, "didTalkingPhotos"),
      where('type', '==', AVATAR_TYPE_TEMPLATE)
    );
    const unsubscribeTemplateTalkingPhotos = onSnapshot(
      templateTalkingPhotosCollection,
      (snapshot) => {
        console.log("snapshot.docs", snapshot.docs);

        const talkingPhotosList = snapshot.docs.map(
          (doc) => doc.data() as DIDTalkingPhoto
        );
        setTemplateTalkingPhotos(talkingPhotosList);
      }
    );

    return () => {
      unsubscribeTalkingPhotos();
      unsubscribeTemplateTalkingPhotos()
    };
  }, [uid]);

  const createNewTalkingPhoto = async () => {
    setCreateAvatarId(`new-${Date.now()}`);
    setShowModel(true);
    return;
    // Generate a unique ID for the new talking photo
    const newPhotoId = `new-${Date.now()}`;

    // Define the new talking photo object
    const newPhoto: DIDTalkingPhoto = {
      talking_photo_id: newPhotoId,
      talking_photo_name: "New Talking Photo",
      preview_image_url: "", // Placeholder URL or default image
      favorite: false,
      project: "",
    };

    // Save the new talking photo to Firestore
    const docRef = doc(db, "didTalkingPhotos", newPhotoId);

    // Ensure the document is created only if it doesn't exist already
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await setDoc(docRef, newPhoto);
    } else {
      alert("Failed to create a new talking photo: duplicate ID.");
    }
  };

  const filteredTalkingPhotos = showFavorites
    ? personalTalkingPhotos.filter((p) => p.favorite)
    : personalTalkingPhotos;

  const options = AUDIO_LIST.map((audio) => {
    return {
      value: audio.voice_id,
      label: audio.name,
    }
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const id = selectedAvatar == null ? createAvatarId : selectedAvatar.talking_photo_id;

      // Resize the image before uploading
      const resizedImage = await resizeImage(file);
      const filePath = `images/${uid}/${id}/${file.name}`;
      const storageRef = ref(storage, filePath);

      await uploadBytes(storageRef, resizedImage);
      const url = await getFileUrl(filePath)
      const downloadUrl = await getDownloadURL(storageRef);

      const docRef = doc(db, "didTalkingPhotos", id);
      await setDoc(docRef, { preview_image_url: downloadUrl }, { merge: true });
    }
  };

  return (
    <div className="relative">
      <div className="sticky h-0 top-0 bg-transparent z-10 right-0 float-end">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setShowFavorites(!showFavorites)}
              className="bg-gray-200 text-gray-700 px-3 py-2 rounded-md"
            >
              {showFavorites ? "Show All" : "Show Favorites"}
            </button>
            <button
              onClick={createNewTalkingPhoto}
              className="bg-green-500 text-white px-3 py-2 rounded-md hover:opacity-50"
            >
              Create New Talking Photo
            </button>
          </div>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-4 w-full">
        <div>
          <h3 className="mb-3 text-lg font-semibold text-gray-600">My Avatars</h3>
          <ul className="grid min-[450px]:grid-cols-2 grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredTalkingPhotos.map((photo, index) => (
              <AvatarCard key={index} id={photo.talking_photo_id} />
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-lg font-semibold text-gray-600">Demo Avatars</h3>
          <ul className="grid min-[450px]:grid-cols-2 grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {templateTalkingPhotos.map((photo, index) => (
              <AvatarCard key={index} id={photo.talking_photo_id} />
            ))}
          </ul>
        </div>
      </div>
      {/* https://quickss.in/s/NNBRuP96 */}
      {/* https://prnt.sc/wKn-9mIOxyg8 */}
      {/* https://prnt.sc/x6qWNQW3wlUr */}
      <div className={`relative z-10 ${showModel ? "" : 'hidden'}`} >

        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" ></div>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">

            <div className="relative transform px-4 pb-4 pt-5 sm:p-4 sm:pb-4 overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-xl">
              <div className="grid grid-cols-3">
                <div className="">
                  <div className="relative h-full w-full bg-white rounded-md border border-dashed border-gray-400">
                    <label className="flex text-center p-2 h-full" for="avatar_image">
                      <input type="file" id="avatar_image" name="avatar_image" className="hidden" />
                      <div className="self-center">
                        <Image size={45} className="text-gray-500 m-auto" />
                        <p className="text-xs">Drop your image here, or Browse</p>
                      </div>
                    </label>
                  </div>
                </div>
                <div className="col-span-2">
                  <form onSubmit={onSubmit}>
                    <div className="bg-white">
                      <div className="sm:flex sm:items-start">

                        <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left">
                          <h3 className="text-xl font-semibold leading-6 text-gray-900" id="modal-title">Create Avatar</h3>
                          <div className="w-full mt-4 mb-5">
                            <label className="block mb-2 text-sm text-slate-600">
                              Avatar Name
                            </label>
                            <input {...register("name")} className="w-full bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-200 rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow" placeholder="Type name..." />
                          </div>

                          <div className="w-full mt-4 mb-5">
                            <label className="block mb-2 text-sm text-slate-600">
                              Audio
                            </label>
                            <Select {...register("name")} options={options} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 sm:flex sm:flex-row-reverse">
                      <button type="submit" className="inline-flex w-full justify-center rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 sm:ml-3 sm:w-auto">Add</button>
                      <button onClick={() => { setShowModel(false) }} type="button" className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
