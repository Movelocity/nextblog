import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import { existsSync } from 'fs';
import { 
  BLOG_CONFIG, 
  BlogMeta, 
  Blog, 
  CreateBlogInput,
  UpdateBlogInput,
  BlogMetaCache,
  BlogConfig
} from '../common/types';

/**
 * BlogStorage class handles all blog-related file operations
 * including creating, reading, updating, and deleting blogs and their assets.
 */
export class BlogStorage {
  private rootDir: string;
  private metaFile: string;
  private metaCache: BlogMetaCache | null = null;
  private static instance: BlogStorage | null = null;

  private constructor(rootDir?: string) {
    this.rootDir = rootDir || BLOG_CONFIG.ROOT_DIR;
    console.log('rootDir: ', this.rootDir);
    this.metaFile = path.join(this.rootDir, BLOG_CONFIG.META_FILE);
  }

  /**
   * Get the singleton instance of BlogStorage
   */
  public static getInstance(): BlogStorage {
    if (!BlogStorage.instance) {
      BlogStorage.instance = new BlogStorage();
      // Initialize the storage
      BlogStorage.instance.init().catch(console.error);
    }
    return BlogStorage.instance;
  }

  // Initialize storage - create necessary directories and scan existing blogs
  async init(): Promise<void> {
    try {
      await fs.mkdir(this.rootDir, { recursive: true });
      
      // Create meta file if it doesn't exist
      try {
        await fs.access(this.metaFile);
      } catch {
        await this.saveMeta({ 
          lastUpdated: new Date().toISOString(), 
          blogs: {},
          categories: [],
          tags: []
        });
      }

      // Scan existing blogs and update meta
      await this.scanAndUpdateMeta();
    } catch (error) {
      throw new Error(`Failed to initialize blog storage: ${error}`);
    }
  }

  // Scan all blogs and update meta file
  private async scanAndUpdateMeta(): Promise<void> {
    try {
      // const meta = await this.loadMeta();
      const blogDirs = await fs.readdir(this.rootDir);
      
      const newMeta: BlogMetaCache = {
        lastUpdated: new Date().toISOString(),
        blogs: {},
        categories: [],
        tags: []
      };

      for (const dir of blogDirs) {
        // Skip non-directory items and meta.json
        if (dir === BLOG_CONFIG.META_FILE) continue;
        
        const stat = await fs.stat(path.join(this.rootDir, dir));
        if (!stat.isDirectory()) continue;

        try {
          const configPath = path.join(this.rootDir, dir, 'config.yaml');
          if(!existsSync(configPath)) continue;
          const configContent = await fs.readFile(configPath, 'utf-8');
          const config: BlogConfig = yaml.parse(configContent);

          const blogMeta: BlogMeta = {
            id: dir,
            ...config
          };

          newMeta.blogs[dir] = blogMeta;
          
          // Update categories and tags
          newMeta.categories = [...new Set([...newMeta.categories, ...(config.categories || [])])];
          newMeta.tags = [...new Set([...newMeta.tags, ...(config.tags || [])])];
        } catch (err) {
          console.error(`Error reading config for blog ${dir}:`, err);
        }
      }

      await this.saveMeta(newMeta);
    } catch (error) {
      throw new Error(`Failed to scan and update meta: ${error}`);
    }
  }

  // Load metadata cache
  private async loadMeta(): Promise<BlogMetaCache> {
    if (this.metaCache) return this.metaCache;
    
    try {
      const content = await fs.readFile(this.metaFile, 'utf-8');
      this.metaCache = JSON.parse(content);
      return this.metaCache!;
    } catch (error) {
      throw new Error(`Failed to load meta cache: ${error}`);
    }
  }

  // Save metadata cache
  private async saveMeta(meta: BlogMetaCache): Promise<void> {
    try {
      await fs.writeFile(this.metaFile, JSON.stringify(meta, null, 2));
      this.metaCache = meta;
    } catch (error) {
      throw new Error(`Failed to save meta cache: ${error}`);
    }
  }

  // Create a new blog
  async createBlog(input: CreateBlogInput): Promise<Blog> {
    const meta = await this.loadMeta();
    
    // Check if blog ID already exists
    if (meta.blogs[input.id]) {
      throw new Error(`Blog with ID ${input.id} already exists`);
    }

    const blogDir = path.join(this.rootDir, input.id);
    const assetsDir = path.join(blogDir, BLOG_CONFIG.ASSETS_DIR);
    const now = new Date().toISOString();

    const blogMeta: BlogMeta = {
      id: input.id,
      title: input.title,
      description: input.description,
      createdAt: now,
      updatedAt: now,
      published: input.published ?? false,
      tags: Array.isArray(input.tags) ? input.tags : [],
      categories: Array.isArray(input.categories) ? input.categories : []
    };

    const blogConfig: BlogConfig = {
      title: input.title,
      description: input.description,
      createdAt: now,
      updatedAt: now,
      published: input.published ?? false,
      tags: Array.isArray(input.tags) ? input.tags : [],
      categories: Array.isArray(input.categories) ? input.categories : []
    };

    try {
      // Create blog directory and assets subdirectory
      await fs.mkdir(blogDir, { recursive: true });
      await fs.mkdir(assetsDir, { recursive: true });

      // Write content file
      await fs.writeFile(
        path.join(blogDir, BLOG_CONFIG.CONTENT_FILE),
        input.content
      );

      // Write config file
      await fs.writeFile(
        path.join(blogDir, 'config.yaml'),
        yaml.stringify(blogConfig)
      );

      // Update meta cache with new categories and tags
      meta.blogs[input.id] = blogMeta;
      meta.categories = [...new Set([...meta.categories, ...(input.categories || [])])];
      meta.tags = [...new Set([...meta.tags, ...(input.tags || [])])];
      meta.lastUpdated = now;
      await this.saveMeta(meta);

      return {
        ...blogMeta,
        content: input.content,
        assets: [],
      };
    } catch (error) {
      // Cleanup on failure
      try {
        await fs.rm(blogDir, { recursive: true, force: true });
      } catch {}
      throw new Error(`Failed to create blog: ${error}`);
    }
  }

