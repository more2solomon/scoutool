# Shopify Storefront

This is a separate Vercel-ready Next.js frontend for Shopify. It is intentionally isolated from the Scout Mail dashboard.

## Local setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Set `SHOPIFY_STOREFRONT_TOKEN` in `.env.local` before starting the app.

## Vercel setup

Create a new Vercel project from this repository and set **Root Directory** to `shopify-storefront`. Add these environment variables for Production, Preview, and Development:

```text
SHOPIFY_STORE_DOMAIN=velvet-journal-co.myshopify.com
SHOPIFY_STOREFRONT_TOKEN=your_storefront_token
SHOPIFY_API_VERSION=2026-07
WORDPRESS_API_URL=https://velvetjournalco.wordpress.com/wp-json
```

Do not use a Shopify Admin API token here. The app uses the Storefront API and sends checkout to Shopify's hosted checkout.

WordPress public posts are loaded from `WORDPRESS_API_URL/wp/v2/posts`. The default URL is already configured for `velvetjournalco.wordpress.com`, so no WordPress token is required for public content.
