import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GroupProvider } from './context/GroupContext';
import MobileMenu from "./components/MobileMenu";
import ToastProvider from './components/ToastProvider';
import { Toaster } from "@/components/ui/toaster";
import { Metadata } from "next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Define the base URL for metadata
const baseUrl = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NODE_ENV === 'production'
    ? 'https://player-ratings-miami.vercel.app'
    : 'http://localhost:3000';

// Export metadata for the root layout
export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "Player Ratings Miami",
  description: "Rate and track local soccer players!",
  openGraph: {
    title: "Player Ratings Miami",
    description: "Rate and track local soccer players!",
    url: "https://player-ratings-miami.vercel.app",
    images: [
      {
        url: "/social-preview.jpg", // Note: This should be in the public folder
        width: 1200,
        height: 630,
        alt: "Player Ratings Miami",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Player Ratings Miami",
    description: "Rate and track local soccer players!",
    images: ["/social-preview.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-app-background`}>
        <GroupProvider>
          <div className="relative min-h-screen">
            <MobileMenu />
            {children}
          </div>
        </GroupProvider>
        <ToastProvider />
        <Toaster />
      </body>
    </html>
  );
}