import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ShippingPolicyPage() {
  return (
    <>
      <Header/>
      <main className="charge-shell policy-page simple-page">
        <h1>Shipping Policy</h1>
        <p>Last updated: September 8, 2026</p>

        <h2>Where we ship</h2>
        <p>Velvet Journal Co accepts orders for destinations available through our checkout. Availability can vary by destination.</p>

        <h2>Shipping charges</h2>
        <p>Any applicable shipping charge must be shown before payment. Promotional free-shipping offers apply only when the order meets the stated eligibility requirements.</p>

        <h2>Delivery information</h2>
        <p>Please enter a complete and accurate delivery address. Delivery timing can vary by destination, carrier availability, customs, public holidays, and circumstances outside our direct control.</p>

        <h2>International orders</h2>
        <p>Customs duties, import taxes, or other local charges may apply depending on the destination and are the customer's responsibility unless expressly stated otherwise at checkout.</p>

        <h2>Address changes</h2>
        <p>If you notice an address error after ordering, contact us immediately. We cannot guarantee changes once an order has entered fulfilment.</p>

        <h2>Support</h2>
        <p>Email <a href="mailto:gnewton581@gmail.com">gnewton581@gmail.com</a> and include your payment reference when available.</p>
      </main>
      <Footer/>
    </>
  );
}
