export default function Footer() {
  return (
    <>
      <section className="service-strip bottom-service">
        <div className="charge-shell service-grid">
          <div><b>🚚 FREE SHIPPING</b><span>Free for orders over $100</span></div>
          <div><b>◷ CUSTOMER SUPPORT</b><span>Questions? Email our team</span></div>
          <div><b>▣ SHOPIFY CHECKOUT</b><span>Secure checkout and billing</span></div>
          <div><b>☑ SHOP WITH CONFIDENCE</b><span>See our store policies</span></div>
        </div>
      </section>

      <footer className="charge-footer">
        <div className="charge-shell footer-grid">
          <div>
            <h4>◉ &nbsp; Velvet Journal Co</h4>
            <p>Thoughtfully designed journals and planners for intentional living.</p>
          </div>

          <div>
            <h4>✉ &nbsp; Email</h4>
            <p><a href="mailto:gnewton581@gmail.com">gnewton581@gmail.com</a></p>
          </div>

          <div>
            <h4>Newsletter</h4>
            <form className="newsletter">
              <input type="email" placeholder="Your Email..." aria-label="Newsletter email" />
              <button type="button">›</button>
            </form>
          </div>
        </div>
      </footer>

      <div className="footer-bottom">
        <div className="charge-shell footer-bottom-inner">
          <span>© Velvet Journal Co</span>
          <div>
            <a href="/blogs">Journal</a>
            <a href="/policies/shipping-policy">Shipping</a>
            <a href="/policies/refund-policy">Refunds</a>
            <a href="/policies/privacy-policy">Privacy</a>
            <a href="/policies/terms-of-service">Terms</a>
            <a href="/pages/contact">Contact</a>
          </div>
        </div>
      </div>
    </>
  );
}
