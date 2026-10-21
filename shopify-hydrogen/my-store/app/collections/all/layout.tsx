import type {Metadata} from "next";
import type {ReactNode} from "react";

export const metadata: Metadata = {
  title: "Shop Gratitude Journals, Goal Planners & Wellness Journals",
  description:
    "Shop Velvet Journal Co gratitude journals, goal-setting planners, mindfulness journals, wellness journals and guided notebooks designed for intentional living.",
  alternates: {
    canonical: "/collections/all",
  },
  openGraph: {
    title: "Shop Journals & Planners | Velvet Journal Co",
    description:
      "Discover gratitude journals, goal planners, mindfulness journals and wellness notebooks from Velvet Journal Co.",
    url: "/collections/all",
    type: "website",
  },
};

export default function CatalogLayout({children}: {children: ReactNode}) {
  return children;
}
