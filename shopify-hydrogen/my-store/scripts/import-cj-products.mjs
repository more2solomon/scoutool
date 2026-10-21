#!/usr/bin/env node
/**
 * Import dropshipping products from CJ Dropshipping into Shopify.
 *
 * Usage:
 *   node scripts/import-cj-products.mjs --keyword "journal" --limit 5 --markup 3 --dry-run
 *
 * Options:
 *   --keyword   CJ search keyword (default: "journal")
 *   --limit     Number of CJ products to import (default: 3)
 *   --markup    Price multiplier over CJ sell price (default: env DROPSHIP_MARKUP or 3)
 *   --min-price Floor price (default: env DROPSHIP_MIN_PRICE or 19.99)
 *   --status    Shopify product status: active | draft (default: active)
 *   --page      CJ result page (default: 1)
 *   --dry-run   Print what would be created without creating anything
 *
 * Required environment (env file in my-store/ is loaded automatically):
 *   CJ_API_KEY                       CJ Dropshipping API key
 *   PUBLIC_STORE_DOMAIN              your-store.myshopify.com
 *   SHOPIFY_ADMIN_ACCESS_TOKEN       (optional) legacy admin token
 *   SHOPIFY_ADMIN_CLIENT_ID / _SECRET (or the token above)
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function loadEnvFile(file) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) return;
  for (const line of fs.readFileSync(full, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(match[1] in process.env)) process.env[match[1]] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const args = process.argv.slice(2);
function argValue(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const KEYWORD = argValue("--keyword", "journal");
const LIMIT = Number(argValue("--limit", "3"));
const MARKUP = Number(argValue("--markup", process.env.DROPSHIP_MARKUP || "3"));
const MIN_PRICE = Number(argValue("--min-price", process.env.DROPSHIP_MIN_PRICE || "19.99"));
const STATUS = argValue("--status", "active");
const PAGE = Number(argValue("--page", "1"));
const DRY_RUN = args.includes("--dry-run");

const CJ_BASE = "https://developers.cjdropshipping.com/api2.0/v1";
const API_VERSION = process.env.SHOPIFY_API_VERSION || "2026-07";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function priceWithMarkup(cost) {
  const value = Math.max(Number(cost) * MARKUP, MIN_PRICE);
  return Math.max(0.99, Math.ceil(value) - 0.01).toFixed(2);
}

async function cjGetAccessToken() {
  const apiKey = process.env.CJ_API_KEY?.trim();
  if (!apiKey) fail("CJ_API_KEY is not set (get it from cjdropshipping.com → My CJ → API)");

  const res = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({apiKey}),
  });
  const data = await res.json().catch(() => ({}));
  if (!data.success || !data.data?.accessToken) {
    fail(`CJ authentication failed: ${data.message || res.status}`);
  }
  return data.data.accessToken;
}

async function cjGet(pathname, token, params = {}) {
  const url = new URL(`${CJ_BASE}${pathname}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  const res = await fetch(url, {
    headers: {"CJ-Access-Token": token, "Content-Type": "application/json"},
  });
  const data = await res.json().catch(() => ({}));
  await sleep(1100); // CJ rate limit: 1 request per second
  if (!data.success) {
    throw new Error(`CJ ${pathname} failed: ${data.message || res.status}`);
  }
  return data.data;
}

async function shopifyAdminToken() {
  const direct = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim();
  if (direct) return direct;

  const clientId = process.env.SHOPIFY_ADMIN_CLIENT_ID?.trim();
  const clientSecret = process.env.SHOPIFY_ADMIN_CLIENT_SECRET?.trim();
  const shop = (process.env.PUBLIC_STORE_DOMAIN || "").trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!shop) fail("PUBLIC_STORE_DOMAIN is not set");
  if (!clientId || !clientSecret) {
    fail("Set SHOPIFY_ADMIN_ACCESS_TOKEN or SHOPIFY_ADMIN_CLIENT_ID + SHOPIFY_ADMIN_CLIENT_SECRET");
  }

  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    fail(`Shopify token exchange failed: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

async function shopifyFetch(token, pathname, options = {}) {
  const shop = (process.env.PUBLIC_STORE_DOMAIN || "").trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  const res = await fetch(`https://${shop}/admin/api/${API_VERSION}${pathname}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Shopify ${pathname} ${res.status}: ${JSON.stringify(data).slice(0, 400)}`);
  }
  return data;
}

function collectImages(product) {
  const raw = [
    ...(product.images || []),
    ...(product.productImage ? [product.productImage] : []),
    ...(product.image ? [product.image] : []),
  ];
  const urls = [];
  for (const image of raw) {
    const url = typeof image === "string" ? image : image.url || image.image || image.bigSizeImage;
    if (url && /^https?:\/\//.test(url) && !urls.includes(url)) urls.push(url);
  }
  return urls.slice(0, 8);
}

async function main() {
  console.log(
    `Importing up to ${LIMIT} CJ product(s) for "${KEYWORD}" (markup ×${MARKUP}, min $${MIN_PRICE}, status ${STATUS})${DRY_RUN ? " [DRY RUN]" : ""}`,
  );

  const cjToken = await cjGetAccessToken();

  const search = await cjGet("/product/listV2", cjToken, {
    keyWord: KEYWORD,
    page: PAGE,
    size: Math.max(LIMIT * 3, 20),
    features: "enable_description",
    orderBy: "1",
  });

  const results = search?.productList || [];
  if (!results.length) fail(`No CJ results for "${KEYWORD}"`);

  const adminToken = DRY_RUN ? null : await shopifyAdminToken();

  const existingHandles = new Set();
  if (adminToken) {
    let after = "";
    for (;;) {
      const query = `{ products(first: 100${after ? `, after: "${after}"` : ""}) { nodes { handle } pageInfo { hasNextPage endCursor } } }`;
      const data = await shopifyFetch(adminToken, "/graphql.json", {
        method: "POST",
        body: JSON.stringify({query}),
      });
      for (const node of data.data?.products?.nodes || []) existingHandles.add(node.handle);
      const pageInfo = data.data?.products?.pageInfo;
      if (!pageInfo?.hasNextPage) break;
      after = pageInfo.endCursor;
      if (!after) break;
    }
  }

  let imported = 0;
  for (const item of results) {
    if (imported >= LIMIT) break;
    const pid = item.pid;
    if (!pid) continue;

    let detail;
    try {
      detail = await cjGet("/product/query", cjToken, {pid, features: "enable_description,enable_video"});
    } catch (error) {
      console.warn(`  ! detail failed for ${pid}: ${error.message}`);
      continue;
    }

    const title = String(detail.productNameEn || detail.productName || "").trim();
    if (!title) continue;

    let handle = slugify(title) || `cj-${pid.slice(0, 8).toLowerCase()}`;
    if (existingHandles.has(handle)) {
      console.log(`  = skip (already in store): ${title}`);
      continue;
    }

    let variants = detail.variants || [];
    if (!variants.length) {
      try {
        variants = (await cjGet("/product/variant/query", cjToken, {pid})) || [];
      } catch {
        variants = [];
      }
    }
    if (!variants.length) {
      console.warn(`  ! no variants for ${title}`);
      continue;
    }

    const images = collectImages(detail);
    const cost = Number(detail.sellPrice || variants[0].sellPrice || 0);
    const bodyHtml = detail.productDesc || `<p>${title} — dropshipped via CJ Dropshipping.</p>`;

    const shopifyVariants = variants.slice(0, 50).map((variant) => {
      const variantCost = Number(variant.sellPrice || cost);
      const label =
        variant.name ||
        variant.enName ||
        variant.combination ||
        variant.sku ||
        "Default";
      return {
        option1: label,
        price: priceWithMarkup(variantCost),
        sku: `CJ-${variant.sku || pid}`,
        inventory_management: "shopify",
        inventory_quantity: Number(variant.stock || variant.stockNum || 100),
        ...(variant.productImage || variant.image
          ? {featured_image: {src: variant.productImage || variant.image}}
          : {}),
        metafields: variant.vid
          ? [{namespace: "custom", key: "cj_vid", value: String(variant.vid), type: "string"}]
          : [],
      };
    });

    const productPayload = {
      product: {
        title,
        body_html: bodyHtml,
        vendor: "Velvet Journal Co",
        product_type: detail.categoryName || "Journals",
        tags: "dropshipping, cj, cjdropshipping",
        status: STATUS,
        handle,
        ...(images.length ? {images: images.map((src) => ({src}))} : {}),
        ...(shopifyVariants.length > 1 ? {options: [{name: "Style"}]} : {}),
        variants:
          shopifyVariants.length > 1
            ? shopifyVariants
            : shopifyVariants.map((variant) => ({...variant, option1: undefined})),
        metafields: [
          {namespace: "custom", key: "cj_pid", value: String(pid), type: "string"},
        ],
      },
    };

    console.log(`  + ${title} — $${productPayload.product.variants[0].price} (CJ cost ~$${cost})`);

    if (DRY_RUN) continue;

    const created = await shopifyFetch(adminToken, "/products.json", {
      method: "POST",
      body: JSON.stringify(productPayload),
    });
    existingHandles.add(handle);
    imported += 1;
    console.log(`    → created product ${created.product?.id} (/${handle})`);
  }

  console.log(
    DRY_RUN
      ? `Dry run complete — ${results.length} candidate(s) reviewed.`
      : `Done — ${imported} product(s) imported.`,
  );
}

main().catch((error) => fail(error.message));
