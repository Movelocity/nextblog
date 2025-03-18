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
    return blog.assets.map(name => ({
      name,
      path: `${blogId}/assets/${name}`,
      size: 0, // 这里可以从文件系统获取实际大小
      type: this.getAssetType(name),
      lastModified: new Date().toISOString() // 这里可以从文件系统获取实际修改时间
    }));
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