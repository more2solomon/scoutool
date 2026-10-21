import type {Route} from './+types/collections.all';
import {useLoaderData} from 'react-router';
import {getPaginationVariables} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {ChargeProductCard} from '~/components/ChargeProductCard';

export const meta: Route.MetaFunction = () => [{title: 'Products | Velvet Journal Co'}];

export async function loader({context, request}: Route.LoaderArgs) {
  const paginationVariables = getPaginationVariables(request, {pageBy: 12});
  const {products} = await context.storefront.query(CATALOG_QUERY, {variables:{...paginationVariables}});
  return {products};
}

export default function Collection() {
  const {products} = useLoaderData<typeof loader>();
  return <div className="charge-catalog-page">
    <div className="charge-breadcrumb">Home › Products</div>
    <div className="charge-catalog-layout">
      <aside className="charge-filters"><h3>Availability</h3><label><input type="checkbox"/> In Stock</label><hr/><h3>Price</h3><input type="range" min="0" max="150" defaultValue="150"/><div className="charge-price-inputs"><span>0</span><b>-</b><span>150.00</span></div></aside>
      <section className="charge-catalog-content"><h1>Products</h1><PaginatedResourceSection connection={products} resourcesClassName="charge-catalog-grid">{({node:product}:any)=><ChargeProductCard key={product.id} product={product}/>}</PaginatedResourceSection></section>
    </div>
  </div>;
}

const CATALOG_QUERY = `#graphql
  fragment ChargeCatalogItem on Product { id handle title vendor featuredImage { url altText width height } priceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } } }
  query ChargeCatalog($country:CountryCode,$language:LanguageCode,$first:Int,$last:Int,$startCursor:String,$endCursor:String) @inContext(country:$country,language:$language) { products(first:$first,last:$last,before:$startCursor,after:$endCursor){ nodes{...ChargeCatalogItem} pageInfo{hasPreviousPage hasNextPage startCursor endCursor} } }
` as const;
