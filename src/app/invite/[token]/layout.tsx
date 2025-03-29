import { Metadata } from 'next';
import Head from 'next/head';

const baseUrl = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NODE_ENV === 'production'
    ? 'https://player-ratings-miami.vercel.app'
    : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "You've been invited! - Join the group on Player Ratings Miami",
  description: "Join the group and rate players in Miami's pickup games!",
  openGraph: {
    title: "You've been invited! - Join the group on Player Ratings Miami",
    description: "Join the group and rate players in Miami's pickup games!",
    siteName: "Player Ratings Miami",
    images: [
      {
        url: "/invite-preview.jpg",
        width: 1200,
        height: 630,
        alt: "Join Player Ratings Miami",
      },
    ],
    type: "website",
    url: baseUrl,
  },
  twitter: null,
  icons: [],
  alternates: {
    canonical: undefined,
  },
};

export default function InviteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Head>
        <meta
          property="og:title"
          content="You've been invited! - Join the group on Player Ratings Miami"
        />
        <meta
          property="og:description"
          content="Join the group and rate players in Miami's pickup games!"
        />
        <meta
          property="og:image"
          content={`${baseUrl}/invite-preview.jpg`}
        />
        <meta property="og:url" content={baseUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Player Ratings Miami" />
      </Head>
      {children}
    </>
  );
}