import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ bookId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function toSearchString(searchParams?: Record<string, string | string[] | undefined>) {
  if (!searchParams) {
    return '';
  }

  const nextSearchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) {
          nextSearchParams.append(key, item);
        }
      }
      continue;
    }

    if (value) {
      nextSearchParams.set(key, value);
    }
  }

  const serialized = nextSearchParams.toString();
  return serialized ? `?${serialized}` : '';
}

export default async function DramaboxDetailPage({ params, searchParams }: PageProps) {
  const { bookId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  redirect(`/series/short/dramabox/${bookId}${toSearchString(resolvedSearchParams)}`);
}
