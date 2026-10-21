import type {Metadata} from "next";
import type {ReactNode} from "react";

export const metadata: Metadata = {
  title: "The Velvet Journal",
  description:
    "Journaling ideas, gratitude prompts, goal-setting guidance, wellness routines and practical inspiration for intentional living.",
  alternates: {
    canonical: "/journal",
  },
};

export default function JournalLayout({children}: {children: ReactNode}) {
  return children;
}
