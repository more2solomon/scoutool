import type {Metadata} from "next";
import type {ReactNode} from "react";

export const metadata: Metadata = {
  title: "About Velvet Journal Co",
  description:
    "Discover Velvet Journal Co, a journal and planner brand focused on gratitude, goal setting, wellness, reflection and intentional living.",
  alternates: {
    canonical: "/pages/about",
  },
};

export default function AboutLayout({children}: {children: ReactNode}) {
  return children;
}
