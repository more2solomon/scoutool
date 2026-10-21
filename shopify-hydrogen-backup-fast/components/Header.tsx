import {Suspense} from 'react';
import {Await, NavLink, useAsyncValue} from 'react-router';
import {
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
} from '@shopify/hydrogen';
import type {HeaderQuery, CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';

interface HeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
}

type Viewport = 'desktop' | 'mobile';

export function Header({
  header,
  isLoggedIn,
  cart,
  publicStoreDomain,
}: HeaderProps) {
  const {menu} = header;
  const {open} = useAside();

  return (
    <header className="charge-header-shell">
      <div className="charge-topbar">
        <div className="charge-header-width charge-topbar-inner">
          <span>Demo announcement message</span>
          <div className="charge-topbar-contacts">
            <span>☎ +1 123 456 7890</span>
            <span>✉ hello@velvetjournalco.com</span>
          </div>
        </div>
      </div>

      <div className="charge-main-header">
        <div className="charge-header-width charge-main-header-inner">
          <HeaderMenuMobileToggle />

          <NavLink className="charge-logo" prefetch="intent" to="/" end>
            <img
              src="/charge-media/ChatGPT_Image_Jun_5_2026_06_21_36_AM.png"
              alt="Velvet Journal Co"
            />
          </NavLink>

          <button
            className="charge-search-box"
            type="button"
            onClick={() => open('search')}
            aria-label="Open search"
          >
            <span>Search our store...</span>
            <b>⌕</b>
          </button>

          <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} />
        </div>
      </div>

      <div className="charge-nav-row">
        <div className="charge-header-width">
          <HeaderMenu
            menu={menu}
            viewport="desktop"
            primaryDomainUrl={header.shop.primaryDomain.url}
            publicStoreDomain={publicStoreDomain}
          />
        </div>
      </div>
    </header>
  );
}

export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
}: {
  menu: HeaderProps['header']['menu'];
  primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
  viewport: Viewport;
  publicStoreDomain: HeaderProps['publicStoreDomain'];
}) {
  const className = `header-menu-${viewport}`;
  const {close} = useAside();
  const items = menu?.items || FALLBACK_HEADER_MENU.items;

  return (
    <nav className={className} role="navigation">
      {viewport === 'mobile' && (
        <NavLink end onClick={close} prefetch="intent" to="/">
          Home
        </NavLink>
      )}
      {items.map((item, index) => {
        if (!item.url) return null;

        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;

        return (
          <NavLink
            className={`header-menu-item ${index === 0 ? 'first-item' : ''}`}
            end
            key={item.id}
            onClick={close}
            prefetch="intent"
            to={url}
          >
            {item.title}
          </NavLink>
        );
      })}
    </nav>
  );
}

function HeaderCtas({
  isLoggedIn,
  cart,
}: Pick<HeaderProps, 'isLoggedIn' | 'cart'>) {
  const {open} = useAside();
  return (
    <nav className="header-ctas" role="navigation">
      <NavLink prefetch="intent" to="/account" className="charge-account-link">
        <Suspense fallback="Log in">
          <Await resolve={isLoggedIn} errorElement="Log in">
            {(loggedIn) => (loggedIn ? 'Account' : 'Log in')}
          </Await>
        </Suspense>
      </NavLink>
      <button className="charge-icon-button" onClick={() => open('search')}>
        Search
      </button>
      <CartToggle cart={cart} />
    </nav>
  );
}

function HeaderMenuMobileToggle() {
  const {open} = useAside();
  return (
    <button
      className="header-menu-mobile-toggle charge-mobile-menu"
      onClick={() => open('mobile')}
      aria-label="Open menu"
    >
      ☰
    </button>
  );
}

function CartBadge({count}: {count: number}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <a
      className="charge-cart-link"
      href="/cart"
      onClick={(e) => {
        e.preventDefault();
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        } as CartViewPayload);
      }}
    >
      Cart <span>{count}</span>
    </a>
  );
}

function CartToggle({cart}: Pick<HeaderProps, 'cart'>) {
  return (
    <Suspense fallback={<CartBadge count={0} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null;
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}

const FALLBACK_HEADER_MENU = {
  items: [
    {id: 'home', title: 'Home', url: '/', items: []},
    {id: 'catalog', title: 'Catalog', url: '/collections/all', items: []},
    {id: 'contact', title: 'Contact', url: '/pages/contact', items: []},
  ],
};
