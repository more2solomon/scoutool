import type {Metadata} from "next";
import type {ReactNode} from "react";

export const metadata: Metadata = {
  title: "Contact Velvet Journal Co",
  description:
    "Contact Velvet Journal Co for help with journals, planners, orders, shipping and general enquiries.",
  alternates: {
    canonical: "/pages/contact",
  },
};

export default function ContactLayout({children}: {children: ReactNode}) {
  return children;
}
