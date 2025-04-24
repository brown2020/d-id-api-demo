import type { Metadata } from "next";

import "./globals.css";
import "../assets/GeneralSans/WEB/css/general-sans.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Toaster } from "react-hot-toast";
import NgrokReminder from "../components/NgrokReminder";
import { FirebaseAuthProvider } from "../components/FirebaseAuthProvider";

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
    <FirebaseAuthProvider>
      <html lang="en" className="h-full">
        <head />
        <body className="flex flex-col min-h-screen font-sans">
          <Header />
          <main className="flex flex-col flex-grow bg-white">
            <NgrokReminder />
            <div className="flex-grow">{children}</div>
          </main>
          <Footer />
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
    </FirebaseAuthProvider>
  );
}
