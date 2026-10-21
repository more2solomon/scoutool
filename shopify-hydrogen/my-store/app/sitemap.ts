import type {MetadataRoute} from "next";
import {CATALOG} from "@/data/catalog";
import {getAllProducts} from "@/lib/shopify";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://www.velvetjournalco.store";

const STATIC_ROUTES = [
  "/",
  "/collections/all",
  "/pages/about",
  "/pages/contact",
  "/journal",
  "/policies/shipping-policy",
  "/policies/refund-policy",
  "/policies/privacy-policy",
  "/policies/terms-of-service",
];

const JOURNAL_ROUTES = [
  "/journal/how-to-start-a-gratitude-journal",
  "/journal/turn-goals-into-weekly-actions",
  "/journal/journaling-for-a-calmer-routine",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    ...STATIC_ROUTES,
    ...JOURNAL_ROUTES,
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
  }));

  try {
    const products = (await getAllProducts()) as Array<{
      handle?: string;
      updatedAt?: string;
    }>;

    const productEntries: MetadataRoute.Sitemap = products
      .filter((product) => product?.handle)
      .map((product) => ({
        url: `${SITE_URL}/products/${product.handle}`,
        ...(product.updatedAt
          ? {lastModified: new Date(product.updatedAt)}
          : {}),
      }));

    return [...staticEntries, ...productEntries];
  } catch {
    const productEntries: MetadataRoute.Sitemap = Object.keys(CATALOG).map(
      (handle) => ({
        url: `${SITE_URL}/products/${handle}`,
      }),
    );

    return [...staticEntries, ...productEntries];
  }
}
