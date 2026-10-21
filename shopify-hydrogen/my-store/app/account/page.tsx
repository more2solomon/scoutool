import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Account() {
  return (
    <>
      <Header />
      <main className="charge-shell simple-page">
        <h1>Customer account</h1>
        <p>
          Customer accounts will use Shopify's secure customer-account system.
          Your shopping and checkout data remains with Shopify.
        </p>
        <a className="charge-button inline-button" href="/collections/all">
          Continue shopping
        </a>
      </main>
      <Footer />
    </>
  );
}
