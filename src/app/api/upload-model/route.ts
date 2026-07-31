import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
  }

  try {
    if (!request.body) {
      return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('BLOB_READ_WRITE_TOKEN is missing from environment variables');
    } else {
      console.log('BLOB_READ_WRITE_TOKEN is available, length:', process.env.BLOB_READ_WRITE_TOKEN.length);
    }

    const blob = await put(filename, request.body, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json(blob);
  } catch (error: any) {
    console.error('Blob upload error:', error);
    return NextResponse.json(
      { error: `Gagal upload: ${error.message || error}` },
      { status: 500 }
    );
  }
}