  // Get a blog by ID
  async getBlog(id: string): Promise<Blog> {
    const meta = await this.loadMeta();
    const blogMeta = meta.blogs[id];
    
    if (!blogMeta) {
      throw new Error(`Blog ${id} not found`);
    }

    try {
      const blogDir = path.join(this.rootDir, id);
      const content = await fs.readFile(
        path.join(blogDir, BLOG_CONFIG.CONTENT_FILE),
        'utf-8'
      );

      // List assets
      const assetsDir = path.join(blogDir, BLOG_CONFIG.ASSETS_DIR);
      const assets = await fs.readdir(assetsDir).catch(() => [] as string[]);

      return {
        ...blogMeta,
        content,
        assets,
      };
    } catch (error) {
      throw new Error(`Failed to load blog ${id}: ${error}`);
    }
  }

  // Update a blog
  async updateBlog(id: string, input: UpdateBlogInput): Promise<Blog> {
    const meta = await this.loadMeta();
    const blogMeta = meta.blogs[id];
    
    if (!blogMeta) {
      throw new Error(`Blog ${id} not found`);
    }

    const now = new Date().toISOString();
    const updatedMeta: BlogMeta = {
      ...blogMeta,
      title: input.title ?? blogMeta.title,
      description: input.description ?? blogMeta.description,
      published: input.published ?? blogMeta.published,
      tags: input.tags ?? blogMeta.tags ?? [],
      categories: input.categories ?? blogMeta.categories ?? [],
      updatedAt: now,
    };

    const updatedConfig: BlogConfig = {
      title: updatedMeta.title,
      description: updatedMeta.description,
      createdAt: blogMeta.createdAt,
      updatedAt: now,
      published: updatedMeta.published,
      tags: updatedMeta.tags ?? [],
      categories: updatedMeta.categories ?? []
    };

    try {
      // Update content if provided
      if (input.content !== undefined) {
        await fs.writeFile(
          path.join(this.rootDir, id, BLOG_CONFIG.CONTENT_FILE),
          input.content
        );
      }

      // Update config file
      await fs.writeFile(
        path.join(this.rootDir, id, 'config.yaml'),
        yaml.stringify(updatedConfig)
      );

      // Update meta cache
      meta.blogs[id] = updatedMeta;
      meta.lastUpdated = now;

      // Update categories and tags lists
      if (input.categories) {
        meta.categories = [...new Set([...meta.categories, ...input.categories])];
      }
      if (input.tags) {
        meta.tags = [...new Set([...meta.tags, ...input.tags])];
      }

      await this.saveMeta(meta);

      // Return updated blog
      return await this.getBlog(id);
    } catch (error) {
      throw new Error(`Failed to update blog ${id}: ${error}`);
    }
  }

  // Delete a blog
  async deleteBlog(id: string): Promise<void> {
    const meta = await this.loadMeta();
    
    if (!meta.blogs[id]) {
      throw new Error(`Blog ${id} not found`);
    }

    try {
      // Remove blog directory
      await fs.rm(path.join(this.rootDir, id), { recursive: true });

      // Update meta cache
      delete meta.blogs[id];
      meta.lastUpdated = new Date().toISOString();
      await this.saveMeta(meta);
    } catch (error) {
      throw new Error(`Failed to delete blog ${id}: ${error}`);
    }
  }

  // List all blogs
  async listBlogs(options: { page?: number, page_size?: number, published_only?: boolean } = {}): Promise<BlogMeta[]> {
    const meta = await this.loadMeta();
    let blogs = Object.values(meta.blogs);

    if (options.published_only) {
      blogs = blogs.filter(blog => blog.published === true);
    }
    if (options.page && options.page_size) {
      blogs = blogs.slice((options.page - 1) * options.page_size, options.page * options.page_size);
    }

    return blogs;
  }

  // Add an asset to a blog
  async addAsset(blogId: string, fileName: string, content: Buffer): Promise<string> {
    const meta = await this.loadMeta();
    
    if (!meta.blogs[blogId]) {
      throw new Error(`Blog ${blogId} not found`);
    }

    const assetsDir = path.join(this.rootDir, blogId, BLOG_CONFIG.ASSETS_DIR);
    const assetPath = path.join(assetsDir, fileName);

    try {
      await fs.writeFile(assetPath, content);
      return path.join(blogId, BLOG_CONFIG.ASSETS_DIR, fileName);
    } catch (error) {
      throw new Error(`Failed to add asset to blog ${blogId}: ${error}`);
    }
  }

  // Delete an asset from a blog
  async deleteAsset(blogId: string, fileName: string): Promise<void> {
    const meta = await this.loadMeta();
    
    if (!meta.blogs[blogId]) {
      throw new Error(`Blog ${blogId} not found`);
    }

    const assetPath = path.join(this.rootDir, blogId, BLOG_CONFIG.ASSETS_DIR, fileName);

    try {
      await fs.unlink(assetPath);
    } catch (error) {
      throw new Error(`Failed to delete asset from blog ${blogId}: ${error}`);
    }
  }
}

// Export the singleton instance
export default BlogStorage.getInstance(); 