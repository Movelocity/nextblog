import { BlogManager } from './blog/BlogManager';
import { BlogMeta, Blog, CreateBlogInput, UpdateBlogInput, Asset } from '@/app/common/types';

class BlogStorage {
  private manager: BlogManager;

  private constructor() {
    this.manager = BlogManager.getInstance();
  }

  private static instance: BlogStorage | null = null;

  public static getInstance(): BlogStorage {
    if (!BlogStorage.instance) {
      BlogStorage.instance = new BlogStorage();
    }
    return BlogStorage.instance;
  }

  async init(): Promise<void> {
    // 初始化已经在 BlogManager 中处理
  }

  async createBlog(input: CreateBlogInput): Promise<Blog> {
    return this.manager.createBlog(input);
  }

  async getBlog(id: string): Promise<Blog> {
    return this.manager.getBlog(id);
  }

  async updateBlog(id: string, input: UpdateBlogInput): Promise<Blog> {
    return this.manager.updateBlog(id, input);
  }

  async deleteBlog(id: string): Promise<void> {
    return this.manager.deleteBlog(id);
  }

  async listBlogs(options: { 
    page?: number, 
    page_size?: number, 
    published_only?: boolean,
    categories?: string[],
    tags?: string[],
    query?: string
  } = {}): Promise<{ blogs_info: BlogMeta[], total: number }> {
    return this.manager.listBlogs(options);
  }

  async listAssets(blogId: string): Promise<Asset[]> {
    const blog = await this.manager.getBlog(blogId);
    const assets = await Promise.all(blog.assets.map(async (name) => {
      const assetInfo = await this.manager.getAsset(blogId, name);
      return {
        name,
        path: `${blogId}/assets/${name}`,
        size: assetInfo?.size || 0,
        type: this.getAssetType(name),
        lastModified: assetInfo?.lastModified || new Date().toISOString()
      };
    }));
    
    return assets;
  }

  async getAsset(blogId: string, fileName: string): Promise<{ buffer: Buffer, size: number, lastModified: string } | null> {
    // Check if blog exists first
    await this.manager.getBlog(blogId);
    // Let's add getAsset to BlogManager class
    return this.manager.getAsset(blogId, fileName);
  }

  async addAsset(blogId: string, fileName: string, content: Buffer): Promise<string> {
    // Check if blog exists first
    await this.manager.getBlog(blogId);
    // Let's add addAsset to BlogManager class
    return this.manager.addAsset(blogId, fileName, content);
  }

  async deleteAsset(blogId: string, fileName: string): Promise<void> {
    // Check if blog exists first
    await this.manager.getBlog(blogId);
    // Let's add deleteAsset to BlogManager class
    return this.manager.deleteAsset(blogId, fileName);
  }

  private getAssetType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'svg':
        return 'image/svg+xml';
      case 'webp':
        return 'image/webp';
      case 'ico':
        return 'image/x-icon';
      default:
        return 'application/octet-stream';
    }
  }
}

export default BlogStorage.getInstance(); 