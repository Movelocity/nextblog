
import { Asset } from '@/app/common/types';
import { get, post, del } from './utils';

export const assetService = {
  /**
   * List all assets for a blog
   * 注意：Go 后端目前未实现按博客分组的资产管理 API
   */
  listAssets: async (blogId: string): Promise<Asset[]> => {
    console.warn('Blog-specific asset management is not implemented in Go backend');
    return [];
  },

  /**
   * Upload a new asset
   * 注意：Go 后端目前使用通用的图片上传 API
   */
  uploadAsset: async (blogId: string, file: File): Promise<{ assetPath: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    // 使用 Go 后端的图片上传 API
    interface GoImageUploadResponse {
      filename: string;
      url: string;
      size: number;
    }
    
    const response = await post<GoImageUploadResponse>('/images/upload', formData);
    
    return {
      assetPath: response.url
    };
  },

  /**
   * Delete an asset
   * 注意：Go 后端目前使用通用的图片删除 API
   */
  deleteAsset: async (blogId: string, fileName: string): Promise<void> => {
    await del<{ message: string }>(`/images/${fileName}`);
  },

  /**
   * Get asset URL
   */
  getAssetUrl: (blogId: string, fileName: string): string => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
    return `${baseUrl}/images/${fileName}`;
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
   * @param generateThumbnail Whether to generate thumbnail (Go 后端暂不支持)
   */
  uploadImage: async (file: File, generateThumbnail: boolean = false): Promise<ImageUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    // 使用 Go 后端的图片上传 API
    interface GoImageUploadResponse {
      filename: string;
      url: string;
      size: number;
    }
    
    const response = await post<GoImageUploadResponse>('/images/upload', formData);
    
    // 适配返回格式
    return {
      success: true,
      assetPath: response.url,
      id: response.filename,
      originalName: file.name
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
   * 注意：Go 后端暂不支持缩略图，返回原图 URL
   */
  getThumbnailUrl: (fileName: string): string => {
    return imageAssetService.getImageUrl(fileName);
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
   * 注意：Go 后端暂不支持缩略图，返回原图
   */
  downloadThumbnail: async (fileName: string): Promise<Blob> => {
    return imageAssetService.downloadImage(fileName);
  }
}; 