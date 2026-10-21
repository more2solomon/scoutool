import {Link} from 'react-router';

export function Footer() {
  return (
    <>
      <section className="charge-service-strip">
        <div><b>▣ FREE SHIPPING</b><span>Free for orders over 100$</span></div>
        <div><b>◷ 24/7 Support</b><span>Fast, professional support</span></div>
        <div><b>□ CHOOSE DELIVERY DATE</b><span>Flexible delivery date</span></div>
        <div><b>✓ EXTENDED SUPPORT PERIOD</b><span>30 days return policy</span></div>
      </section>
      <footer className="charge-footer">
        <div className="charge-footer-inner">
          <div><strong>Address</strong><p>Online Store<br/>Worldwide Shipping</p></div>
          <div><strong>Email</strong><p><a href="mailto:gnewton581@gmail.com">gnewton581@gmail.com</a></p></div>
          <div className="charge-newsletter"><strong>Newsletter</strong><form><input type="email" placeholder="Your Email..."/><button type="submit">›</button></form></div>
        </div>
        <div className="charge-footer-bottom">
          <span>© Velvet Journal Co</span>
          <nav><Link to="/search">Search</Link><Link to="/policies/privacy-policy">Your Privacy Choices</Link><Link to="/collections/all">Shop</Link></nav>
        </div>
      </footer>
    </>
  );
}
