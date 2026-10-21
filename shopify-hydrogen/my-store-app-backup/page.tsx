type Product = {
  id: string;
  title: string;
  handle: string;
  featuredImage?: {
    url: string;
    altText?: string | null;
  } | null;
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
};

async function getProducts(): Promise<Product[]> {
  const domain = process.env.PUBLIC_STORE_DOMAIN;
  const token = process.env.PRIVATE_STOREFRONT_API_TOKEN;

  if (!domain || !token) return [];

  const res = await fetch(
    `https://${domain}/api/2026-07/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Shopify-Storefront-Private-Token": token,
      },
      body: JSON.stringify({
        query: `
          query {
            products(first: 12) {
              nodes {
                id
                title
                handle
                featuredImage {
                  url
                  altText
                }
                priceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        `,
      }),
      cache: "no-store",
    }
  );

  const json = await res.json();
  return json?.data?.products?.nodes || [];
}

export default async function Home() {
  const products = await getProducts();

  return (
    <main style={{maxWidth:1200, margin:"auto", padding:24}}>
      <header style={{
        display:"flex",
        justifyContent:"space-between",
        alignItems:"center",
        padding:"20px 0"
      }}>
        <h2>Velvet Journal Co</h2>

        <nav style={{display:"flex", gap:24}}>
          <a href="/">Home</a>
          <a href="/collections/all">Catalog</a>
          <a href="/pages/contact">Contact</a>
          <a href="/account">Log in</a>
        </nav>
      </header>

      <section style={{
        minHeight:480,
        backgroundImage:
          "url('/charge-media/ChatGPT_Image_Jun_5_2026_06_21_36_AM.png')",
        backgroundSize:"cover",
        backgroundPosition:"center",
        display:"flex",
        alignItems:"center",
        padding:48
      }}>
        <div>
          <h1 style={{fontSize:54, maxWidth:520}}>
            Design Your Best Life, One Page at a Time
          </h1>
          <p>
            Beautiful journals and planners for intentional living.
          </p>
        </div>
      </section>

      <h2 style={{marginTop:60}}>Our favourite products</h2>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(4, 1fr)",
        gap:20
      }}>
        {products.map((product) => (
          <a
            key={product.id}
            href={`/products/${product.handle}`}
            style={{color:"inherit", textDecoration:"none"}}
          >
            {product.featuredImage && (
              <img
                src={product.featuredImage.url}
                alt={product.featuredImage.altText || product.title}
                style={{
                  width:"100%",
                  aspectRatio:"1 / 1",
                  objectFit:"cover"
                }}
              />
            )}

            <h3>{product.title}</h3>

            <p>
              {product.priceRange.minVariantPrice.currencyCode}{" "}
              {product.priceRange.minVariantPrice.amount}
            </p>
          </a>
        ))}
      </section>
    </main>
  );
}
