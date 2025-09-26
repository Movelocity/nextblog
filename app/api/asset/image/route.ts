import { NextRequest, NextResponse } from 'next/server';
import blogStorage from '@/app/lib/BlogStorage';
import { mimeTypes } from '@/app/common/globals';
import { requireAuth } from '@/app/lib/auth';
import { generateId } from '@/app/api/image-edit/utils';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

/**
 * Get an image asset with optional thumbnail generation
 * GET /api/asset/image?blogId={blogId}&fileName={fileName}&thumbnail={true/false}
 * 
 * Special handling for "image-edit" blogId for independent storage space
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blogId = searchParams.get('blogId');
    const fileName = searchParams.get('fileName');
    const generateThumbnail = searchParams.get('thumbnail') === 'true';

    if (!blogId || !fileName) {
      return NextResponse.json(
        { error: 'Blog ID and file name are required' },
        { status: 400 }
      );
    }

    // Security validation for fileName
    if (fileName.includes('..') || fileName.includes('/')) {
      return NextResponse.json(
        { error: 'Invalid file name' },
        { status: 400 }
      );
    }

    const assetData = await blogStorage.getAsset(blogId, fileName);
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

    let responseBuffer = new Uint8Array(assetData.buffer);
    let responseFileName = fileName;

    // Generate thumbnail if requested and it's an image
    if (generateThumbnail && ext && ['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      try {
        const thumbnailBuffer = await sharp(Buffer.from(assetData.buffer))
          .resize(180, 180)
          .jpeg({ quality: 80 })
          .toBuffer();
        
        responseBuffer = new Uint8Array(thumbnailBuffer);
        responseFileName = `thumb_${fileName}`;
        contentType = 'image/jpeg';
      } catch (error) {
        console.error('Failed to generate thumbnail:', error);
        // Fall back to original image if thumbnail generation fails
      }
    }

    // Create response with proper headers
    return new Response(responseBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(responseFileName)}"`,
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
 * Upload a new image asset
 * POST /api/asset/image?blogId={blogId}&generateThumbnail={true/false}
 * Body: FormData with fields:
 * - file: File
 * 
 * Returns both original file ID and thumbnail ID if thumbnail generation is requested
 */
export const POST = requireAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const blogId = searchParams.get('blogId');
    const shouldGenerateThumbnail = searchParams.get('generateThumbnail') === 'true';
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!blogId || !file) {
      return NextResponse.json(
        { error: 'Blog ID and file are required' },
        { status: 400 }
      );
    }

    // Validate file type for images
    const ext = path.extname(file.name).toLowerCase();
    const supportedImageTypes = ['.jpg', '.jpeg', '.png', '.webp'];
    if (!supportedImageTypes.includes(ext)) {
      return NextResponse.json(
        { error: 'Only JPG, PNG, and WebP images are supported' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // For image-edit blogId, generate a unique ID instead of using original filename
    let fileName: string;
    if (blogId === 'image-edit') {
      fileName = generateId(ext.substring(1)); // Remove the dot from extension
    } else {
      fileName = file.name;
    }

    const assetPath = await blogStorage.addAsset(blogId, fileName, buffer);

    const response: any = {
      success: true,
      assetPath,
      id: fileName,
      originalName: file.name
    };

    // Generate thumbnail if requested
    if (shouldGenerateThumbnail) {
      try {
        const thumbnailBuffer = await sharp(buffer)
          .resize(180, 180)
          .jpeg({ quality: 80 })
          .toBuffer();
        
        const thumbnailFileName = blogId === 'image-edit' 
          ? generateId('thumb.png')
          : `thumb_${fileName}`;
        
        const thumbnailPath = await blogStorage.addAsset(blogId, thumbnailFileName, thumbnailBuffer);
        
        response.thumbnail = {
          id: thumbnailFileName,
          path: thumbnailPath
        };
      } catch (error) {
        console.error('Failed to generate thumbnail:', error);
        // Continue without thumbnail if generation fails
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error uploading image asset:', error);
    return NextResponse.json(
      { error: 'Failed to upload asset' },
      { status: 500 }
    );
  }
});

/**
 * Delete an image asset
 * DELETE /api/asset/image?blogId={blogId}&fileName={fileName}
 */
export const DELETE = requireAuth(async (request: NextRequest) => {
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

    // Security validation
    if (fileName.includes('..') || fileName.includes('/')) {
      return NextResponse.json(
        { error: 'Invalid file name' },
        { status: 400 }
      );
    }

    await blogStorage.deleteAsset(blogId, fileName);
    return NextResponse.json({ 
      success: true,
      message: 'Image asset deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting image asset:', error);
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 }
    );
  }
});
