import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GroupProvider } from './context/GroupContext';
import MobileMenu from "./components/MobileMenu";
import ToastProvider from './components/ToastProvider';
import { Toaster } from "@/components/ui/toaster";
import { Metadata } from "next";
import Head from "next/head";
import { Preloader } from './components/Preloader';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NODE_ENV === 'production'
    ? 'https://player-ratings-miami.vercel.app'
    : 'http://localhost:3000';

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
        url: "/social-preview.jpg",
        width: 1200,
        height: 630,
        alt: "Player Ratings Miami",
        type: "image/jpeg",
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
      <Head>
        <meta property="og:title" content="Player Ratings Miami" />
        <meta property="og:description" content="Rate and track local soccer players!" />
        <meta property="og:image" content={`${baseUrl}/social-preview.jpg`} />
        <meta property="og:url" content="https://player-ratings-miami.vercel.app" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={`${baseUrl}/social-preview.jpg`} />
      </Head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-app-background`}>
        <Preloader />
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