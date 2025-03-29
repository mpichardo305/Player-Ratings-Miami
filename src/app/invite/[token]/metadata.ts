import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { token: string } }): Promise<Metadata> {
  const baseUrl = 'https://player-ratings-miami.vercel.app'
  const imageUrl = `${baseUrl}/invite-preview.jpg`

  return {
    title: "You've been invited! - Join the group on Player Ratings Miami",
    description: "Join the group and rate players in Miami's pickup games!",
    openGraph: {
      title: "You've been invited! - Join the group on Player Ratings Miami",
      description: "Join the group and rate players in Miami's pickup games!",
      url: `${baseUrl}/invite/${params.token}`,
      siteName: "Player Ratings Miami",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: "Join Player Ratings Miami",
        }
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "You've been invited! - Join group on Player Ratings Miami",
      description: "Join the group and rate players in Miami's pickup games!",
      images: [imageUrl],
    },
  }
}