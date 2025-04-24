import { Fragment, useEffect, useState } from "react";
import Image from "next/image";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseClient";
import { DIDTalkingPhoto } from "@/types/did";
import { AVATAR_TYPE_PERSONAL, DOCUMENT_COLLECTION } from "@/libs/constants";
import { useAuthStore } from "@/zustand/useAuthStore";
import toast from "react-hot-toast";
import { Pencil } from "lucide-react";

interface AvatarCardProps {
  id: string;
  avatar?: DIDTalkingPhoto;
  edit?: () => void;
}

export default function AvatarCard({ id, avatar, edit }: AvatarCardProps) {
  // const [favorite] = useState(false);
  // const [talkingPhotoName, setTalkingPhotoName] = useState("");
  // const [project, setProject] = useState("");
  // const [voiceId, setVoiceId] = useState("");
  // const [previewImageUrl, setPreviewImageUrl] = useState("");
  // const [isDirty, setIsDirty] = useState(false);
  // const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uid = useAuthStore((state) => state.uid);
  const [isLocalhost, setIsLocalhost] = useState(false);

  // Check if we're on localhost
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      setIsLocalhost(hostname === "localhost" || hostname === "127.0.0.1");
    }
  }, []);

  const toggleFavorite = async () => {
    toast.promise(
      new Promise(async (resolve, reject) => {
        const favorite_of = avatar?.favorite_of || [];

        if (favorite_of.includes(uid)) {
          favorite_of.splice(favorite_of.indexOf(uid), 1);
        } else {
          favorite_of.push(uid);
        }
        // Save the new talking photo to Firestore
        const docRef = doc(db, DOCUMENT_COLLECTION, id);

        // Ensure the document is created only if it doesn't exist already
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          await setDoc(docRef, { favorite_of }, { merge: true });
          resolve(true);
        } else {
          reject(false);
        }
      }),
      {
        loading: "Processing...",
        success: () => {
          return `Success.`;
        },
        error: () => {
          return `Failed`;
        },
      }
    );
  };

  // Safe image rendering that handles localhost case
  const renderAvatar = () => {
    if (!avatar?.preview_image_url || avatar.preview_image_url.trim() === "") {
      return (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400">No image</span>
        </div>
      );
    }

    // For localhost, show a placeholder to avoid image fetch errors
    if (isLocalhost) {
      return (
        <div className="absolute inset-0 bg-gradient-to-b from-gray-300 to-gray-400 flex flex-col items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-600 mb-2"
          >
            <circle cx="12" cy="8" r="5" />
            <path d="M20 21a8 8 0 0 0-16 0" />
          </svg>
          <span className="text-gray-600 text-center px-2">
            Avatar Preview
            <br />
            (localhost mode)
          </span>
        </div>
      );
    }

    // For non-localhost environments, show the actual image
    return (
      <Image
        src={avatar.preview_image_url}
        alt={avatar.talking_photo_name}
        width={512}
        height={512}
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  };

  return (
    <article className="group/avatar relative border-transparent border-2 hover:border-gray-300 hover:drop-shadow-2xl transition-all hover:-translate-y-2 ease-in-out duration-300 isolate flex flex-col justify-end overflow-hidden rounded-2xl px-8 pb-8 pt-40 lg:pt-40 xl:pt-44 2xl:pt-52 mx-auto w-full">
      {renderAvatar()}

      <div className="absolute inset-0 bg-linear-to-t from-gray-900 via-gray-900/0"></div>
      <h3 className="z-10 mt-3 text-xl font-bold text-white transition duration-300">
        {avatar?.talking_photo_name}
      </h3>
      <button
        onClick={toggleFavorite}
        className="transition duration-300 absolute top-3 left-3 p-2 rounded-full"
      >
        {avatar?.favorite_of?.includes(uid) ? (
          <svg
            className={`${
              avatar?.favorite_of?.includes(uid)
                ? "text-red-600"
                : "text-gray-200"
            }`}
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
          >
            <path
              className="shadow-xl"
              fill="currentColor"
              d="M12 20.325q-.35 0-.712-.125t-.638-.4l-1.725-1.575q-2.65-2.425-4.788-4.812T2 8.15Q2 5.8 3.575 4.225T7.5 2.65q1.325 0 2.5.562t2 1.538q.825-.975 2-1.537t2.5-.563q2.35 0 3.925 1.575T22 8.15q0 2.875-2.125 5.275T15.05 18.25l-1.7 1.55q-.275.275-.637.4t-.713.125"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 48 48"
          >
            <defs>
              <mask id="ipTLike0">
                <path
                  fill="#555"
                  stroke="#fff"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="4"
                  d="M15 8C8.925 8 4 12.925 4 19c0 11 13 21 20 23.326C31 40 44 30 44 19c0-6.075-4.925-11-11-11c-3.72 0-7.01 1.847-9 4.674A10.99 10.99 0 0 0 15 8"
                />
              </mask>
            </defs>
            <path fill="currentColor" d="M0 0h48v48H0z" mask="url(#ipTLike0)" />
          </svg>
        )}
      </button>
      {avatar?.type == AVATAR_TYPE_PERSONAL ? (
        <button
          onClick={() => {
            if (edit) edit();
          }}
          className="transition duration-300 absolute top-3 right-3 bg-gray-300 text-gray-600 p-2 rounded-full border border-gray-400 shadow-sm"
        >
          <Pencil size={20} />
        </button>
      ) : (
        <Fragment></Fragment>
      )}
    </article>
  );
}
