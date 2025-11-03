import { NextRequest, NextResponse } from 'next/server';
import imageStorage from '@/app/lib/ImageStorage';
import { requireAuth } from '@/app/lib/auth';
import { generateId } from '@/app/api/image-edit/utils';
import sharp from 'sharp';
import path from 'path';

/**
 * Upload a new image asset
 * POST /api/asset/image?generateThumbnail={true/false}
 * Body: FormData with fields:
 * - file: File
 * 
 * Returns both original file ID and thumbnail ID if thumbnail generation is requested
 * The response includes URLs for both the image and thumbnail following RESTful patterns
 */
export const POST = requireAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const shouldGenerateThumbnail = searchParams.get('generateThumbnail') === 'true';
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
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
    
    // Generate a unique ID for the image file
    const fileName = generateId(ext.substring(1)); // Remove the dot from extension

    await imageStorage?.saveImage(fileName, buffer);

    // Build RESTful URLs for the created resources
    // NEVER USE FIXED URLS, INSTEAD YOU KNOW THE ID AND GET IT FROM YOUR FAMILIAR API
    const response: any = {
      success: true,
      id: fileName,
      originalName: file.name,
    };

    // Generate thumbnail if requested
    if (shouldGenerateThumbnail) {
      try {
        const thumbnailBuffer = await sharp(buffer)
          .resize(180, 180)
          .jpeg({ quality: 80 })
          .toBuffer();
        
        // Use the same fileName for thumbnail (same ID and extension)
        await imageStorage?.saveThumbnail(fileName, thumbnailBuffer);
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

