
import { Asset } from '@/app/common/types';
import { get, post, del } from './utils';

export const assetService = {
  /**
   * List all assets for a blog
   */
  listAssets: async (blogId: string): Promise<Asset[]> => {
    interface AssetsResponse {
      data: Asset[];
      total: number;
      page: number;
      limit: number;
    }
    
    const response = await get<AssetsResponse>(`/assets?postID=${blogId}`);
    
    // Adapt response format
    return response.data;
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
    
    const response = await post<GoAssetUploadResponse>(`/assets?postID=${blogId}`, formData);
    
    return {
      assetPath: response.url
    };
  },

  /**
   * Delete an asset
   */
  deleteAsset: async (fileId: string, postId?: string): Promise<void> => {
    const params = new URLSearchParams({ fileID: fileId });
    if (postId) {
      params.append('postID', postId);
    }
    await del<{ message: string }>(`/assets?${params.toString()}`);
  },

  /**
   * Get asset URL
   */
  getAssetUrl: (fileId: string): string => {
    return `/api/assets/${fileId}`;
  },

  /**
   * Get asset thumbnail URL with custom size
   * @param fileId - File ID
   * @param size - Thumbnail size (width and height in pixels, default 180)
   */
  getAssetThumbnailUrl: (fileId: string, size: number = 180): string => {
    return `/api/assets/${fileId}?thumbnail=true&size=${size}`;
  }
};

 