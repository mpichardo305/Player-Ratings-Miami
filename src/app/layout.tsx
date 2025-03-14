"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GroupProvider } from './context/GroupContext';
import MobileMenu from "./components/MobileMenu";
import ToastProvider from './components/ToastProvider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta property="og:title" content="Player Ratings Miami" />
        <meta property="og:description" content="Rate and track local soccer players!" />
        <meta property="og:image" content="https://player-ratings-miami.vercel.app/social-preview.jpg" />
        <meta property="og:url" content="https://player-ratings-miami.vercel.app" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://player-ratings-miami.vercel.app/social-preview.jpg" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-app-background`}>
        <GroupProvider>
          <div className="relative min-h-screen">
            <MobileMenu />
            {children}
          </div>
        </GroupProvider>
        <ToastProvider />
      </body>
    </html>
  );
}