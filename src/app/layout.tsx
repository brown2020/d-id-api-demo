import type { Metadata } from "next";

import "./globals.css";
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
        <body className="flex flex-col h-full">
          <Header />
          <div className="flex flex-col h-full flex-1 bg-white overflow-y-auto">
            {children}
          </div>
          <Toaster position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}
