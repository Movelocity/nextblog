import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import { existsSync } from 'fs';
import { BlogConfig, BlogMetaCache } from '@/app/common/types';
import { BLOG_CONFIG } from '@/app/common/config';

/**
 * 博客文件系统
 * 
 * 博客文件系统是博客管理系统的核心组件，负责处理博客文件的读写操作。
 * 它提供了以下功能：
 * 1. 初始化存储目录
 * 2. 读取元数据文件
 * 3. 保存元数据文件
 * 4. 读取博客内容
 * 5. 写入博客内容
 */
export class BlogFileSystem {
  constructor(private rootDir: string, private metaFile: string) {}

  /**
   * 初始化存储目录
   * 
   * 初始化存储目录，创建必要的文件和目录。
   * 如果目录不存在，则创建目录，并创建元数据文件。
   * 如果元数据文件不存在，则创建元数据文件。
   */
  async init(): Promise<void> {
    try {
      await fs.mkdir(this.rootDir, { recursive: true });
      const metaPath = path.join(this.rootDir, this.metaFile);
      
      try {
        await fs.access(metaPath);
      } catch {
        await this.saveMeta({ 
          lastUpdated: new Date().toISOString(), 
          blogs: {},
          categories: [],
          tags: []
        });
      }
    } catch (error) {
      throw new Error(`Failed to initialize blog storage: ${error}`);
    }
  }

  /**
   * 读取元数据文件
   * 
   * 读取元数据文件，返回元数据缓存。
   */
  async loadMeta(): Promise<BlogMetaCache> {
    try {
      const content = await fs.readFile(
        path.join(this.rootDir, this.metaFile), 
        'utf-8'
      );
      return JSON.parse(content);
    } catch (error) {
      console.error(`Failed to load meta cache: ${error}`);
      return {
        lastUpdated: new Date().toISOString(),
        blogs: {},
        categories: [],
        tags: []
      };
    }
  }

  /**
   * 保存元数据文件
   * 
   * 保存元数据文件，将元数据缓存写入文件。
   */
  async saveMeta(meta: BlogMetaCache): Promise<void> {
    try {
      await fs.writeFile(
        path.join(this.rootDir, this.metaFile),
        JSON.stringify(meta, null, 2)
      );
    } catch (error) {
      throw new Error(`Failed to save meta cache: ${error}`);
    }
  }

  /**
   * 读取博客内容
   * 
   * 读取博客内容，返回博客内容。
   */
  async readBlogContent(id: string): Promise<string> {
    try {
      return await fs.readFile(
        path.join(this.rootDir, id, BLOG_CONFIG.CONTENT_FILE),
        'utf-8'
      );
    } catch (error) {
      throw new Error(`Failed to read blog content: ${error}`);
    }
  }

  /**
   * 写入博客内容
   * 
   * 写入博客内容，将博客内容写入文件。
   */
  async writeBlogContent(id: string, content: string): Promise<void> {
    try {
      await fs.writeFile(
        path.join(this.rootDir, id, BLOG_CONFIG.CONTENT_FILE),
        content
      );
    } catch (error) {
      throw new Error(`Failed to write blog content: ${error}`);
    }
  }

  /**
   * 读取博客配置
   * 
   * 读取博客配置，返回博客配置。
   */
  async readBlogConfig(id: string): Promise<BlogConfig> {
    try {
      const configContent = await fs.readFile(
        path.join(this.rootDir, id, 'config.yaml'),
        'utf-8'
      );
      return yaml.parse(configContent);
    } catch (error) {
      throw new Error(`Failed to read blog config: ${error}`);
    }
  }

  /**
   * 写入博客配置
   * 
   * 写入博客配置，将博客配置写入文件。
   */
  async writeBlogConfig(id: string, config: BlogConfig): Promise<void> {
    try {
      await fs.writeFile(
        path.join(this.rootDir, id, 'config.yaml'),
        yaml.stringify(config)
      );
    } catch (error) {
      throw new Error(`Failed to write blog config: ${error}`);
    }
  }

