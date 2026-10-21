import {Await, Link} from 'react-router';
import {Suspense, useId} from 'react';
import type {CartApiQueryFragment, FooterQuery, HeaderQuery} from 'storefrontapi.generated';
import {Aside} from '~/components/Aside';
import {Footer} from '~/components/Footer';
import {Header} from '~/components/Header';
import {CartMain} from '~/components/CartMain';
import {SEARCH_ENDPOINT, SearchFormPredictive} from '~/components/SearchFormPredictive';
import {SearchResultsPredictive} from '~/components/SearchResultsPredictive';

interface PageLayoutProps {
  cart: Promise<CartApiQueryFragment | null>;
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
  children?: React.ReactNode;
}

export function PageLayout({cart, children = null, header, isLoggedIn, publicStoreDomain}: PageLayoutProps) {
  return (
    <Aside.Provider>
      <CartAside cart={cart} />
      <SearchAside />
      <Header header={header} cart={cart} isLoggedIn={isLoggedIn} publicStoreDomain={publicStoreDomain} />
      <main>{children}</main>
      <Footer />
    </Aside.Provider>
  );
}

function CartAside({cart}: {cart: PageLayoutProps['cart']}) {
  return <Aside type="cart" heading="Your cart"><Suspense fallback={<p>Loading cart ...</p>}><Await resolve={cart}>{(cart) => <CartMain cart={cart} layout="aside" />}</Await></Suspense></Aside>;
}

function SearchAside() {
  const queriesDatalistId = useId();
  return (
    <Aside type="search" heading="Search">
      <div className="predictive-search"><br />
        <SearchFormPredictive>{({fetchResults, goToSearch, inputRef}) => (<><input name="q" onChange={fetchResults} onFocus={fetchResults} placeholder="Search our store..." ref={inputRef} type="search" list={queriesDatalistId}/><button onClick={goToSearch}>Search</button></>)}</SearchFormPredictive>
        <SearchResultsPredictive>{({items,total,term,state,closeSearch}) => {
          const {articles,collections,pages,products,queries}=items;
          if(state==='loading'&&term.current)return <div>Loading...</div>;
          if(!total)return <SearchResultsPredictive.Empty term={term}/>;
          return <><SearchResultsPredictive.Queries queries={queries} queriesDatalistId={queriesDatalistId}/><SearchResultsPredictive.Products products={products} closeSearch={closeSearch} term={term}/><SearchResultsPredictive.Collections collections={collections} closeSearch={closeSearch} term={term}/><SearchResultsPredictive.Pages pages={pages} closeSearch={closeSearch} term={term}/><SearchResultsPredictive.Articles articles={articles} closeSearch={closeSearch} term={term}/>{term.current&&total?<Link onClick={closeSearch} to={`${SEARCH_ENDPOINT}?q=${term.current}`}>View all results</Link>:null}</>;
        }}</SearchResultsPredictive>
      </div>
    </Aside>
  );
}
