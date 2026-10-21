import type {Metadata} from "next";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {getPage} from "@/lib/shopify";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{handle: string}>;
}): Promise<Metadata> {
  const {handle} = await params;
  const page = await getPage(handle);
  if (!page) return {};

  return {
    title: page.seo?.title || page.title,
    description:
      page.seo?.description ||
      page.bodySummary ||
      `${page.title} | Velvet Journal Co`,
    alternates: {canonical: `/pages/${page.handle}`},
  };
}

export default async function ShopifyPage({
  params,
}: {
  params: Promise<{handle: string}>;
}) {
  const {handle} = await params;
  const page = await getPage(handle);
  if (!page) notFound();

  return (
    <>
      <Header />
      <main className="charge-shell simple-page">
        <h1>{page.title}</h1>
        <div
          className="rich-text"
          dangerouslySetInnerHTML={{__html: page.body}}
        />
      </main>
      <Footer />
    </>
  );
}
