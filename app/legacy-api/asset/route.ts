import { NextRequest, NextResponse } from 'next/server';
import blogStorage from '@/app/lib/BlogStorage';
import { mimeTypes } from '@/app/common/globals';

/**
 * List assets for a blog
 * GET /api/asset?blogId={blogId}
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blogId = searchParams.get('blogId');

    if (!blogId) {
      return NextResponse.json(
        { error: 'Blog ID is required' },
        { status: 400 }
      );
    }

    const fileName = searchParams.get('fileName');
    if (fileName) {
      // const assetData = await blogStorage.getAsset(blogId, fileName);
      const assetData = await fetch(`api/assets/${fileName}`);
      if (!assetData) {
        return NextResponse.json(
          { error: 'Asset not found' },
          { status: 404 }
        );
      }
      // Determine content type based on file extension
      const ext = fileName.split('.').pop()?.toLowerCase();
      let contentType = 'application/octet-stream'; // default binary
      
      if (ext && ext in mimeTypes) {
        contentType = mimeTypes[ext];
      }

      // Create response with proper headers using the standard Response object for binary data
      // return new Response(new Uint8Array(assetData.buffer), {
      //   status: 200,
      //   headers: {
      //     'Content-Type': contentType,
      //     'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      //     'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      //     'Content-Length': assetData.size.toString()
      //   },
      // });
      return new NextResponse(assetData.body, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
          'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        },
      });
    }

    const assets = await blogStorage.listAssets(blogId);
    return NextResponse.json({ assets });
  } catch (error) {
    console.error('Error listing assets:', error);
    return NextResponse.json(
      { error: 'Failed to list assets' },
      { status: 500 }
    );
  }
}

/**
 * Upload a new asset
 * POST /api/asset?blogId={blogId}
 * Body: FormData with fields:
 * - file: File
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blogId = searchParams.get('blogId');
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!blogId || !file) {
      return NextResponse.json(
        { error: 'Blog ID and file are required' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const assetPath = await blogStorage.addAsset(blogId, file.name, buffer);

    return NextResponse.json({ 
      success: true,
      assetPath 
    });
  } catch (error) {
    console.error('Error uploading asset:', error);
    return NextResponse.json(
      { error: 'Failed to upload asset' },
      { status: 500 }
    );
  }
}

/**
 * Delete an asset
 * DELETE /api/asset?blogId={blogId}&fileName={fileName}
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blogId = searchParams.get('blogId');
    const fileName = searchParams.get('fileName');

    if (!blogId || !fileName) {
      return NextResponse.json(
        { error: 'Blog ID and file name are required' },
        { status: 400 }
      );
    }

    await blogStorage.deleteAsset(blogId, fileName);
    return NextResponse.json({ 
      success: true,
      message: 'Asset deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 }
    );
  }
} 

