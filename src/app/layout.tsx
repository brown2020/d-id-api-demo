import type { Metadata } from "next";

import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Header from "@/components/Header";
import { Toaster } from "react-hot-toast";
import NgrokReminder from "@/components/NgrokReminder";

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
    <ClerkProvider dynamic>
      <html lang="en" className="h-full">
        <head />
        <body className="flex flex-col h-full">
          <Header />
          <div className="flex flex-col h-full flex-1 bg-white overflow-y-auto">
            <NgrokReminder />
            {children}
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontWeight: "bold",
                padding: "16px",
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              },
              success: {
                style: {
                  background: "linear-gradient(90deg, #4caf50, #81c784)",
                  color: "#ffffff",
                },
                iconTheme: {
                  primary: "#ffffff",
                  secondary: "#4caf50",
                },
              },
              error: {
                style: {
                  background: "linear-gradient(90deg, #f44336, #e57373)",
                  color: "#ffffff",
                },
                iconTheme: {
                  primary: "#ffffff",
                  secondary: "#f44336",
                },
              },
              loading: {
                style: {
                  background: "linear-gradient(90deg, #2196f3, #64b5f6)",
                  color: "#ffffff",
                },
                iconTheme: {
                  primary: "#ffffff",
                  secondary: "#2196f3",
                },
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
