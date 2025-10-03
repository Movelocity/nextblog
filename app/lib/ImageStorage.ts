import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { BLOG_CONFIG } from '@/app/common/globals';

/**
 * 独立图片存储服务
 * 
 * 处理图片和缩略图的独立存储，与博客系统分离
 * 存储结构：
 * - {ROOT_DIR}/images/  - 原图存储
 * - {ROOT_DIR}/thumbnails/  - 缩略图存储
 */
export class ImageStorage {
  private rootDir: string;
  private imageDir: string;
  private thumbnailDir: string;

  private constructor() {
    this.rootDir = BLOG_CONFIG.ROOT_DIR;
    this.imageDir = path.join(this.rootDir, 'images');
    this.thumbnailDir = path.join(this.rootDir, 'thumbnails');
  }

  private static instance: ImageStorage | null = null;

  public static getInstance(): ImageStorage {
    if (!ImageStorage.instance) {
      ImageStorage.instance = new ImageStorage();
      ImageStorage.instance.init();
      console.log('ImageStorage initialized');
    }
    return ImageStorage.instance;
  }

  /**
   * 初始化存储目录
   */
  async init(): Promise<void> {
    try {
      await fs.mkdir(this.imageDir, { recursive: true });
      await fs.mkdir(this.thumbnailDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to initialize image storage: ${error}`);
    }
  }

  /**
   * 保存图片文件
   * @param fileName 文件名（包含扩展名）
   * @param content 文件内容
   * @returns 文件路径
   */
  async saveImage(fileName: string, content: Buffer): Promise<string> {
    try {
      const imagePath = path.join(this.imageDir, fileName);
      await fs.writeFile(imagePath, content);
      return `images/${fileName}`;
    } catch (error) {
      throw new Error(`Failed to save image ${fileName}: ${error}`);
    }
  }

  /**
   * 保存缩略图文件
   * @param fileName 文件名（与原图相同的ID和扩展名）
   * @param content 缩略图内容
   * @returns 文件路径
   */
  async saveThumbnail(fileName: string, content: Buffer): Promise<string> {
    try {
      const thumbnailPath = path.join(this.thumbnailDir, fileName);
      await fs.writeFile(thumbnailPath, content);
      return `thumbnails/${fileName}`;
    } catch (error) {
      throw new Error(`Failed to save thumbnail ${fileName}: ${error}`);
    }
  }

  /**
   * 获取图片文件
   * @param fileName 文件名
   * @returns 文件数据或null
   */
  async getImage(fileName: string): Promise<{ buffer: Buffer, size: number, lastModified: string } | null> {
    try {
      const imagePath = path.join(this.imageDir, fileName);
      if (!existsSync(imagePath)) {
        return null;
      }
      const buffer = await fs.readFile(imagePath);
      const stats = await fs.stat(imagePath);
      return {
        buffer,
        size: stats.size,
        lastModified: stats.mtime.toISOString()
      };
    } catch (error) {
      console.error(`Error reading image ${fileName}:`, error);
      return null;
    }
  }

  /**
   * 获取缩略图文件
   * @param fileName 文件名
   * @returns 缩略图数据或null
   */
  async getThumbnail(fileName: string): Promise<{ buffer: Buffer, size: number, lastModified: string } | null> {
    try {
      const thumbnailPath = path.join(this.thumbnailDir, fileName);
      if (!existsSync(thumbnailPath)) {
        return null;
      }
      const buffer = await fs.readFile(thumbnailPath);
      const stats = await fs.stat(thumbnailPath);
      return {
        buffer,
        size: stats.size,
        lastModified: stats.mtime.toISOString()
      };
    } catch (error) {
      console.error(`Error reading thumbnail ${fileName}:`, error);
      return null;
    }
  }

  /**
   * 删除图片文件
   * @param fileName 文件名
   */
  async deleteImage(fileName: string): Promise<void> {
    try {
      const imagePath = path.join(this.imageDir, fileName);
      if (existsSync(imagePath)) {
        await fs.unlink(imagePath);
      }
    } catch (error) {
      throw new Error(`Failed to delete image ${fileName}: ${error}`);
    }
  }

  /**
   * 删除缩略图文件
   * @param fileName 文件名
   */
  async deleteThumbnail(fileName: string): Promise<void> {
    try {
      const thumbnailPath = path.join(this.thumbnailDir, fileName);
      if (existsSync(thumbnailPath)) {
        await fs.unlink(thumbnailPath);
      }
    } catch (error) {
      throw new Error(`Failed to delete thumbnail ${fileName}: ${error}`);
    }
  }

  /**
   * 删除图片及其缩略图
   * @param fileName 文件名
   */
  async deleteImageAndThumbnail(fileName: string): Promise<void> {
    await Promise.all([
      this.deleteImage(fileName),
      this.deleteThumbnail(fileName)
    ]);
  }

  /**
   * 列出所有图片文件
   * @returns 图片文件名列表
   */
  async listImages(): Promise<string[]> {
    try {
      return await fs.readdir(this.imageDir);
    } catch (error) {
      console.error('Error listing images:', error);
      return [];
    }
  }

  /**
   * 列出所有缩略图文件
   * @returns 缩略图文件名列表
   */
  async listThumbnails(): Promise<string[]> {
    try {
      return await fs.readdir(this.thumbnailDir);
    } catch (error) {
      console.error('Error listing thumbnails:', error);
      return [];
    }
  }
}

export default ImageStorage.getInstance();
