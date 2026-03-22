import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    const url = new URL('https://api.kanata.web.id/anichin/search');
    url.searchParams.set('q', query);

    const response = await fetch(url, {
      headers: {
        accept: '*/*',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error searching donghua:', error);
    return NextResponse.json({ error: 'Failed to search donghua' }, { status: 500 });
  }
}
