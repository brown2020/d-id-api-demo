import type { Metadata } from "next";

import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Header from "@/components/Header";

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
          <div className="flex flex-col h-full flex-1 bg-slate-200 overflow-y-auto p-4">
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
