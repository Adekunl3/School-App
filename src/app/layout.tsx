"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
// @ts-ignore: CSS global import type declarations not available in this project setup
import "./globals.css";
import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <html lang="en">
      <body className={inter.className}>
        <button
          onClick={toggleTheme}
          className="fixed top-4 right-56 p-2 bg-gray-200 dark:bg-gray-800 rounded-lg"
        >
          Toggle {theme === "light" ? "Dark" : "Light"} Mode
        </button>
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
