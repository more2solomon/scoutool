#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

echo "Cleaning starter/development-only files..."
rm -f app/favicon.ico app/page.module.css
rm -f public/next.svg public/vercel.svg public/file.svg public/globe.svg public/window.svg
rm -f README_APPLY.txt APPLY.txt
rm -rf .next

echo "Installing the real Shopify favicon..."
FAV="public/charge-media/ChatGPT_Image_Jun_5_2026_06_33_10_AM.png"
if [ -f "$FAV" ]; then
  cp "$FAV" app/icon.png
  echo "Favicon installed."
else
  echo "WARNING: real favicon image was not found at $FAV"
fi

echo "Checking required environment variable names..."
for key in PUBLIC_STORE_DOMAIN PRIVATE_STOREFRONT_API_TOKEN PUBLIC_STOREFRONT_API_TOKEN; do
  if grep -q "^${key}=" .env.local 2>/dev/null; then
    echo "OK $key"
  else
    echo "MISSING LOCALLY $key"
  fi
done

echo "Building..."
npm run build

echo
echo "Repair build complete."
echo "After deploying, visit /api/shopify-health to verify Shopify products."
