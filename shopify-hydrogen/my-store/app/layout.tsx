import SiteJsonLd from "@/components/SiteJsonLd";
import type {Metadata} from "next";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.velvetjournalco.store";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Velvet Journal Co | Journals & Planners for Intentional Living",
    template: "%s | Velvet Journal Co",
  },
  description:
    "Shop thoughtfully designed gratitude journals, goal-setting planners, wellness journals and guided notebooks from Velvet Journal Co.",
  keywords: [
    "gratitude journal",
    "goal setting journal",
    "wellness journal",
    "mindfulness journal",
    "daily planner",
    "guided journal",
    "Velvet Journal Co",
    "journals and planners",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Velvet Journal Co",
    title: "Velvet Journal Co | Journals & Planners for Intentional Living",
    description:
      "Thoughtfully designed journals and planners for gratitude, goals, mindfulness and intentional living.",
    images: [
      {
        url: "/charge-media/ChatGPT_Image_Jun_5_2026_06_21_36_AM.png",
        width: 1200,
        height: 630,
        alt: "Velvet Journal Co",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Velvet Journal Co",
    description:
      "Journals and planners for gratitude, goals, mindfulness and intentional living.",
    images: ["/charge-media/ChatGPT_Image_Jun_5_2026_06_21_36_AM.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/charge-media/ChatGPT_Image_Jun_5_2026_06_21_36_AM.png",
    apple: "/charge-media/ChatGPT_Image_Jun_5_2026_06_21_36_AM.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{children: React.ReactNode}>) {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Velvet Journal Co",
    url: siteUrl,
    email: "gnewton581@gmail.com",
    logo: `${siteUrl}/charge-media/ChatGPT_Image_Jun_5_2026_06_21_36_AM.png`,
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Velvet Journal Co",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/collections/all?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en">
      <body>
        <SiteJsonLd />
          {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{__html: JSON.stringify(organization)}}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{__html: JSON.stringify(website)}}
        />
      </body>
    </html>
  );
}
