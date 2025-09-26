import { NextRequest, NextResponse } from 'next/server';
import imageStorage from '@/app/lib/ImageStorage';
import { mimeTypes } from '@/app/common/globals';

/**
 * Get a thumbnail by ID
 * GET /api/asset/thumbnail/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: 'Thumbnail ID is required' },
        { status: 400 }
      );
    }

    // Security validation for id
    if (id.includes('..') || id.includes('/')) {
      return NextResponse.json(
        { error: 'Invalid thumbnail ID' },
        { status: 400 }
      );
    }

    const thumbnailData = await imageStorage.getThumbnail(id);
    if (!thumbnailData) {
      return NextResponse.json(
        { error: 'Thumbnail not found' },
        { status: 404 }
      );
    }

    // Determine content type based on file extension
    const ext = id.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream'; // default binary
    
    if (ext && ext in mimeTypes) {
      contentType = mimeTypes[ext];
    }

    const responseBuffer = new Uint8Array(thumbnailData.buffer);

    // Create response with proper headers
    return new Response(responseBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(`thumb_${id}`)}"`,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Content-Length': responseBuffer.length.toString()
      },
    });
  } catch (error) {
    console.error('Error getting thumbnail:', error);
    return NextResponse.json(
      { error: 'Failed to get thumbnail' },
      { status: 500 }
    );
  }
}
