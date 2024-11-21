"use client";

import { useAuthStore } from "@/zustand/useAuthStore";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import Footer from "./Footer";
import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import * as fabric from 'fabric';
import { useWatch } from "react-hook-form";

export default function Home() {
  const uid = useAuthStore((state) => state.uid);
  const photoUrl = useAuthStore((state) => state.authPhotoUrl);
  const firebaseUid = useAuthStore((state) => state.firebaseUid);
  const fullName = useAuthStore((state) => state.authDisplayName);
  const [loading, setLoading] = useState(false);
  const handleClick = () => {
    setLoading(true);
  };
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);

  const onAddCircle = useCallback(() => {
    if (canvas) {
      fabric.FabricImage.fromURL('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSX5vnHdn0pL9uBJQRDMTqVEBux0hrUsUbYHQ&s', { crossOrigin: 'anonymous' })
        .then((img) => {
          if(canvasContainerRef.current !== null){
            // Get screen dimensions
            const screenWidth = canvasContainerRef.current.clientWidth;
            const screenHeight = canvasContainerRef.current.clientHeight;
  
            // Get original image dimensions
            const imageWidth = img.width;
            const imageHeight = img.height;
  
            // Calculate scaling factor to fit the image within the screen size
            const scaleFactor = Math.min(screenWidth / imageWidth, screenHeight / imageHeight);
  
            // If the image is larger than the screen, scale it down
            const scaledWidth = imageWidth * scaleFactor;
            const scaledHeight = imageHeight * scaleFactor;
            
            // Set the new dimensions for the canvas
            canvas.setWidth(scaledWidth);
            canvas.setHeight(scaledHeight);
            canvas?.renderAll();
  
            // Add the image to the canvas with the scaled dimensions
            img.set({
              scaleX: scaleFactor,
              scaleY: scaleFactor,
            });
            canvas.add(img);
          }
        });
    }
  }, [canvas])
  
  const onAddRectangle = () => {
    setCanvasDimensions(500, { width: 16, height: 9 });
  }

  const setCanvasDimensions = (
    widthOrHeight: number,
    aspectRatio: { width: number, height: number }
  ) => {
    const container = canvasContainerRef.current;
    if (canvas && container) {
      let width, height;
  
      // Calculate width and height based on the aspect ratio
      if (widthOrHeight === aspectRatio.width) {
        height = (widthOrHeight * aspectRatio.height) / aspectRatio.width;
        width = widthOrHeight;
      } else {
        width = (widthOrHeight * aspectRatio.width) / aspectRatio.height;
        height = widthOrHeight;
      }
  
      // Get the container's width and height
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;
  
      // Check if the calculated dimensions exceed the container's size
      if (width > containerWidth) {
        const scale = containerWidth / width;
        width = containerWidth;
        height = height * scale; // Scale height based on width adjustment
      }
  
      if (height > containerHeight) {
        const scale = containerHeight / height;
        height = containerHeight;
        width = width * scale; // Scale width based on height adjustment
      }
  
      // Set the calculated width and height for the canvas
      canvas.setWidth(width);
      canvas.setHeight(height);
  
      canvas.renderAll();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (canvas !== null) {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
          canvas.remove(activeObject);
          canvas.renderAll();
        }
      }
    }
  };

  // Feet to image
  // Square
  // Landscape
  // Portrait

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: canvasRef.current.width,
      });
      setCanvas(canvas);
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    }
  }, [canvas])

  return (<>

    {/* <div className="font-medium text-[32px] max-xs:text-2xl max-xs:text-center">D-ID API Demo</div> */}

    <SignedIn>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center h-full gap-[100px] px-[30px]">
          <div className="flex flex-col gap-[30px] bg-white shadow-pop-up-shadow rounded-2xl p-[30px] max-w-[616px] w-full">
            <h2 className="text-center font-medium  text-[26px] max-xs:text-[22px]">D-ID API Demo</h2>

            <div >
              <button onClick={onAddCircle}>Add circle</button>
              <button onClick={onAddRectangle}>Add Rectangle</button>
              <div ref={canvasContainerRef} className="h-96 w-full">
                <canvas className="border-2 border-gray-500 w-full h-full" ref={canvasRef} id="fabricCanvas"  />
              </div>
            </div>

            {/* <div className="flex flex-col items-center mb-[10px] gap-2">
              <div className="w-20 h-20 rounded-full overflow-hidden">
                {photoUrl ? (
                  <Image
                    src={photoUrl}
                    width={256}
                    height={256}
                    alt={"user"}
                    priority
                  />
                ) : <div className="bg-gray-300 animate-pulse rounded-lg w-20 h-20 mx-auto" />}
              </div>
              <div className="text-center mt-[10px] text-[22px] max-xs:text-lg">{fullName}</div>

              <div className="w-full">
                <div className="text-base max-xs:text-sm">Clerk User</div>
                <div className="text-xs max-xs:text-sm py-[10px] overflow-auto px-[15px] text-[#1E1E1E] bg-lightGray rounded-lg">
                  {uid ? (
                    uid
                  ) : (
                    <div className="bg-gray-300 animate-pulse h-6 w-full rounded-lg" />
                  )}
                </div>
              </div>

              <div className="w-full">
                <div className="text-base max-xs:text-sm">Firebase User</div>
                <div className="text-xs max-xs:text-sm py-[10px] overflow-auto px-[15px] text-[#1E1E1E] bg-lightGray rounded-lg">
                  {firebaseUid ? (
                    firebaseUid
                  ) : (
                    <div className="bg-gray-300 animate-pulse h-6 w-full rounded-lg" />
                  )}
                </div>
              </div>
            </div> */}

            <div className="flex justify-center">
              {firebaseUid && (
                <div className="p-2 bg-blue-500 text-white rounded-md text-center">
                  <Link href="/avatars" onClick={handleClick}>
                    <div className="bg-blue-500 text-white rounded-lg px-8 text-center flex justify-center items-center">
                      {loading ? (
                        <LoaderCircle
                          className={`animate-spin transition`}
                        />
                      ) : (
                        "Avatars"
                      )}
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SignedIn>

    <SignedOut>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center h-full gap-[100px] px-[30px]">
          <div className="flex flex-col gap-[30px] bg-white shadow-pop-up-shadow rounded-2xl p-[30px] max-w-[616px] w-full">
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
          </div>
        </div>
      </div>
    </SignedOut>
    <Footer />
  </>
  );
}
