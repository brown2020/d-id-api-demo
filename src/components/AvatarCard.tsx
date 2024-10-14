import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "@/firebase/firebaseClient";
import { HeartIcon, Trash } from "lucide-react";
import useProfileStore from "@/zustand/useProfileStore";
import { DIDTalkingPhoto } from "@/types/did";
import { uploadBytes, getDownloadURL } from "firebase/storage";
import { resizeImage } from "@/utils/resizeImage";

interface AvatarCardProps {
  id: string;
}

export default function AvatarCard({ id }: AvatarCardProps) {
  const [favorite, setFavorite] = useState(false);
  const [talkingPhotoName, setTalkingPhotoName] = useState("");
  const [project, setProject] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { selectedTalkingPhoto } = useProfileStore((state) => state.profile);
  const updateProfile = useProfileStore((state) => state.updateProfile);
  const isSelected = selectedTalkingPhoto === id;

  const router = useRouter();
  const pathname = usePathname();
  const isOnGeneratePage = pathname === "/generate";

  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, "didTalkingPhotos", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as DIDTalkingPhoto;
        setFavorite(data.favorite || false);
        setTalkingPhotoName(data.talking_photo_name || "");
        setProject(data.project || "");
        setVoiceId(data.voiceId || "");
        setPreviewImageUrl(data.preview_image_url || "");
      }
    };

    fetchData();
  }, [id]);

  const toggleFavorite = async () => {
    const newFavoriteStatus = !favorite;
    setFavorite(newFavoriteStatus);
    setIsDirty(true);

    const docRef = doc(db, "didTalkingPhotos", id);
    await setDoc(docRef, { favorite: newFavoriteStatus }, { merge: true });
  };

  const handleInputChange =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      setIsDirty(true);
    };

  const saveDetails = async () => {
    const docRef = doc(db, "didTalkingPhotos", id);
    await setDoc(
      docRef,
      { talking_photo_name: talkingPhotoName, project, voiceId },
      { merge: true }
    );
    setIsDirty(false);
  };

  const selectTalkingPhoto = async () => {
    if (!isSelected) {
      updateProfile({ selectedTalkingPhoto: id });
    } else {
      router.push("/generate"); // Navigate to /generate if already selected
    }
  };

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click(); // Trigger file input click when image is clicked
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Resize the image before uploading
      const resizedImage = await resizeImage(file);
      const storageRef = ref(storage, `images/${id}/${file.name}`);

      await uploadBytes(storageRef, resizedImage);
      const downloadUrl = await getDownloadURL(storageRef);

      setPreviewImageUrl(downloadUrl);
      setIsDirty(true);

      const docRef = doc(db, "didTalkingPhotos", id);
      await setDoc(docRef, { preview_image_url: downloadUrl }, { merge: true });
    }
  };

  const deleteTalkingPhoto = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const confirmed = window.confirm(
      "Are you sure you want to delete this talking photo?"
    );

    if (confirmed) {
      const docRef = doc(db, "didTalkingPhotos", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as DIDTalkingPhoto;

        if (data.preview_image_url) {
          const imageRef = ref(storage, data.preview_image_url);
          await deleteObject(imageRef).catch((error) => {
            console.error("Error deleting image from storage:", error);
          });
        }

        await deleteDoc(docRef);
      }
    }
  };

  return (
    <article className="group/avatar relative border-transparent border-2 hover:border-gray-300 hover:drop-shadow-2xl transition-all hover:-translate-y-2 ease-in-out duration-300 isolate flex flex-col justify-end overflow-hidden rounded-2xl px-8 pb-8 pt-40 lg:pt-40 xl:pt-44 2xl:pt-52 mx-auto w-full">
      {/* <img src={previewImageUrl} alt={talkingPhotoName} className="absolute inset-0 h-full w-full object-contain" /> */}
      {/* <img src={previewImageUrl} alt={talkingPhotoName} className="absolute inset-0 h-full w-full object-cover" /> */}
      {/* <div className="p-4 bg-black">
        <HeartIcon
          className="cursor-pointer absolute top-4 right-4"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite();
          }}
          strokeWidth={favorite ? 0 : 1}
          fill={favorite ? "red" : "none"}
          color={favorite ? "red" : "currentColor"}
          size={24}
        />
      </div> */}
      <Image
        src={previewImageUrl}
        alt={talkingPhotoName}
        width={512}
        height={512}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/0"></div>
      <h3 className="z-10 mt-3 text-xl font-bold text-white transition duration-300">{talkingPhotoName}</h3>
      {/* <div className="z-10 gap-y-1 overflow-hidden text-sm leading-6 text-gray-300">City of love</div> */}
    </article>
  )

  return (
    <div
      className={`relative border p-4 rounded-md shadow cursor-pointer ${isSelected ? "border-blue-500" : "border-gray-300"
        }`}
    >
      <div className="flex justify-between items-center">
        <h3 className="font-bold mb-2">
          {talkingPhotoName || "Untitled Talking Photo"}
        </h3>
        <HeartIcon
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite();
          }}
          strokeWidth={favorite ? 0 : 1}
          fill={favorite ? "red" : "none"}
          color={favorite ? "red" : "currentColor"}
          size={24}
        />
      </div>
      <div onClick={handleImageClick} className="cursor-pointer">
        {previewImageUrl ? (
          <Image
            src={previewImageUrl}
            alt={talkingPhotoName}
            width={512}
            height={512}
            className="w-48 h-auto rounded transition-transform transform hover:scale-105"
          />
        ) : (
          <div className="w-48 h-48 bg-gray-200 flex items-center justify-center rounded">
            <span>No Image</span>
          </div>
        )}
      </div>
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        ref={fileInputRef}
        className="hidden" // Hide the file input
      />
      <div className="mt-2">
        <label
          className="text-xs px-1 text-gray-600"
          htmlFor="talkingPhotoName"
        >
          Avatar Name
        </label>
        <input
          id="talkingPhotoName"
          type="text"
          value={talkingPhotoName}
          onChange={handleInputChange(setTalkingPhotoName)}
          placeholder="Avatar Name"
          className="border rounded p-1 w-full"
        />
        <label
          className="text-xs px-1 text-gray-600 mt-2 block"
          htmlFor="project"
        >
          Project
        </label>
        <input
          id="project"
          type="text"
          value={project}
          onChange={handleInputChange(setProject)}
          placeholder="Project"
          className="border rounded p-1 w-full"
        />
        <label
          className="text-xs px-1 text-gray-600 mt-2 block"
          htmlFor="voiceId"
        >
          Voice ID
        </label>
        <input
          id="voiceId"
          type="text"
          value={voiceId}
          onChange={handleInputChange(setVoiceId)}
          placeholder="Voice ID"
          className="border rounded p-1 w-full"
        />
        <div className="flex justify-between items-center mt-2">
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                saveDetails();
              }}
              className={`bg-blue-500 text-white px-3 py-2 rounded-md ${isDirty ? "hover:opacity-50" : "opacity-50 cursor-not-allowed"
                }`}
              disabled={!isDirty}
            >
              Save
            </button>
            {!isOnGeneratePage && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  selectTalkingPhoto();
                }}
                className={`bg-green-500 text-white px-3 py-2 rounded-md ${isSelected ? "hover:opacity-50" : ""
                  }`}
              >
                {isSelected ? "Go to Generate" : "Select"}
              </button>
            )}
          </div>
          <Trash
            className="w-6 h-6 text-gray-500 opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              deleteTalkingPhoto(e);
            }}
          />
        </div>
      </div>
    </div>
  );
}
