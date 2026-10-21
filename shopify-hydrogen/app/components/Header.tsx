import {Suspense} from 'react';
import {Await, Link, NavLink, useAsyncValue} from 'react-router';
import {type CartViewPayload, useAnalytics, useOptimisticCart} from '@shopify/hydrogen';
import type {HeaderQuery, CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';

interface HeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
}

export function Header({header, isLoggedIn, cart}: HeaderProps) {
  const {open} = useAside();
  return (
    <>
      <div className="charge-announcement">
        <span>Demo announcement message</span>
        <span className="charge-announcement-contact">gnewton581@gmail.com</span>
      </div>
      <header className="charge-header">
        <div className="charge-header-main">
          <Link className="charge-logo" to="/" aria-label="Velvet Journal Co home">
            <img src="/charge-media/ChatGPT_Image_Jun_5_2026_06_21_36_AM.png" alt="Velvet Journal Co" />
          </Link>
          <form className="charge-search" action="/search" method="get">
            <input name="q" aria-label="Search our store" placeholder="Search our store..." />
            <button type="submit" aria-label="Search">⌕</button>
          </form>
          <nav className="charge-account-nav">
            <NavLink to="/account" prefetch="intent">
              <Suspense fallback="Log in">
                <Await resolve={isLoggedIn} errorElement="Log in">
                  {(loggedIn) => (loggedIn ? 'Account' : 'Log in')}
                </Await>
              </Suspense>
            </NavLink>
            <button className="charge-search-mobile" type="button" onClick={() => open('search')}>Search</button>
            <CartToggle cart={cart} />
          </nav>
        </div>
        <nav className="charge-main-menu" aria-label="Main navigation">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/collections/all">Catalog</NavLink>
          <NavLink to="/pages/contact">Contact</NavLink>
        </nav>
      </header>
    </>
  );
}


function CartBadge({count}: {count: number}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();
  return (
    <a href="/cart" onClick={(e) => {
      e.preventDefault();
      open('cart');
      publish('cart_viewed', {cart, prevCart, shop, url: window.location.href || ''} as CartViewPayload);
    }}>
      Cart <span>{count}</span>
    </a>
  );
}

function CartToggle({cart}: Pick<HeaderProps, 'cart'>) {
  return <Suspense fallback={<CartBadge count={0} />}><Await resolve={cart}><CartBanner /></Await></Suspense>;
}

function CartBanner() {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null;
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}

export function HeaderMenu() { return null; }
