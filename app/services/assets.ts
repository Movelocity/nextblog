
import { Asset } from '@/app/common/types';
import { get, post, del } from './utils';

export const assetService = {
  /**
   * List all assets for a blog
   */
  listAssets: async (blogId: string): Promise<Asset[]> => {
    const data = await get<{ assets: Asset[] }>('/api/asset', { 
      params: { blogId } 
    });
    return data.assets;
  },

  /**
   * Upload a new asset
   */
  uploadAsset: async (blogId: string, file: File): Promise<{ assetPath: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    return post<{ assetPath: string }>('/api/asset', formData, {
      params: { blogId }
    });
  },

  /**
   * Delete an asset
   */
  deleteAsset: async (blogId: string, fileName: string): Promise<void> => {
    return del<void>('/api/asset', {
      params: { blogId, fileName }
    });
  },

  /**
   * Get asset URL
   */
  getAssetUrl: (blogId: string, fileName: string): string => {
    return `/api/asset?blogId=${blogId}&fileName=${fileName}`;
  }
};

export interface ImageUploadResponse {
  success: boolean;
  assetPath: string;
  id: string;
  originalName: string;
  thumbnail?: {
    id: string;
    path: string;
  };
}

/**
 * 图片专用资产服务 - 支持缩略图生成
 */
export const imageAssetService = {
  /**
   * Upload an image asset with optional thumbnail generation
   * @param blogId Blog ID (use 'image-edit' for independent image editing storage)
   * @param file Image file to upload
   * @param generateThumbnail Whether to generate thumbnail
   */
  uploadImage: async (blogId: string, file: File, generateThumbnail: boolean = false): Promise<ImageUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const params = new URLSearchParams({
      blogId,
      generateThumbnail: generateThumbnail.toString()
    });

    return post<ImageUploadResponse>(`/api/asset/image?${params}`, formData);
  },

  /**
   * Get image asset URL with optional thumbnail
   * @param blogId Blog ID
   * @param fileName File name
   * @param thumbnail Whether to get thumbnail version
   */
  getImageUrl: (blogId: string, fileName: string, thumbnail: boolean = false): string => {
    const params = new URLSearchParams({
      blogId,
      fileName,
      ...(thumbnail && { thumbnail: 'true' })
    });
    
    return `/api/asset/image?${params}`;
  },

  /**
   * Delete an image asset
   * @param blogId Blog ID
   * @param fileName File name to delete
   */
  deleteImage: async (blogId: string, fileName: string): Promise<{ success: boolean; message: string }> => {
    return del<{ success: boolean; message: string }>('/api/asset/image', {
      params: { blogId, fileName }
    });
  },

  /**
   * Download image as blob
   * @param blogId Blog ID
   * @param fileName File name
   * @param thumbnail Whether to get thumbnail version
   */
  downloadImage: async (blogId: string, fileName: string, thumbnail: boolean = false): Promise<Blob> => {
    const params = new URLSearchParams({
      blogId,
      fileName,
      ...(thumbnail && { thumbnail: 'true' })
    });
    
    const response = await fetch(`/api/asset/image?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    
    return response.blob();
  }
}; 