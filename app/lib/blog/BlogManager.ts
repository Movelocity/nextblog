import { BlogFileSystem } from './BlogFileSystem';
import { BlogIndex } from './BlogIndex';
import { LRUCache } from '../cache/LRUCache';
import { BlogMeta, Blog, CreateBlogInput, UpdateBlogInput, BlogMetaCache } from '@/app/common/types';
import { BLOG_CONFIG } from '@/app/common/config';
import { textPreview } from '@/app/common/utils';

export class BlogManager {
  private fileSystem: BlogFileSystem;
  private index: BlogIndex;
  private contentCache: LRUCache<string>;
  private metaCache: BlogMetaCache | null = null;

  private constructor(rootDir: string) {
    this.fileSystem = new BlogFileSystem(rootDir);
    this.index = new BlogIndex();
    this.contentCache = new LRUCache<string>({
      maxSize: 50 * 1024 * 1024, // 50MB
      maxAge: 30 * 60 * 1000,    // 30 minutes
      maxItems: 100              // 最多缓存100篇文章
    });
  }

  private static instance: BlogManager | null = null;

  public static getInstance(rootDir?: string): BlogManager {
    if (!BlogManager.instance) {
      BlogManager.instance = new BlogManager(rootDir || BLOG_CONFIG.ROOT_DIR);
      // 初始化
      BlogManager.instance.init().catch(console.error);
    }
    return BlogManager.instance;
  }

  // 初始化
  private async init(): Promise<void> {
    await this.fileSystem.init();
    await this.refreshMetaCache();
  }

  // 刷新元数据缓存
  private async refreshMetaCache(): Promise<void> {
    this.metaCache = await this.fileSystem.loadMeta();
    this.index.rebuild(this.metaCache.blogs);
  }

  // 获取元数据
  private async getMeta(): Promise<BlogMetaCache> {
    if (!this.metaCache) {
      await this.refreshMetaCache();
    }
    return this.metaCache!;
  }

  // 创建博客
  async createBlog(input: CreateBlogInput): Promise<Blog> {
    const meta = await this.getMeta();
    
    // 检查ID是否已存在
    if (meta.blogs[input.id]) {
      throw new Error(`Blog with ID ${input.id} already exists`);
    }

    const now = new Date().toISOString();
    const blogMeta: BlogMeta = {
      id: input.id,
      title: input.title,
      description: textPreview(input.content),
      createdAt: now,
      updatedAt: now,
      published: input.published ?? false,
      tags: input.tags ?? [],
      categories: input.categories ?? []
    };

    try {
      // 创建目录和文件
      await this.fileSystem.createBlogDirectory(input.id);
      await this.fileSystem.writeBlogContent(input.id, input.content);
      await this.fileSystem.writeBlogConfig(input.id, {
        title: input.title,
        description: blogMeta.description,
        createdAt: now,
        updatedAt: now,
        published: input.published ?? false,
        tags: input.tags ?? [],
        categories: input.categories ?? []
      });

      // 更新缓存
      meta.blogs[input.id] = blogMeta;
      meta.categories = [...new Set([...meta.categories, ...(input.categories || [])])];
      meta.tags = [...new Set([...meta.tags, ...(input.tags || [])])];
      meta.lastUpdated = now;

      await this.fileSystem.saveMeta(meta);
      this.metaCache = meta;
      this.index.addBlog(input.id, blogMeta);
      this.contentCache.set(input.id, input.content);

      return {
        ...blogMeta,
        content: input.content,
        assets: []
      };
    } catch (error) {
      // 清理
      await this.fileSystem.deleteBlogDirectory(input.id).catch(console.error);
      throw error;
    }
  }

  // 获取博客
  async getBlog(id: string): Promise<Blog> {
    const meta = await this.getMeta();
    const blogMeta = meta.blogs[id];
    
    if (!blogMeta) {
      throw new Error(`Blog ${id} not found`);
    }

    try {
      // 尝试从缓存获取内容
      let content = this.contentCache.get(id);
      
      if (!content) {
        content = await this.fileSystem.readBlogContent(id);
        this.contentCache.set(id, content);
      }

      const assets = await this.fileSystem.listAssets(id);

      return {
        ...blogMeta,
        content,
        assets
      };
    } catch (error) {
      throw new Error(`Failed to load blog ${id}: ${error}`);
    }
  }

