"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const showStandaloneToggle = ["/", "/sign-in", "/logout"].includes(pathname);

  return (
    <html lang="en">
      <body className={inter.className}>
        {showStandaloneToggle && (
          <div className="fixed top-4 right-4 z-10">
            <ThemeToggle />
          </div>
        )}
        {children}
        {/* <Toaster position ="top-right" toastOptions={{
          duration: 10000, // 4 seconds
        }}/> */}
         <Toaster 
          position="top-right"
          toastOptions={{
            duration: 50000, // Consistent duration
            style: {
              background: '#363636',
              color: '#fff',
            },
            error: {
              duration: 50000,
              style: {
                background: '#ef4444',
                color: '#fff',
              },
            },
            success: {
              duration: 3000,
              style: {
                background: '#10b981',
                color: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
