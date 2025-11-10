import os from 'os';
import fs from 'fs/promises';
import path from 'path';
import { existsSync, statSync } from 'fs';
import { BLOG_CONFIG } from '@/app/common/globals';

/**
 * 利用 Node.js 的模块缓存特性, 在服务启动时记录服务启动时间
 */
export const BOOT_TIME_UTC = new Date().getTime();

/**
 * 获取系统内存信息
 * @returns 系统内存使用情况（字节）
 */
export const getSystemMemory = () => {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  
  return {
    total: totalMemory,
    free: freeMemory,
    used: usedMemory,
    usage_percent: ((usedMemory / totalMemory) * 100).toFixed(2),
  };
};

/**
 * 获取进程内存信息
 * @returns 进程内存使用情况（字节）
 */
export const getProcessMemory = () => {
  const memoryUsage = process.memoryUsage();
  
  return {
    rss: memoryUsage.rss, // Resident Set Size - 进程占用的物理内存
    heap_total: memoryUsage.heapTotal, // V8 堆内存总量
    heap_used: memoryUsage.heapUsed, // V8 堆内存已使用
    external: memoryUsage.external, // C++ 对象占用的内存
    array_buffers: memoryUsage.arrayBuffers, // ArrayBuffer 和 SharedArrayBuffer 占用的内存
  };
};

/**
 * 递归计算目录大小
 * @param dirPath 目录路径
 * @returns 目录大小（字节）
 */
const calculateDirectorySize = async (dirPath: string): Promise<number> => {
  if (!existsSync(dirPath)) {
    return 0;
  }

  try {
    const stats = statSync(dirPath);
    if (!stats.isDirectory()) {
      return stats.size;
    }

    let totalSize = 0;
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      try {
        if (entry.isDirectory()) {
          totalSize += await calculateDirectorySize(fullPath);
        } else {
          const fileStats = await fs.stat(fullPath);
          totalSize += fileStats.size;
        }
      } catch (error) {
        // 忽略无法访问的文件/目录
        console.warn(`Cannot access ${fullPath}:`, error);
      }
    }

    return totalSize;
  } catch (error) {
    console.warn(`Error calculating size for ${dirPath}:`, error);
    return 0;
  }
};

/**
 * 获取程序占用的磁盘空间
 * @returns 各个目录的磁盘使用情况（字节）
 */
export const getDiskUsage = async () => {
  const rootDir = BLOG_CONFIG.ROOT_DIR;
  const result: Record<string, number> = {};

  // 计算根目录总大小
  result.total = await calculateDirectorySize(rootDir);

  // 计算各个子目录的大小
  const subDirs = ['images', 'thumbnails', 'notes', 'image-edit'];
  
  for (const subDir of subDirs) {
    const subDirPath = path.join(rootDir, subDir);
    result[subDir] = await calculateDirectorySize(subDirPath);
  }

  // 计算博客目录的总大小（排除已单独计算的目录）
  let blogsSize = 0;
  if (existsSync(rootDir)) {
    try {
      const entries = await fs.readdir(rootDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !subDirs.includes(entry.name) && entry.name !== 'node_modules') {
          const blogPath = path.join(rootDir, entry.name);
          blogsSize += await calculateDirectorySize(blogPath);
        }
      }
    } catch (error) {
      console.warn(`Error calculating blogs size:`, error);
    }
  }
  result.blogs = blogsSize;

  return result;
};

/**
 * 格式化字节数为人类可读的格式
 * @param bytes 字节数
 * @returns 格式化后的字符串
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};
