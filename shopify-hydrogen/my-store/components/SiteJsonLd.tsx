import JsonLd from "@/components/JsonLd";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://www.velvetjournalco.store";

export default function SiteJsonLd() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "Velvet Journal Co",
    url: SITE_URL,
    logo: `${SITE_URL}/icon.png`,
    email: "gnewton581@gmail.com",
    contactPoint: {
      "@type": "ContactPoint",
      email: "gnewton581@gmail.com",
      contactType: "customer service",
    },
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: "Velvet Journal Co",
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
    inLanguage: "en",
  };

  return <JsonLd data={[organization, website]} />;
}
