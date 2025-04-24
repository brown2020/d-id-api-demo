"use client";

import { useAuthStore } from "@/zustand/useAuthStore";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { LoaderCircle, ArrowRight } from "lucide-react";
import { useAuth } from "./FirebaseAuthProvider";
import { FirebaseAuth } from "./FirebaseAuth";

export default function Home() {
  const uid = useAuthStore((state) => state.uid);
  const photoUrl = useAuthStore((state) => state.authPhotoUrl);
  const firebaseUid = useAuthStore((state) => state.firebaseUid);
  const fullName = useAuthStore((state) => state.authDisplayName);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleClick = () => {
    setLoading(true);
  };

  return (
    <div className="flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      {user ? (
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden max-w-md w-full transition-all duration-300 hover:shadow-2xl">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 py-6 px-8">
            <h2 className="text-center font-bold text-white text-2xl">
              D-ID API Demo
            </h2>
          </div>

          <div className="p-8">
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg -mt-16 bg-white">
                {photoUrl ? (
                  <Image
                    src={photoUrl}
                    width={256}
                    height={256}
                    alt={"user"}
                    priority
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="bg-gray-300 animate-pulse rounded-full w-full h-full" />
                )}
              </div>
              <div className="mt-4 font-semibold text-xl text-gray-800">
                {fullName || "Welcome Back!"}
              </div>
            </div>

            <div className="mb-6">
              <div className="text-sm font-medium text-gray-600 mb-1">
                Firebase User ID
              </div>
              <div className="text-xs py-3 px-4 overflow-auto text-gray-700 bg-gray-100 rounded-lg">
                {uid || (
                  <div className="bg-gray-300 animate-pulse h-6 w-full rounded-lg" />
                )}
              </div>
            </div>

            {firebaseUid && (
              <div className="flex justify-center">
                <Link href="/avatars" onClick={handleClick} className="w-full">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg py-3 px-6 text-center flex justify-center items-center gap-2 hover:shadow-lg transition-all duration-300">
                    {loading ? (
                      <LoaderCircle className="animate-spin" />
                    ) : (
                      <>
                        <span className="font-medium">Explore Avatars</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden max-w-md w-full transition-all duration-300 hover:shadow-2xl">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 py-6 px-8">
            <h2 className="text-center font-bold text-white text-2xl">
              Welcome to D-ID API Demo
            </h2>
          </div>

          <div className="p-8">
            <div className="mb-6 text-center">
              <p className="text-gray-700 mb-6">
                Explore the power of D-ID&apos;s AI avatars and video
                generation. Sign in to start creating your own digital
                presentations with lifelike avatars.
              </p>
              <div className="p-4 bg-gray-50 rounded-lg mb-6 text-sm text-gray-600 border border-gray-200">
                This demo showcases the capabilities of the D-ID API, allowing
                you to interact with various features and explore the potential
                of integrating D-ID into your projects.
              </div>
              <div className="mt-6">
                <FirebaseAuth />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
