import { NextResponse } from 'next/server';

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
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching donghua home:', error);
    return NextResponse.json({ error: 'Failed to fetch donghua home' }, { status: 500 });
  }
}
