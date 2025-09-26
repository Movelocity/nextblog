
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
 * 使用新的独立图片存储结构
 */
export const imageAssetService = {
  /**
   * Upload an image asset with optional thumbnail generation
   * @param file Image file to upload
   * @param generateThumbnail Whether to generate thumbnail
   */
  uploadImage: async (file: File, generateThumbnail: boolean = false): Promise<ImageUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const params = new URLSearchParams({
      generateThumbnail: generateThumbnail.toString()
    });

    return post<ImageUploadResponse>(`/api/asset/image?${params}`, formData);
  },

  /**
   * Get image asset URL
   * @param fileName File name
   */
  getImageUrl: (fileName: string): string => {
    const params = new URLSearchParams({
      fileName
    });
    
    return `/api/asset/image?${params}`;
  },

  /**
   * Get thumbnail URL for an image
   * @param fileName File name (same as original image)
   */
  getThumbnailUrl: (fileName: string): string => {
    return `/api/asset/thumbnail/${fileName}`;
  },

  /**
   * Delete an image asset and its thumbnail
   * @param fileName File name to delete
   */
  deleteImage: async (fileName: string): Promise<{ success: boolean; message: string }> => {
    return del<{ success: boolean; message: string }>('/api/asset/image', {
      params: { fileName }
    });
  },

  /**
   * Download image as blob
   * @param fileName File name
   */
  downloadImage: async (fileName: string): Promise<Blob> => {
    const params = new URLSearchParams({
      fileName
    });
    
    const response = await fetch(`/api/asset/image?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    
    return response.blob();
  },

  /**
   * Download thumbnail as blob
   * @param fileName File name (same as original image)
   */
  downloadThumbnail: async (fileName: string): Promise<Blob> => {
    const response = await fetch(`/api/asset/thumbnail/${fileName}`);
    
    if (!response.ok) {
      throw new Error(`Failed to download thumbnail: ${response.statusText}`);
    }
    
    return response.blob();
  }
}; 