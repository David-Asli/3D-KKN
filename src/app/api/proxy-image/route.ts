import { NextResponse } from 'next/server';
import https from 'https';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return new NextResponse(`Error: ${response.status}`, { status: response.status });
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(Buffer.from(arrayBuffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new NextResponse('Error fetching image', { status: 500 });
  }
}

