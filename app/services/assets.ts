import { API_ROUTES } from '@/app/common/config';
import { Asset } from '@/app/common/types';


export const assetService = {
  /**
   * List all assets for a blog
   */
  listAssets: async (blogId: string): Promise<Asset[]> => {
    const response = await fetch(`${API_ROUTES.ASSET}?blogId=${blogId}`);
    if (!response.ok) throw new Error('Failed to fetch assets');
    const data = await response.json();
    return data.assets;
  },

  /**
   * Upload a new asset
   */
  uploadAsset: async (blogId: string, file: File): Promise<{ assetPath: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_ROUTES.ASSET}?blogId=${blogId}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to upload asset');
    return response.json();
  },

  /**
   * Delete an asset
   */
  deleteAsset: async (blogId: string, fileName: string): Promise<void> => {
    const response = await fetch(
      `${API_ROUTES.ASSET}?blogId=${blogId}&fileName=${fileName}`,
      { method: 'DELETE' }
    );
    
    if (!response.ok) throw new Error('Failed to delete asset');
  },

  /**
   * Get asset URL
   */
  getAssetUrl: (blogId: string, fileName: string): string => {
    return `${API_ROUTES.ASSET}?blogId=${blogId}&fileName=${fileName}`;
  }
}; 