import { NextResponse } from 'next/server';
import { buildEdgeCacheControl } from '@/lib/cloudflare-cache';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';

    const response = await fetch(`https://api.kanata.web.id/anichin/ongoing?page=${page}`, {
      headers: {
        'accept': '*/*',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': buildEdgeCacheControl(900, 3600),
      },
    });
  } catch (error) {
    console.error('Error fetching ongoing donghua:', error);
    return NextResponse.json({ error: 'Failed to fetch ongoing donghua' }, { status: 500 });
  }
}
