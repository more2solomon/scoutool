import {redirect} from "next/navigation";

export default async function Search({
  searchParams,
}: {
  searchParams: Promise<{q?: string}>;
}) {
  const params = await searchParams;
  redirect(`/collections/all?search=${encodeURIComponent(params.q || "")}`);
}
