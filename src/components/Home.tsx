"use client";

import { useAuthStore } from "@/zustand/useAuthStore";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import Footer from "./Footer";

export default function Home() {
  const uid = useAuthStore((state) => state.uid);
  const photoUrl = useAuthStore((state) => state.authPhotoUrl);
  const firebaseUid = useAuthStore((state) => state.firebaseUid);
  const fullName = useAuthStore((state) => state.authDisplayName);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center h-full gap-[100px] px-[30px]">
        <div className="flex flex-col gap-[30px] bg-white shadow-pop-up-shadow rounded-2xl p-[30px] max-w-[616px] w-full">
          {/* <div className="font-medium text-[32px] max-xs:text-2xl max-xs:text-center">D-ID API Demo</div> */}

          <SignedIn>
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full overflow-hidden">
                {photoUrl && (
                  <Image
                    src={photoUrl}
                    width={256}
                    height={256}
                    alt={"user"}
                    priority
                  />
                )}
              </div>
              <div>{fullName}</div>

              <div className="w-full">
                <div className="text-lg font-medium">Clerk User</div>
                <div className="text-sm py-1 px-2 bg-slate-100 rounded-md">
                  {uid || "No User"}
                </div>
              </div>

              <div className="w-full">
                <div className="text-lg font-medium">Firebase User</div>
                <div className="text-sm py-1 px-2 bg-slate-100 rounded-md">
                  {firebaseUid || "No User"}
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              {firebaseUid && (
                <div className="p-2 bg-blue-500 text-white rounded-md w-32 text-center">
                  <Link href="/avatars">Avatars</Link>
                </div>
              )}
            </div>
          </SignedIn>

          <SignedOut>
            <div className="flex flex-col items-center mb-4">
              <div className="text-center font-medium  text-[26px] max-xs:text-[22px]">
                Welcome to the D-ID API Demo!
              </div>
              <div className="text-lg text-center max-xs:text-xs mt-5 xs:px-9">
                This demo showcases the capabilities of the D-ID API, allowing
                you to interact with various features and explore the potential
                of integrating D-ID into your projects. Sign in to start
                exploring the features, or learn more about what you can achieve
                with this powerful tool.
              </div>
            </div>
          </SignedOut>
        </div>
      </div>
      <Footer />
    </div>
  );
}
