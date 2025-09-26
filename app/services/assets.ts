
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