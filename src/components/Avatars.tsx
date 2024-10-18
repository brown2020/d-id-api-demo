"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
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
import { AvatarValues, DIDTalkingPhoto } from "@/types/did";
import { AUDIO_LIST, AVATAR_TYPE_PERSONAL, AVATAR_TYPE_TEMPLATE } from "@/libs/constants";
import { useAuthStore } from "@/zustand/useAuthStore";
import Model from "./Model";
import AvatarForm from "./AvatarForm";
import Notification from "@/models/Notification";

export default function Avatars() {
  const [personalTalkingPhotos, setPersonalTalkingPhotos] = useState<DIDTalkingPhoto[]>([]);
  const [templateTalkingPhotos, setTemplateTalkingPhotos] = useState<DIDTalkingPhoto[]>([]);
  const [showModel, setShowModel] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<DIDTalkingPhoto | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const uid = useAuthStore((state) => state.uid);

  const showNotification = (message: string, type: 'success' | 'info' | 'error') => {
    setNotification({ message, type });
    // Automatically hide the notification after it's shown
    setTimeout(() => {
        setNotification(null);
    }, 5000);
  };


  const handleClose = (val: { status: boolean, data: AvatarValues | null }) => {
    if (val.status) {
      if (selectedAvatar == null) {
        showNotification('Avatar Created Successfully', 'success');
        // TODO: Avatar Created Successfully
      } else {
        showNotification('Avatar Updated Successfully', 'success');
        // TODO: Avatar Updated Successfully
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
              <AvatarCard avatar={photo} key={index} id={photo.talking_photo_id} edit={() => openForm(photo)} />
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-lg font-semibold text-gray-600">Demo Avatars</h3>
          <ul className="grid min-[450px]:grid-cols-2 grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {templateTalkingPhotos.map((photo, index) => (
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
      {notification && (
        <div>
          <Notification message={notification.message} type={notification.type} />
        </div>
      )}
    </div>
  );
}
