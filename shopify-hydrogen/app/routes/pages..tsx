import {useLoaderData} from 'react-router';
import type {Route} from './+types/pages.$handle';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';

export const meta: Route.MetaFunction = ({data}) => [{title: `${data?.page.title ?? 'Page'} | Velvet Journal Co`}];

export async function loader({context, request, params}: Route.LoaderArgs) {
  if (!params.handle) throw new Error('Missing page handle');
  const {page} = await context.storefront.query(PAGE_QUERY,{variables:{handle:params.handle}});
  if (!page) throw new Response('Not Found',{status:404});
  redirectIfHandleIsLocalized(request,{handle:params.handle,data:page});
  return {page};
}

export default function Page() {
  const {page} = useLoaderData<typeof loader>();
  if (page.handle === 'contact') return <ContactPage/>;
  return <div className="charge-standard-page"><h1>{page.title}</h1><div dangerouslySetInnerHTML={{__html:page.body}}/></div>;
}

function ContactPage() {
  return <div className="charge-contact-page"><div className="charge-breadcrumb">Home › Contact</div><h1>Contact</h1><div className="charge-contact-grid">
    <form className="charge-contact-form" action="mailto:gnewton581@gmail.com" method="post" encType="text/plain"><div className="two"><label>Name<input name="Name" placeholder="Name"/></label><label>Email*<input name="Email" type="email" placeholder="Email" required/></label></div><label>Comment*<textarea name="Comment" placeholder="Comment" required/></label><button className="charge-btn red" type="submit">Send message</button></form>
    <aside className="charge-contact-info"><h2>Got Questions?</h2><p>If you’d like to learn more about us and our products, contact us!</p><div className="two"><div><b>Company Info</b><p>VELVET JOURNAL CO<br/>Online Store<br/>Worldwide Shipping</p></div><div><b>Contact Info</b><p><a href="mailto:gnewton581@gmail.com">gnewton581@gmail.com</a></p></div></div></aside>
  </div></div>;
}

const PAGE_QUERY = `#graphql query Page($language:LanguageCode,$country:CountryCode,$handle:String!) @inContext(language:$language,country:$country){page(handle:$handle){handle id title body seo{description title}}}` as const;
