"use client";

import { Fragment, useEffect, useState } from "react";
import AvatarCard from "./AvatarCard";
import { db } from "@/firebase/firebaseClient";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { AvatarValues, DIDTalkingPhoto } from "@/types/did";
import { AVATAR_TYPE_PERSONAL, AVATAR_TYPE_TEMPLATE } from "@/libs/constants";
import { useAuthStore } from "@/zustand/useAuthStore";
import Model from "./Model";
import AvatarForm from "./AvatarForm";
import toast from 'react-hot-toast';
import { Plus } from "lucide-react";

export default function Avatars() {
  const [personalTalkingPhotos, setPersonalTalkingPhotos] = useState<DIDTalkingPhoto[]>([]);
  const [templateTalkingPhotos, setTemplateTalkingPhotos] = useState<DIDTalkingPhoto[]>([]);
  const [showModel, setShowModel] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<DIDTalkingPhoto | null>(null);
  const uid = useAuthStore((state) => state.uid);

  const showNotification = (message: string) => {
    toast.success(message, {
      style: {
        border: '1px solid #4CAF50',
        padding: '16px',
        color: '#4CAF50',
        backgroundColor: '#f0fff4',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      },
      iconTheme: {
        primary: '#4CAF50',
        secondary: '#f0fff4',
      },
      duration: 5000,
    });
  };


  const handleClose = (val: { status: boolean, data: AvatarValues | null }) => {
    if (val.status) {
      if (selectedAvatar == null) {
        showNotification('Avatar Created Successfully');
      } else {
        showNotification('Avatar Updated Successfully');
      }
    }
    setSelectedAvatar(null)
    setShowModel(false);
  };

  useEffect(() => {
    const personalTalkingPhotosCollection = query(
      collection(db, "didTalkingPhotos"),
      where('type', '==', AVATAR_TYPE_PERSONAL),
      where('owner', '==', uid)
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

    const templateTalkingPhotosCollection = query(
      collection(db, "didTalkingPhotos"),
      where('type', '==', AVATAR_TYPE_TEMPLATE)
    );
    const unsubscribeTemplateTalkingPhotos = onSnapshot(
      templateTalkingPhotosCollection,
      (snapshot) => {
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

  const openForm = (avatar: DIDTalkingPhoto | null) => {
    setSelectedAvatar(avatar);
    setShowModel(true);
  }

  const createNewTalkingPhoto = async () => {
    openForm(null);
  };

  const filteredTalkingPhotos = showFavorites
    ? personalTalkingPhotos.filter((p) => p.favorite_of?.includes(uid))
    : personalTalkingPhotos;
  const filteredTemplateTalkingPhotos = showFavorites
    ? templateTalkingPhotos.filter((p) => p.favorite_of?.includes(uid))
    : templateTalkingPhotos;


  return (
    <div className="relative p-2">
      <div className="sticky xs:h-0 max-xs:w-full top-0 bg-transparent z-10 right-0 float-end">
        <div className="flex justify-between items-center">
          <div className="flex gap-2 max-xs:justify-between w-full">
            <button
              onClick={() => setShowFavorites(!showFavorites)}
              className="bg-gray-200 text-gray-700 max-xs:text-sm px-3 py-2 rounded-md"
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
          <article onClick={createNewTalkingPhoto} className="group/avatar cursor-pointer relative border-2 border-gray-300 hover:drop-shadow-2xl transition-all hover:-translate-y-2 ease-in-out duration-300 isolate flex flex-col justify-end overflow-hidden rounded-2xl px-8 pb-8 pt-40 lg:pt-40 xl:pt-44 2xl:pt-52 mx-auto w-full">
            <div className="absolute w-full h-full right-0 top-0 px-4 flex justify-center items-center">
              <div>
                <div className="border mx-auto w-fit rounded-full cursor-pointer p-2 bg-gray-300">
                  <Plus size={24} className="text-gray-600" />
                </div>
                <p className="w-full mt-2 font-semibold text-center text-gray-600">Create Avatar</p>
              </div>
            </div>
          </article>
            {filteredTalkingPhotos.map((photo, index) => (
              <AvatarCard avatar={photo} key={index} id={photo.talking_photo_id} edit={() => openForm(photo)} />
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-lg font-semibold text-gray-600">Demo Avatars</h3>
          <ul className="grid min-[450px]:grid-cols-2 grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredTemplateTalkingPhotos.map((photo, index) => (
              <AvatarCard avatar={photo} key={index} id={photo.talking_photo_id} />
            ))}
          </ul>
        </div>
      </div>
      {/* https://quickss.in/s/NNBRuP96 */}
      {/* https://prnt.sc/wKn-9mIOxyg8 */}
      {/* https://prnt.sc/x6qWNQW3wlUr */}
      <Model show={showModel}>
        {showModel ? <AvatarForm submit={handleClose} create={selectedAvatar == null} avatarDetail={selectedAvatar} /> : <Fragment />}
      </Model>
    </div>
  );
}
