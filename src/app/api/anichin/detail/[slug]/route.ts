import { NextResponse } from 'next/server';
import { buildEdgeCacheControl } from '@/lib/cloudflare-cache';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const { slug } = await params;
    const response = await fetch(`https://api.kanata.web.id/anichin/detail/${slug}`, {
      headers: {
        accept: '*/*',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': buildEdgeCacheControl(1800, 7200),
      },
    });
  } catch (error) {
    console.error('Error fetching donghua detail:', error);
    return NextResponse.json({ error: 'Failed to fetch donghua detail' }, { status: 500 });
  }
}
