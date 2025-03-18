import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import { existsSync } from 'fs';
import { BlogConfig, BlogMeta, BlogMetaCache } from '@/app/common/types';
import { BLOG_CONFIG } from '@/app/common/config';

export class BlogFileSystem {
  constructor(private rootDir: string) {}

  // 初始化存储目录
  async init(): Promise<void> {
    try {
      await fs.mkdir(this.rootDir, { recursive: true });
      const metaPath = path.join(this.rootDir, BLOG_CONFIG.META_FILE);
      
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

  // 读取元数据文件
  async loadMeta(): Promise<BlogMetaCache> {
    try {
      const content = await fs.readFile(
        path.join(this.rootDir, BLOG_CONFIG.META_FILE), 
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

  // 保存元数据文件
  async saveMeta(meta: BlogMetaCache): Promise<void> {
    try {
      await fs.writeFile(
        path.join(this.rootDir, BLOG_CONFIG.META_FILE),
        JSON.stringify(meta, null, 2)
      );
    } catch (error) {
      throw new Error(`Failed to save meta cache: ${error}`);
    }
  }

  // 读取博客内容
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

  // 写入博客内容
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

  // 读取博客配置
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

  // 写入博客配置
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

  // 创建博客目录
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

  // 删除博客目录
  async deleteBlogDirectory(id: string): Promise<void> {
    try {
      await fs.rm(path.join(this.rootDir, id), { recursive: true });
    } catch (error) {
      throw new Error(`Failed to delete blog directory: ${error}`);
    }
  }

  // 列出博客资源
  async listAssets(id: string): Promise<string[]> {
    try {
      return await fs.readdir(path.join(this.rootDir, id, BLOG_CONFIG.ASSETS_DIR));
    } catch (error) {
      console.error(`Error listing assets for blog ${id}:`, error);
      return [];
    }
  }

  // 批量处理目录
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

  // 实用工具：重试操作
  async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
  ): Promise<T> {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
    
    throw lastError;
  }
} 