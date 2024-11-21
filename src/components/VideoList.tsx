'use client'

import { useEffect, useState } from "react"
import { db } from "@/firebase/firebaseClient"
import { collection, DocumentData, onSnapshot, query, where } from 'firebase/firestore';
import { Loader } from "./Loader";
import PlayVideoIcon from '@/assets/images/play-video-1.png'
import Image from "next/image";
import { useAuthStore } from "@/zustand/useAuthStore";
import { AVATAR_TYPE_PERSONAL } from "@/libs/constants";
import { useRouter } from "next/navigation";

export default function VideosPage() {

    const [fetching, setFetching] = useState<boolean>(true);
    const [videoList, setVideoList] = useState<DocumentData[]>([]);

    const uid = useAuthStore((state) => state.uid);
    const router = useRouter();

    useEffect(() => {
        setFetching(true);
        const videoCollection = query(
            collection(db, "generated-videos"),
            where('type', '==', AVATAR_TYPE_PERSONAL),
            where('owner', '==', uid),
        );

        const unsubscribeVideoCollection = onSnapshot(
            videoCollection,
            (snapshot) => {
                const videoList = snapshot.docs.map(
                    (doc) => doc.data()
                )
                setFetching(false);
                setVideoList(videoList)
                console.log("videoList", videoList);

            }
        )

        return () => {
            setFetching(false)
            unsubscribeVideoCollection();
        }

    }, [uid])



    return (
        <>
            {
                fetching ? <Loader /> :
                    <div className="p-4 h-full">
                        {
                            videoList.length > 0 ?
                                (
                                    <>
                                        <h3 className="mb-3 text-lg font-semibold text-gray-600">My Videos</h3>
                                        <div className="grid sm:grid-cols-9 xs:grid-cols-6 md:grid-cols-12 gap-x-2 gap-y-3">
                                            {
                                                videoList.map((video, index) => {
                                                    return (
                                                        <div onClick={() => router.push(`/videos/${video.id}/show`)} key={index} className="col-span-3 cursor-pointer group/video relative border-1 p-4 hover:bg-black border-gray-300 hover:drop-shadow-2xl rounded-xl overflow-hidden hover:-translate-y-2 transition-all duration-300">
                                                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/0 transition-all duration-300 hover:via-gray-900/1"></div>
                                                            <div className="h-36"></div>
                                                            {
                                                                video.thumbnail_url ?
                                                                    <Image src={video.thumbnail_url} alt="Audio play image" width={200} height={100} className="absolute inset-0 w-full h-full  object-cover" />
                                                                    :
                                                                    <Image src={PlayVideoIcon} alt="Audio play image" width={60} height={60} className="flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover/video:w-20 group-hover/video:h-20 transition-all duration-300 object-contain justify-center items-center" />
                                                            }
                                                            
                                                            <div className="z-10 relative text-white">
                                                                <h1 className="font-bold text-xl">{video.title}</h1>
                                                                {
                                                                    video.d_id_status =='done' ? 
                                                                    <span className="bg-green-700 text-white px-2 py-1 rounded-full">Generated</span>
                                                                    : <></>
                                                                }
                                                                {
                                                                    video.d_id_status =='error' ? 
                                                                    <span className="bg-red-700 text-white px-2 py-1 rounded-full">Error</span>
                                                                    : <></>
                                                                }
                                                                {
                                                                    video.d_id_status =='created' ? 
                                                                    <span className="bg-yellow-600 text-white px-2 py-1 rounded-full">Processing...</span>
                                                                    : <></>
                                                                }
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                            }
                                        </div>
                                    </>
                                ) :

                                <div className="flex justify-center items-center h-full">
                                    <p className="text-lg font-semibold text-gray-600">Videos are not available</p>
                                </div>
                        }

                    </div>
            }
        </>
    )
}