  // 更新博客
  async updateBlog(id: string, input: UpdateBlogInput): Promise<Blog> {
    const meta = await this.getMeta();
    const oldBlog = meta.blogs[id];
    
    if (!oldBlog) {
      throw new Error(`Blog ${id} not found`);
    }

    const now = new Date().toISOString();
    const updatedMeta: BlogMeta = {
      ...oldBlog,
      title: input.title ?? oldBlog.title,
      description: input.content ? textPreview(input.content) : oldBlog.description,
      published: input.published ?? oldBlog.published,
      tags: input.tags ?? oldBlog.tags ?? [],
      categories: input.categories ?? oldBlog.categories ?? [],
      updatedAt: now
    };

    try {
      // 更新内容
      if (input.content !== undefined) {
        await this.fileSystem.writeBlogContent(id, input.content);
        this.contentCache.set(id, input.content);
      }

      // 更新配置
      await this.fileSystem.writeBlogConfig(id, {
        title: updatedMeta.title,
        description: updatedMeta.description,
        createdAt: oldBlog.createdAt,
        updatedAt: now,
        published: updatedMeta.published,
        tags: updatedMeta.tags,
        categories: updatedMeta.categories
      });

      // 更新缓存和索引
      meta.blogs[id] = updatedMeta;
      meta.lastUpdated = now;

      if (input.categories) {
        meta.categories = [...new Set([...meta.categories, ...input.categories])];
      }
      if (input.tags) {
        meta.tags = [...new Set([...meta.tags, ...input.tags])];
      }

      await this.fileSystem.saveMeta(meta);
      this.metaCache = meta;
      this.index.updateBlog(id, oldBlog, updatedMeta);

      return await this.getBlog(id);
    } catch (error) {
      throw new Error(`Failed to update blog ${id}: ${error}`);
    }
  }

  // 删除博客
  async deleteBlog(id: string): Promise<void> {
    const meta = await this.getMeta();
    const blog = meta.blogs[id];
    
    if (!blog) {
      throw new Error(`Blog ${id} not found`);
    }

    try {
      await this.fileSystem.deleteBlogDirectory(id);
      this.contentCache.delete(id);
      this.index.removeBlog(id, blog);
      
      delete meta.blogs[id];
      meta.lastUpdated = new Date().toISOString();
      
      await this.fileSystem.saveMeta(meta);
      this.metaCache = meta;
    } catch (error) {
      throw new Error(`Failed to delete blog ${id}: ${error}`);
    }
  }

  // 列出博客
  async listBlogs(options: { 
    page?: number, 
    page_size?: number, 
    published_only?: boolean,
    categories?: string[],
    tags?: string[],
    query?: string
  } = {}): Promise<{ blogs_info: BlogMeta[], total: number }> {
    const meta = await this.getMeta();
    let matchedIds = new Set<string>();

    // 使用索引进行搜索
    if (options.query) {
      matchedIds = this.index.search(options.query);
    }

    if (options.categories?.length) {
      const categoryMatches = this.index.searchByCategories(options.categories);
      matchedIds = matchedIds.size ? 
        new Set([...matchedIds].filter(id => categoryMatches.has(id))) :
        categoryMatches;
    }

    if (options.tags?.length) {
      const tagMatches = this.index.searchByTags(options.tags);
      matchedIds = matchedIds.size ? 
        new Set([...matchedIds].filter(id => tagMatches.has(id))) :
        tagMatches;
    }

    // 如果没有任何过滤条件，使用所有博客
    if (!matchedIds.size && !options.query && !options.categories?.length && !options.tags?.length) {
      matchedIds = new Set(Object.keys(meta.blogs));
    }

    // 过滤已发布状态
    if (options.published_only) {
      matchedIds = new Set([...matchedIds].filter(id => meta.blogs[id].published));
    }

    // 按创建时间排序
    const sortedBlogs = [...matchedIds]
      .map(id => meta.blogs[id])
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = sortedBlogs.length;

    // 应用分页
    if (options.page && options.page_size) {
      const start = (options.page - 1) * options.page_size;
      const end = start + options.page_size;
      return {
        blogs_info: sortedBlogs.slice(start, end),
        total
      };
    }

    return { blogs_info: sortedBlogs, total };
  }

  // 获取资源文件
  async getAsset(blogId: string, fileName: string): Promise<{ buffer: Buffer, size: number, lastModified: string } | null> {
    return this.fileSystem.getAsset(blogId, fileName);
  }

  // 添加资源文件
  async addAsset(blogId: string, fileName: string, content: Buffer): Promise<string> {
    return this.fileSystem.addAsset(blogId, fileName, content);
  }

  // 删除资源文件
  async deleteAsset(blogId: string, fileName: string): Promise<void> {
    return this.fileSystem.deleteAsset(blogId, fileName);
  }
} 