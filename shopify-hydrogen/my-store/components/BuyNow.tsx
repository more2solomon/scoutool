"use client";

import {useRouter} from "next/navigation";

export default function BuyNow({
  handle,
}: {
  handle: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      className="buy-now-button"
      onClick={() => router.push(`/checkout?product=${encodeURIComponent(handle)}`)}
    >
      Buy now
    </button>
  );
}
