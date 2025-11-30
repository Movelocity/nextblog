
import { Asset } from '@/app/common/types';
import { get, post, del } from './utils';

export const assetService = {
  /**
   * List all assets for a blog
   */
  listAssets: async (blogId: string): Promise<Asset[]> => {
    interface GoAssetResponse {
      id: string;
      filename: string;
      size: number;
      mimeType: string;
      url: string;
      createdAt: string;
    }
    
    const response = await get<GoAssetResponse[]>(`/posts/${blogId}/assets`);
    
    // Adapt response format
    return response.map(asset => ({
      id: asset.id,
      name: asset.filename,
      size: asset.size,
      mimeType: asset.mimeType,
      url: asset.url,
      createdAt: asset.createdAt
    }));
  },

  /**
   * Upload a new asset
   */
  uploadAsset: async (blogId: string, file: File): Promise<{ assetPath: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Use Go backend blog asset upload API
    interface GoAssetUploadResponse {
      id: string;
      filename: string;
      url: string;
      size: number;
    }
    
    const response = await post<GoAssetUploadResponse>(`/posts/${blogId}/assets`, formData);
    
    return {
      assetPath: response.url
    };
  },

  /**
   * Delete an asset
   */
  deleteAsset: async (blogId: string, fileId: string): Promise<void> => {
    await del<{ message: string }>(`/posts/${blogId}/assets/${fileId}`);
  },

  /**
   * Get asset URL
   */
  getAssetUrl: (blogId: string, fileId: string): string => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
    return `${baseUrl}/posts/${blogId}/assets/${fileId}`;
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
 * 
 * 注意：Go 后端目前未完全实现所有功能
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

    // Use Go backend image upload API with thumbnail support
    interface GoImageUploadResponse {
      filename: string;
      url: string;
      size: number;
      thumbnail?: {
        id: string;
        url: string;
      };
    }
    
    const url = generateThumbnail ? '/images/upload?generateThumbnail=true' : '/images/upload';
    const response = await post<GoImageUploadResponse>(url, formData);
    
    // Adapt response format
    return {
      success: true,
      assetPath: response.url,
      id: response.filename,
      originalName: file.name,
      thumbnail: response.thumbnail
    };
  },

  /**
   * Get image asset URL
   * @param fileName File name
   */
  getImageUrl: (fileName: string): string => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
    return `${baseUrl}/images/${fileName}`;
  },

  /**
   * Get thumbnail URL for an image
   * @param fileName File name (same as original image)
   */
  getThumbnailUrl: (fileName: string): string => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
    return `${baseUrl}/images/${fileName}/thumbnail`;
  },

  /**
   * Delete an image asset and its thumbnail
   * @param fileName File name to delete
   */
  deleteImage: async (fileName: string): Promise<{ success: boolean; message: string }> => {
    const response = await del<{ message: string }>(`/images/${fileName}`);
    return {
      success: true,
      message: response.message
    };
  },

  /**
   * Download image as blob
   * @param fileName File name
   */
  downloadImage: async (fileName: string): Promise<Blob> => {
    const url = imageAssetService.getImageUrl(fileName);
    const response = await fetch(url);
    
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
    const url = imageAssetService.getThumbnailUrl(fileName);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to download thumbnail: ${response.statusText}`);
    }
    
    return response.blob();
  }
}; 