import type {Metadata} from "next";
import type {ReactNode} from "react";

export const metadata: Metadata = {
  title: "Shipping Policy",
  description:
    "Read the Velvet Journal Co shipping policy, including delivery information, shipping charges, international orders and address support.",
  alternates: {
    canonical: "/policies/shipping-policy",
  },
};

export default function ShippingPolicyLayout({children}: {children: ReactNode}) {
  return children;
}
