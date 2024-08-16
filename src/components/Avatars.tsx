"use client";

import { useEffect, useState } from "react";
import AvatarCard from "./AvatarCard";
import { db } from "@/firebase/firebaseClient";
import {
  collection,
  onSnapshot,
  setDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { DIDTalkingPhoto } from "@/types/did";

export default function Avatars() {
  const [talkingPhotos, setTalkingPhotos] = useState<DIDTalkingPhoto[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => {
    const talkingPhotosCollection = collection(db, "didTalkingPhotos");
    const unsubscribeTalkingPhotos = onSnapshot(
      talkingPhotosCollection,
      (snapshot) => {
        const talkingPhotosList = snapshot.docs.map(
          (doc) => doc.data() as DIDTalkingPhoto
        );
        setTalkingPhotos(talkingPhotosList);
      }
    );

    return () => {
      unsubscribeTalkingPhotos();
    };
  }, []);

  const createNewTalkingPhoto = async () => {
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
    ? talkingPhotos.filter((p) => p.favorite)
    : talkingPhotos;

  return (
    <div>
      <div className="sticky top-0 bg-white z-10 shadow-md">
        <div className="flex justify-between items-center p-4">
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

      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {filteredTalkingPhotos.map((photo, index) => (
          <AvatarCard key={index} id={photo.talking_photo_id} />
        ))}
      </ul>
    </div>
  );
}
