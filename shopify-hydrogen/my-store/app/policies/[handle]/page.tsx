import type {Metadata} from "next";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {getPolicy} from "@/lib/shopify";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{handle: string}>;
}): Promise<Metadata> {
  const {handle} = await params;
  const policy = await getPolicy(handle);
  if (!policy) return {};

  return {
    title: policy.title,
    description: `${policy.title} for Velvet Journal Co.`,
    alternates: {canonical: `/policies/${policy.handle}`},
  };
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{handle: string}>;
}) {
  const {handle} = await params;
  const policy = await getPolicy(handle);
  if (!policy) notFound();

  return (
    <>
      <Header />
      <main className="charge-shell simple-page policy-page">
        <h1>{policy.title}</h1>
        <div
          className="rich-text"
          dangerouslySetInnerHTML={{__html: policy.body}}
        />
      </main>
      <Footer />
    </>
  );
}
