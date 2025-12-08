import { NextRequest, NextResponse } from 'next/server';
import imageStorage from '@/app/lib/ImageStorage';
import { mimeTypes } from '@/app/common/globals';
import { requireAuth } from '@/app/lib/auth';

/**
 * Get an image asset by ID
 * GET /api/asset/image/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    // Security validation for id
    if (id.includes('..') || id.includes('/')) {
      return NextResponse.json(
        { error: 'Invalid image ID' },
        { status: 400 }
      );
    }

    const assetData = await imageStorage?.getImage(id);
    if (!assetData) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Determine content type based on file extension
    const ext = id.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream'; // default binary
    
    if (ext && ext in mimeTypes) {
      contentType = mimeTypes[ext];
    }

    const responseBuffer = new Uint8Array(assetData.buffer);

    // Create response with proper headers
    return new Response(responseBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(id)}"`,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Content-Length': responseBuffer.length.toString()
      },
    });
  } catch (error) {
    console.error('Error getting image asset:', error);
    return NextResponse.json(
      { error: 'Failed to get asset' },
      { status: 500 }
    );
  }
}

/**
 * Delete an image asset by ID
 * DELETE /api/asset/image/[id]
 */
export const DELETE = requireAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    // Security validation
    if (id.includes('..') || id.includes('/')) {
      return NextResponse.json(
        { error: 'Invalid image ID' },
        { status: 400 }
      );
    }

    // Delete both the image and its thumbnail
    await imageStorage?.deleteImageAndThumbnail(id);
    return NextResponse.json({ 
      success: true,
      message: 'Image asset and thumbnail deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting image asset:', error);
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 }
    );
  }
});