  /**
   * 创建博客目录
   * 
   * 创建博客目录，创建博客目录和资源目录。
   */
  async createBlogDirectory(id: string): Promise<void> {
    const blogDir = path.join(this.rootDir, id);
    const assetsDir = path.join(blogDir, BLOG_CONFIG.ASSETS_DIR);
    
    try {
      await fs.mkdir(blogDir, { recursive: true });
      await fs.mkdir(assetsDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create blog directory: ${error}`);
    }
  }

  /**
   * 删除博客目录
   * 
   * 删除博客目录，删除博客目录和资源目录。
   */
  async deleteBlogDirectory(id: string): Promise<void> {
    try {
      await fs.rm(path.join(this.rootDir, id), { recursive: true });
    } catch (error) {
      throw new Error(`Failed to delete blog directory: ${error}`);
    }
  }

  /**
   * 列出博客资源
   * 
   * 列出博客资源，返回博客资源列表。
   */
  async listAssets(id: string): Promise<string[]> {
    try {
      return await fs.readdir(path.join(this.rootDir, id, BLOG_CONFIG.ASSETS_DIR));
    } catch (error) {
      console.error(`Error listing assets for blog ${id}:`, error);
      return [];
    }
  }

  /**
   * 读取资源文件
   * 
   * 读取资源文件，返回资源文件。
   */
  async getAsset(id: string, fileName: string): Promise<{ buffer: Buffer, size: number, lastModified: string } | null> {
    try {
      const assetPath = path.join(this.rootDir, id, BLOG_CONFIG.ASSETS_DIR, fileName);
      if (!existsSync(assetPath)) {
        return null;
      }
      const buffer = await fs.readFile(assetPath);
      const stats = await fs.stat(assetPath);
      return {
        buffer,
        size: stats.size,
        lastModified: stats.mtime.toISOString()
      };
    } catch (error) {
      console.error(`Error reading asset ${fileName} for blog ${id}:`, error);
      return null;
    }
  }

  /**
   * 添加资源文件
   * 
   * 添加资源文件，将资源文件写入文件。
   */
  async addAsset(id: string, fileName: string, content: Buffer): Promise<string> {
    try {
      const assetsDir = path.join(this.rootDir, id, BLOG_CONFIG.ASSETS_DIR);
      // 确保assets目录存在
      await fs.mkdir(assetsDir, { recursive: true });
      
      const assetPath = path.join(assetsDir, fileName);
      await fs.writeFile(assetPath, content);
      
      return `${id}/assets/${fileName}`;
    } catch (error) {
      throw new Error(`Failed to add asset ${fileName} to blog ${id}: ${error}`);
    }
  }

  /**
   * 删除资源文件
   * 
   * 删除资源文件，删除资源文件。
   */
  async deleteAsset(id: string, fileName: string): Promise<void> {
    try {
      const assetPath = path.join(this.rootDir, id, BLOG_CONFIG.ASSETS_DIR, fileName);
      if (existsSync(assetPath)) {
        await fs.unlink(assetPath);
      }
    } catch (error) {
      throw new Error(`Failed to delete asset ${fileName} from blog ${id}: ${error}`);
    }
  }

  /**
   * 批量处理目录
   * 
   * 批量处理目录，返回目录列表。
   */
  async processBlogDirectories<T>(
    processor: (dir: string) => Promise<T | null>,
    batchSize = 10
  ): Promise<T[]> {
    try {
      const dirs = await fs.readdir(this.rootDir);
      const results: T[] = [];
      
      // 分批处理目录
      for (let i = 0; i < dirs.length; i += batchSize) {
        const batch = dirs.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async dir => {
            if (dir === BLOG_CONFIG.META_FILE) return null;
            
            const stat = await fs.stat(path.join(this.rootDir, dir));
            if (!stat.isDirectory()) return null;
            
            return processor(dir);
          })
        );
        
        // 过滤掉 null 值并添加到结果中
        for (const result of batchResults) {
          if (result !== null) {
            results.push(result);
          }
        }
      }
      
      return results;
    } catch (error) {
      throw new Error(`Failed to process blog directories: ${error}`);
    }
  }
} 