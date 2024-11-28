import type { Metadata } from "next";

import "./globals.css";
import "./../assets/GeneralSans/WEB/css/general-sans.css"
import { ClerkProvider } from "@clerk/nextjs";
import Header from "@/components/Header";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "D-ID API Demo",
  description: "D-ID API Demo: A simple demo for D-ID API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full">
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Arial&family=Helvetica&family=Permanent+Marker&family=Bilbo+Swash+Caps&family=Pacifico&family=Times+New+Roman&family=Verdana&display=swap" rel="stylesheet"></link>
          <link href="https://fonts.googleapis.com/css2?family=Georgia&family=Palatino&family=Garamond&family=Comic+Sans+MS&family=Francois+One&family=Trebuchet+MS&family=Impact&family=Lucida+Sans&display=swap" rel="stylesheet"></link>
          <link href="https://fonts.googleapis.com/css2?family=Tahoma&family=Calibri&family=Cambria&family=Consolas&family=Monaco&family=Century+Gothic&family=Futura&family=Franklin+Gothic&family=Roboto&family=Redressed&display=swap" rel="stylesheet"></link>
          <link href="https://fonts.googleapis.com/css2?family=Lora&family=Open+Sans&family=Montserrat&family=Playfair+Display&family=Quicksand&family=Oswald&family=Anton&family=Poppins&family=Raleway&family=Nunito&display=swap" rel="stylesheet"></link>
          <link href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro&family=Archivo&family=Inter&family=Zilla+Slab&family=Cabin&family=Rubik&family=Dancing+Script&family=Great+Vibes&family=Lobster&family=Pacifico&family=Sacramento&family=Rock+Salt&family=Monoton&family=Satisfy&family=Allura&family=Chewy&display=swap" rel="stylesheet"></link>
        </head>
        <body className="flex flex-col h-full">
          <Header />
          <div className="flex flex-col h-full flex-1 bg-white overflow-y-auto">
            {children}
          </div>
          <Toaster position="top-right" toastOptions={{
            style: {
              fontWeight: 'bold',
              padding: '16px',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            },
            success: {
              style: {
                background: 'linear-gradient(90deg, #4caf50, #81c784)',
                color: '#ffffff',
              },
              iconTheme: {
                primary: '#ffffff',
                secondary: '#4caf50',
              },
            },
            error: {
              style: {
                background: 'linear-gradient(90deg, #f44336, #e57373)',
                color: '#ffffff',
              },
              iconTheme: {
                primary: '#ffffff',
                secondary: '#f44336',
              },
            },
            loading: {
              style: {
                background: 'linear-gradient(90deg, #2196f3, #64b5f6)',
                color: '#ffffff',
              },
              iconTheme: {
                primary: '#ffffff',
                secondary: '#2196f3',
              },
            },
          }} />
        </body>
      </html>
    </ClerkProvider>
  );
}
