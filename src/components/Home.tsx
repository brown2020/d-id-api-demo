"use client";

import { useAuthStore } from "@/zustand/useAuthStore";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuth } from "./FirebaseAuthProvider";
import { FirebaseAuth } from "./FirebaseAuth";
import { getSafeCallbackUrl } from "@/libs/auth-constants";
import { redirect, useSearchParams } from "next/navigation";

export default function Home() {
  const fullName = useAuthStore((state) => state.authDisplayName);
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const safeCallbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"));
  if (user && safeCallbackUrl) {
    redirect(safeCallbackUrl);
  }
  const handleClick = () => {
    // Navigation will be handled by Link component
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      {user ? (
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              D-ID API Demo
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Welcome back, {fullName || "User"}!
            </p>
            <p className="text-gray-500">
              Explore expressive avatars and conversational AI agents
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <Link href="/expressive" onClick={handleClick}>
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-white/20 p-3 rounded-lg">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold">V4 Expressive Avatars</h2>
                </div>
                <p className="text-white/90 mb-6">
                  Create videos with emotional avatars that express different sentiments. 
                  Choose from multiple avatars and sentiments to bring your content to life.
                </p>
                <div className="flex items-center gap-2 text-white font-semibold">
                  <span>Create Expressive Video</span>
                  <ArrowRight size={20} />
                </div>
              </div>
            </Link>

            <Link href="/agents" onClick={handleClick}>
              <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-white/20 p-3 rounded-lg">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold">Realtime Agents</h2>
                </div>
                <p className="text-white/90 mb-6">
                  Build conversational AI agents with live video avatars. 
                  Create interactive experiences with real-time speech and avatar animation.
                </p>
                <div className="flex items-center gap-2 text-white font-semibold">
                  <span>Manage Agents</span>
                  <ArrowRight size={20} />
                </div>
              </div>
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              More Features
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link href="/generate" className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
                <div className="font-semibold text-gray-900 mb-1">Legacy Generation</div>
                <div className="text-sm text-gray-600">V2 talking photos (classic)</div>
              </Link>
              <Link href="/avatars" className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
                <div className="font-semibold text-gray-900 mb-1">Avatar Library</div>
                <div className="text-sm text-gray-600">Manage your talking photos</div>
              </Link>
              <Link href="/videos" className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
                <div className="font-semibold text-gray-900 mb-1">Video Library</div>
                <div className="text-sm text-gray-600">View all generated videos</div>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 py-12 px-8 text-center">
              <h1 className="text-4xl font-bold text-white mb-4">
                D-ID API Demo
              </h1>
              <p className="text-xl text-white/90">
                Experience the future of AI-powered video avatars
              </p>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    V4 Expressive Avatars
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Create emotional videos with avatars that express different sentiments
                  </p>
                </div>

                <div className="p-6 bg-green-50 rounded-lg border border-green-200">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Realtime Agents
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Build conversational AI with live video avatars and natural interactions
                  </p>
                </div>
              </div>

              <div className="text-center">
                <p className="text-gray-700 mb-6">
                  Sign in to explore D-ID&apos;s cutting-edge avatar technology
                </p>
                <FirebaseAuth />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
