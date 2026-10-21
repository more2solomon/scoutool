#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "=== Velvet Journal Co comprehensive SEO ==="

python3 - <<'PY'
from pathlib import Path

layout = Path("app/layout.tsx")

if layout.exists():
    s = layout.read_text()

    if "SiteJsonLd" not in s:
        s = 'import SiteJsonLd from "@/components/SiteJsonLd";\n' + s

        if "{children}" in s:
            s = s.replace(
                "{children}",
                "<SiteJsonLd />\n          {children}",
                1,
            )
        else:
            print("⚠ Could not inject SiteJsonLd into app/layout.tsx automatically.")

    if (
        "export const metadata" not in s
        and "generateMetadata" not in s
        and '"use client"' not in s[:200]
        and "'use client'" not in s[:200]
    ):
        if 'import type {Metadata} from "next";' not in s:
            s = 'import type {Metadata} from "next";\n' + s

        marker = "export default"
        metadata = '''
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://www.velvetjournalco.store";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "Velvet Journal Co | Gratitude Journals, Goal Planners & Wellness Journals",
    template: "%s | Velvet Journal Co",
  },
  description:
    "Shop thoughtfully designed gratitude journals, goal-setting planners, mindfulness journals and wellness notebooks for intentional living.",
  applicationName: "Velvet Journal Co",
  category: "shopping",
  openGraph: {
    type: "website",
    siteName: "Velvet Journal Co",
    url: SITE_URL,
    title:
      "Velvet Journal Co | Journals & Planners for Intentional Living",
    description:
      "Gratitude journals, goal planners, mindfulness journals and guided notebooks designed for intentional living.",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Velvet Journal Co | Journals & Planners for Intentional Living",
    description:
      "Gratitude journals, goal planners, mindfulness journals and guided notebooks designed for intentional living.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        google:
          process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
      }
    : undefined,
};

'''
        if marker in s:
            s = s.replace(marker, metadata + marker, 1)

    layout.write_text(s)
    print("✅ Root layout SEO checked")
else:
    print("⚠ app/layout.tsx not found")

home = Path("app/page.tsx")

if home.exists():
    s = home.read_text()
    client = (
        '"use client"' in s[:200]
        or "'use client'" in s[:200]
    )

    if (
        not client
        and "export const metadata" not in s
        and "generateMetadata" not in s
    ):
        if 'import type {Metadata} from "next";' not in s:
            s = 'import type {Metadata} from "next";\n' + s

        metadata = '''
export const metadata: Metadata = {
  title:
    "Gratitude Journals, Goal Planners & Wellness Journals",
  description:
    "Discover Velvet Journal Co gratitude journals, goal-setting planners, mindfulness journals and wellness notebooks designed for reflection, growth and intentional living.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title:
      "Velvet Journal Co | Journals & Planners for Intentional Living",
    description:
      "Shop gratitude journals, goal planners, mindfulness journals and guided notebooks for intentional living.",
    url: "/",
    type: "website",
  },
};

'''
        marker = "export default"
        if marker in s:
            s = s.replace(marker, metadata + marker, 1)
            home.write_text(s)
            print("✅ Homepage metadata added")
    else:
        print("✅ Homepage already has metadata or is client-rendered")

css = Path("app/globals.css")
extra = Path("app/seo-extra.css")

if css.exists() and extra.exists():
    current = css.read_text()
    addition = extra.read_text()

    if "SEO/content presentation helpers" not in current:
        css.write_text(current + "\n\n" + addition)
        print("✅ SEO article styles added")

    extra.unlink()
PY

echo
echo "=== SEO route checks ==="

for path in \
  app/robots.ts \
  app/sitemap.ts \
  app/manifest.ts \
  app/products/'[handle]'/page.tsx \
  app/journal/page.tsx \
  app/journal/'[slug]'/page.tsx
do
  test -f "$path" && echo "✅ $path" || echo "❌ $path missing"
done

echo
echo "=== Build ==="
rm -rf .next
npm run build

echo
echo "✅ Comprehensive SEO patch installed."
echo "Deploy with:"
echo "npx vercel@latest --prod"
echo
echo "After deployment check:"
echo "https://www.velvetjournalco.store/robots.txt"
echo "https://www.velvetjournalco.store/sitemap.xml"
