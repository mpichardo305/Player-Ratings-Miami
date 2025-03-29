import { Metadata } from 'next';

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
        url: "/invite-preview.jpeg",
        width: 1200,
        height: 630,
        alt: "Join Player Ratings Miami",
      },
    ],
    type: "website",
    url: baseUrl, // Ensure the URL is set for Open Graph
  },
  twitter: {
    card: "summary_large_image", // Use a large image card for better visibility
    title: "You've been invited! - Join the group on Player Ratings Miami",
    description: "Join the group and rate players in Miami's pickup games! ⚽",
    images: [
      {
        url: "/invite-preview.jpeg",
        width: 1200,
        height: 630,
        alt: "Join Player Ratings Miami",
      },
    ],
  },
  icons: [], // Remove any inherited icons
  alternates: {
    canonical: undefined,
  },
  other: {
    'og:image': [], // Remove any conflicting og:image tags (optional, since we're already setting it in openGraph)
  },
};

export default function InviteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}