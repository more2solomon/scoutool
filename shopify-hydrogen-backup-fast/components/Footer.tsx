import {Suspense} from 'react';
import {Await, NavLink} from 'react-router';
import type {FooterQuery, HeaderQuery} from 'storefrontapi.generated';

interface FooterProps {
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  publicStoreDomain: string;
}

export function Footer({footer: footerPromise}: FooterProps) {
  return (
    <footer className="charge-footer">
      <div className="charge-footer-main">
        <div className="charge-container charge-footer-grid">
          <div className="charge-footer-contact">
            <span className="charge-footer-icon">⌖</span>
            <div>
              <strong>ADDRESS</strong>
              <p>Online Store<br />Worldwide Shipping</p>
            </div>
          </div>
          <div className="charge-footer-contact">
            <span className="charge-footer-icon">✉</span>
            <div>
              <strong>EMAIL</strong>
              <p>hello@velvetjournalco.com</p>
            </div>
          </div>
          <div className="charge-newsletter">
            <strong>Newsletter</strong>
            <form onSubmit={(e) => e.preventDefault()}>
              <input aria-label="Email" placeholder="Your Email..." type="email" />
              <button aria-label="Subscribe" type="submit">›</button>
            </form>
          </div>
        </div>
      </div>

      <Suspense>
        <Await resolve={footerPromise}>
          {(footer) => (
            <div className="charge-footer-bottom">
              <div className="charge-container charge-footer-bottom-inner">
                <span>© Velvet Journal Co</span>
                <nav>
                  {(footer?.menu?.items || []).slice(0, 4).map((item) => (
                    <NavLink key={item.id} to={item.url || '#'}>
                      {item.title}
                    </NavLink>
                  ))}
                </nav>
              </div>
            </div>
          )}
        </Await>
      </Suspense>
    </footer>
  );
}
