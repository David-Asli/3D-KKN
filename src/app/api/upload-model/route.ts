import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Mengizinkan file 3D tanpa autentikasi yang rumit (karena admin sudah login)
        return {
          allowedContentTypes: ['model/gltf-binary', 'model/gltf+json', 'application/octet-stream', 'application/json'],
          maximumSizeInBytes: 500 * 1024 * 1024, // 500MB
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Bisa digunakan untuk webhook/log saat upload selesai
        console.log('Blob upload completed', blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    console.error('Blob upload error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 } // Vercel Blob client expects 4xx for failures
    );
  }
}
