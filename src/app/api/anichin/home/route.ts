import { NextResponse } from 'next/server';
import { buildEdgeCacheControl } from '@/lib/cloudflare-cache';

export async function GET() {
  try {
    const response = await fetch('https://api.kanata.web.id/anichin/home', {
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
        'Cache-Control': buildEdgeCacheControl(900, 3600),
      },
    });
  } catch (error) {
    console.error('Error fetching donghua home:', error);
    return NextResponse.json({ error: 'Failed to fetch donghua home' }, { status: 500 });
  }
}
