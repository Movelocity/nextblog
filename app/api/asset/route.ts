import { NextRequest, NextResponse } from 'next/server';
import blogStorage from '@/app/lib/BlogStorage';

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
      const asset = await blogStorage.getAsset(blogId, fileName);
      
      // Determine content type based on file extension
      const ext = fileName.split('.').pop()?.toLowerCase();
      let contentType = 'application/octet-stream'; // default binary
      
      // Map common file extensions to MIME types
      const mimeTypes: Record<string, string> = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'svg': 'image/svg+xml',
        'pdf': 'application/pdf',
        'txt': 'text/plain',
        'md': 'text/markdown',
        'zip': 'application/zip',
        'rar': 'application/x-rar-compressed',
        '7z': 'application/x-7z-compressed',
        'tar': 'application/x-tar',
        'gz': 'application/gzip',
        'bz2': 'application/x-bzip2',
        'mp4': 'video/mp4',
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'ogg': 'audio/ogg',
        'webm': 'video/webm',
      };
      
      if (ext && ext in mimeTypes) {
        contentType = mimeTypes[ext];
      }

      // Create response with proper headers
      return new NextResponse(asset, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${fileName}"`,
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

