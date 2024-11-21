"use client";

import { auth, db } from "@/firebase/firebaseClient";
import { NOTIFICATION_COLLECTION, NOTIFICATION_STATUS } from "@/libs/constants";
import { NotificationDetail } from "@/types/did";
import { useAuthStore } from "@/zustand/useAuthStore";
import { useInitializeStores } from "@/zustand/useInitializeStores";
import { Popover, PopoverTrigger, PopoverContent } from '@nextui-org/popover';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  useAuth,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import {
  signInWithCustomToken,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import { collection, doc, onSnapshot, query, serverTimestamp, setDoc, Timestamp, where } from "firebase/firestore";
import { AlignJustify, ArrowDown, Bell } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import moment from "moment";
import { useRouter } from "next/navigation";

export default function Header() {
  const { getToken, isSignedIn } = useAuth();
  const uid = useAuthStore((state) => state.uid);
  const { user } = useUser();
  const [notifications, setNotifications] = useState<NotificationDetail[]>([]);
  const [processing, setProcessing] = useState(true);
  const setAuthDetails = useAuthStore((state) => state.setAuthDetails);
  const clearAuthDetails = useAuthStore((state) => state.clearAuthDetails);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  useInitializeStores();

  useEffect(() => {
    setProcessing(true);
    const notificationCollection = query(
      collection(db, NOTIFICATION_COLLECTION),
      where('user_id', '==', uid),
      where('status', '==', NOTIFICATION_STATUS.UNREAD),
    );
    const unsubscribe = onSnapshot(
      notificationCollection,
      (snapshot) => {
        setProcessing(false);
        const notificationList = snapshot.docs.map(
          (doc) => {
            return {
              id: doc.id,
              ...doc.data() as NotificationDetail
            }
          }
        );
        setNotifications(notificationList);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [uid]);

  useEffect(() => {
    const syncAuthState = async () => {
      if (isSignedIn && user) {
        try {
          const token = await getToken({ template: "integration_firebase" });
          const userCredentials = await signInWithCustomToken(
            auth,
            token || ""
          );
          console.log("User signed in to Firebase:", userCredentials.user);

          // Update Firebase user profile
          await updateProfile(userCredentials.user, {
            displayName: user.fullName,
            photoURL: user.imageUrl,
          });
          setAuthDetails({
            uid: user.id,
            firebaseUid: userCredentials.user.uid,
            authEmail: user.emailAddresses[0].emailAddress,
            authDisplayName: user.fullName || "",
            authPhotoUrl: user.imageUrl,
            authReady: true,
            lastSignIn: serverTimestamp() as Timestamp,
          });
        } catch (error) {
          console.error("Error signing in with custom token:", error);
          clearAuthDetails();
        }
      } else {
        console.log("User is not signed in with Clerk");
        await firebaseSignOut(auth);
        clearAuthDetails();
      }
    };

    syncAuthState();
  }, [clearAuthDetails, getToken, isSignedIn, setAuthDetails, user]);

  const notificationMessage = useMemo(() => ({
    "video_generated": () => "Your video is created successfully",
    "video_generation_failed": () => <span className="text-red-500">Your video generation failed</span>,
  }), []);

  const router = useRouter();

  const openNotification = useCallback((notification: NotificationDetail) => {
    if (!notification.id) return;

    const notificationRef = doc(db, NOTIFICATION_COLLECTION, notification.id);
    setDoc(notificationRef, { status: NOTIFICATION_STATUS.READ }, { merge: true })


    router.push(`/videos/${notification.video_id}/show`)
  }, [router]);

  const notificationList = useMemo(() => {
    return notifications.map((value, index) => {
      const message = value.type in notificationMessage ? notificationMessage[value.type]() : "Message"
      return <div key={index} className="py-1 px-2 flex gap-2">
        <div className="">
          <p className="text-lg font-bold">{message}</p>
          <p className="text-sm text-gray-500">{moment(value.created_at, 'X').fromNow()}</p>
        </div>
        <div>
          <button onClick={() => { openNotification(value) }} className="p-2 bg-gray-300 rounded-md text-black">
            Open
          </button>
        </div>
      </div>;
    })
  }, [notifications, notificationMessage, openNotification]);

  return (
    <>
      {/* <Link href="/" className="font-medium text-xl">
          D-ID API Demo
        </Link> */}

      <SignedOut>
        <div className="flex items-center justify-end px-4 py-3 border-b shadow-md z-30">
          <SignInButton>
            <button className="text-white bg-blue-500 h-full px-2 py-1 rounded-lg ">
              Sign In
            </button>
          </SignInButton>
        </div>
      </SignedOut>
      <SignedIn>
        <div className="flex items-center justify-end px-4 py-3 border-b shadow-md z-30">
          <div className="max-xs:hidden flex items-center">
          
            <Popover placement="bottom-end" showArrow={true}>
              <PopoverTrigger>
                <button className="px-2 py-1 bg-white relative">
                  <Bell />
                  {
                    notifications.length > 0 ?
                      <span className="absolute top-0 right-0 bg-slate-900 text-white px-1 text-sm rounded-full shadow-lg">{notifications.length}</span> :
                      <></>
                  }
                </button>
              </PopoverTrigger>
              <PopoverContent>
                <div className="px-1 py-2">
                  {
                    processing ? "Processing..." : (
                      notifications.length > 0 ? notificationList : "Not found any notification."
                    )
                  }
                </div>
              </PopoverContent>
            </Popover>
            <div className="group">
              <button className="hover:text-blue-500 px-4 py-2 rounded-lg transition duration-300 ease-in-out transform ">Create</button>
              <div
                className="opacity-0 z-20 invisible group-hover:opacity-100 group-hover:visible absolute mt-0 bg-white text-gray-800 border border-gray-300 rounded-lg shadow-lg py-2 z-10">
                <Link href="/videos/create" className="px-4 py-2">Create Videos</Link>
              </div>
            </div>
            <Link href="/videos" className="hover:text-blue-500 px-4 py-2 rounded-lg transition">Videos</Link>
            <Link href="/avatars" className="hover:text-blue-500 px-4 py-2 rounded-lg transition">Avatars</Link>
            <Link href="/profile" className="hover:text-blue-500 px-4 py-2 rounded-lg transition">Profile</Link>
            <UserButton />
          </div>
          <div className="xs:hidden relative flex-1">
            <div className="flex justify-end">
              <div className="flex gap-3 items-center">
                <Popover placement="bottom-end" showArrow={true}>
                  <PopoverTrigger>
                    <button className="px-2 py-1 bg-white relative">
                      <Bell />
                      {
                        notifications.length > 0 ?
                          <span className="absolute top-0 right-0 bg-slate-900 text-white px-1 text-sm rounded-full shadow-lg">{notifications.length}</span> :
                          <></>
                      }
                    </button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="px-1 py-2">
                      {
                        processing ? "Processing..." : (
                          notifications.length > 0 ? notificationList : "Not found any notification."
                        )
                      }
                    </div>
                  </PopoverContent>
                </Popover>
                <AlignJustify className="cursor-pointer" onClick={() => setIsMenuOpen(!isMenuOpen)} />
                <UserButton />
              </div>
            </div>
            <div className={`absolute border shadow-md bg-white rounded-b-lg ${isMenuOpen ? 'max-h-96' : 'max-h-0'} overflow-hidden transition-all duration-300 z-20 top-11 w-full left-0`}>
              <div className="flex flex-col p-2">
                <div className="group w-full relative">
                  <button onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)} className={`hover:text-white flex justify-between text-start px-4 w-full py-2 rounded-lg hover:bg-blue-600 transition duration-300 ease-in-out transform`}>
                    <p>Create</p>
                    <ArrowDown className={`${isCreateMenuOpen ? 'rotate-0' : 'rotate-90'} `} />
                  </button>
                  <div
                    className={` ${isCreateMenuOpen ? 'visible' : 'hidden'} top-10 right-0 w-full z-20 absolute mt-0 bg-white text-gray-800 border border-gray-300 rounded-b-lg shadow-lg py-2`}>
                    <Link href="/videos/create" className="px-4 py-2">Create Videos</Link>
                  </div>
                </div>
                <Link onClick={() => setIsMenuOpen(false)} href="/videos" className="px-4 py-2 rounded-lg hover:bg-blue-600 hover:text-white transition">Videos</Link>
                <Link onClick={() => setIsMenuOpen(false)} href="/avatars" className="px-4 py-2 rounded-lg hover:bg-blue-600 hover:text-white transition">Avatars</Link>
                <Link onClick={() => setIsMenuOpen(false)} href="/profile" className="px-4 py-2 rounded-lg hover:bg-blue-600 hover:text-white transition">Profile</Link>
              </div>
            </div>
          </div>
        </div>
      </SignedIn>
    </>
  );
}
