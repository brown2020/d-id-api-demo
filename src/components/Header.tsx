"use client";

import { auth } from "@/firebase/firebaseClient";
import { useAuthStore } from "@/zustand/useAuthStore";
import { useInitializeStores } from "@/zustand/useInitializeStores";
import useProfileStore from "@/zustand/useProfileStore";
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
import { serverTimestamp, Timestamp } from "firebase/firestore";
import Link from "next/link";
import { useEffect } from "react";

export default function Header() {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const setAuthDetails = useAuthStore((state) => state.setAuthDetails);
  const clearAuthDetails = useAuthStore((state) => state.clearAuthDetails);
  const profile = useProfileStore((state) => state.profile);
  useInitializeStores();

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

  return (
    <div className="flex h-14 items-center justify-between px-4 py-2">
      <Link href="/" className="font-medium text-xl">
        D-ID API Demo
      </Link>

      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <div className="flex gap-2 items-center">
          {(profile.selectedAvatar || profile.selectedTalkingPhoto) && (
            <Link href="/generate">Generate</Link>
          )}
          <div className="relative group inline-block">
            <button className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-300 ease-in-out transform ">Create</button>
            <div
              className="opacity-0 z-20 invisible group-hover:opacity-100 group-hover:visible absolute w-48 mt-0 bg-white text-gray-800 border border-gray-300 rounded-lg shadow-lg py-2 z-10">
              <Link href="/videos/create" className="px-4 py-2">Create Videos</Link>
            </div>
          </div>
          <Link href="/videos">Videos</Link>
          <Link href="/avatars">Avatars</Link>
          <Link href="/profile">Profile</Link>
          <UserButton />
        </div>
      </SignedIn>
    </div>
  );
}
