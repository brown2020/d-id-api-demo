"use client";

import { db } from "@/firebase/firebaseClient";
import { NOTIFICATION_COLLECTION, NOTIFICATION_STATUS } from "@/libs/constants";
import { NotificationDetail } from "@/types/did";
import { useAuthStore } from "@/zustand/useAuthStore";
import { useInitializeStores } from "@/zustand/useInitializeStores";
import Image from "next/image";
import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { AlignJustify, Bell } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import moment from "moment";
import { useRouter } from "next/navigation";
import logo from "@/assets/images/logo.png";
import { useAuth } from "./FirebaseAuthProvider";
import { FirebaseAuth } from "./FirebaseAuth";
import { UserProfile } from "./UserProfile";

export default function Header() {
  const { user } = useAuth();
  const uid = useAuthStore((state) => state.uid);
  const [notifications, setNotifications] = useState<NotificationDetail[]>([]);
  const [processing, setProcessing] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  useInitializeStores();

  // Close the notification popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!uid) {
      setNotifications([]);
      setProcessing(false);
      return;
    }

    setProcessing(true);
    const notificationCollection = query(
      collection(db, NOTIFICATION_COLLECTION),
      where("user_id", "==", uid),
      where("status", "==", NOTIFICATION_STATUS.UNREAD)
    );
    const unsubscribe = onSnapshot(notificationCollection, (snapshot) => {
      setProcessing(false);
      const notificationList = snapshot.docs.map((doc) => {
        return {
          id: doc.id,
          ...(doc.data() as NotificationDetail),
        };
      });
      setNotifications(notificationList);
    });

    return () => {
      unsubscribe();
    };
  }, [uid]);

  const notificationMessage = useMemo(
    () => ({
      video_generated: () => "Your video is created successfully",
      video_generation_failed: () => (
        <span className="text-red-500">Your video generation failed</span>
      ),
    }),
    []
  );

  const router = useRouter();

  const openNotification = useCallback(
    (notification: NotificationDetail) => {
      if (!notification.id) return;

      const notificationRef = doc(db, NOTIFICATION_COLLECTION, notification.id);
      setDoc(
        notificationRef,
        { status: NOTIFICATION_STATUS.READ },
        { merge: true }
      );

      router.push(`/videos/${notification.video_id}/show`);
    },
    [router]
  );

  const notificationList = useMemo(() => {
    return notifications.map((value, index) => {
      const message =
        value.type in notificationMessage
          ? notificationMessage[value.type]()
          : "Message";
      return (
        <div key={index} className="py-1 px-2 flex gap-2">
          <div className="">
            <p className="text-lg font-bold">{message}</p>
            <p className="text-sm text-gray-500">
              {moment(value.created_at, "X").fromNow()}
            </p>
          </div>
          <div>
            <button
              onClick={() => {
                openNotification(value);
              }}
              className="p-2 bg-gray-300 rounded-md text-black"
            >
              Open
            </button>
          </div>
        </div>
      );
    });
  }, [notifications, notificationMessage, openNotification]);

  return (
    <>
      {!user ? (
        <div className="flex items-center justify-end px-4 py-3 border-b shadow-md z-30">
          <FirebaseAuth />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-4 py-3 border-b shadow-md z-[999]">
            <Image src={logo} alt="logo" className="w-[80.28px] h-[50px]" />
            <div className="hidden sm:flex items-center">
              <div className="relative" ref={notificationRef}>
                <button
                  className="px-2 py-1 bg-white relative"
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                >
                  <Bell />
                  {notifications.length > 0 ? (
                    <span className="absolute top-0 right-0 bg-slate-900 text-white px-1 text-sm rounded-full shadow-lg">
                      {notifications.length}
                    </span>
                  ) : (
                    <></>
                  )}
                </button>
                {isNotificationOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-2">
                    <div className="after:content-[''] after:absolute after:-top-2 after:right-3 after:border-8 after:border-transparent after:border-b-white"></div>
                    <div className="px-3 py-2">
                      {processing
                        ? "Processing..."
                        : notifications.length > 0
                        ? notificationList
                        : "Not found any notification."}
                    </div>
                  </div>
                )}
              </div>
              <Link
                href="/videos/create"
                className="hover:text-blue-500 px-4 py-2 rounded-lg transition"
              >
                Create
              </Link>
              <Link
                href="/videos"
                className="hover:text-blue-500 px-4 py-2 rounded-lg transition"
              >
                Videos
              </Link>
              <Link
                href="/avatars"
                className="hover:text-blue-500 px-4 py-2 rounded-lg transition"
              >
                Avatars
              </Link>
              <Link
                href="/profile"
                className="hover:text-blue-500 px-4 py-2 rounded-lg transition"
              >
                Profile
              </Link>
              <UserProfile />
            </div>
            <div className="sm:hidden flex items-center">
              <div className="flex justify-end">
                <div className="flex gap-3 items-center">
                  <div className="relative" ref={notificationRef}>
                    <button
                      className="px-2 py-1 bg-white relative"
                      onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    >
                      <Bell />
                      {notifications.length > 0 ? (
                        <span className="absolute top-0 right-0 bg-slate-900 text-white px-1 text-sm rounded-full shadow-lg">
                          {notifications.length}
                        </span>
                      ) : (
                        <></>
                      )}
                    </button>
                    {isNotificationOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-2">
                        <div className="after:content-[''] after:absolute after:-top-2 after:right-3 after:border-8 after:border-transparent after:border-b-white"></div>
                        <div className="px-3 py-2">
                          {processing
                            ? "Processing..."
                            : notifications.length > 0
                            ? notificationList
                            : "Not found any notification."}
                        </div>
                      </div>
                    )}
                  </div>
                  <AlignJustify
                    className="cursor-pointer"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                  />
                  <UserProfile />
                </div>
              </div>
            </div>
          </div>
          <div className="relative sm:hidden">
            <div
              className={`absolute shadow-md z-[9998] bg-white rounded-b-lg ${
                isMenuOpen ? "max-h-96" : "max-h-0"
              } overflow-hidden transition-all duration-300 w-full left-0`}
            >
              <div className="flex flex-col p-2">
                <Link
                  onClick={() => setIsMenuOpen(false)}
                  href="/videos/create"
                  className="px-4 py-2 rounded-lg hover:bg-blue-600 hover:text-white transition"
                >
                  Create
                </Link>
                <Link
                  onClick={() => setIsMenuOpen(false)}
                  href="/videos"
                  className="px-4 py-2 rounded-lg hover:bg-blue-600 hover:text-white transition"
                >
                  Videos
                </Link>
                <Link
                  onClick={() => setIsMenuOpen(false)}
                  href="/avatars"
                  className="px-4 py-2 rounded-lg hover:bg-blue-600 hover:text-white transition"
                >
                  Avatars
                </Link>
                <Link
                  onClick={() => setIsMenuOpen(false)}
                  href="/profile"
                  className="px-4 py-2 rounded-lg hover:bg-blue-600 hover:text-white transition"
                >
                  Profile
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
