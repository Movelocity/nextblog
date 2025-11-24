import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { BLOG_CONFIG } from '@/app/common/globals';
import type { SiteConfig } from '@/app/common/types';
import { requireAuth } from '@/app/lib/auth';

/**
 * 获取站点配置文件路径
 */
const getSiteConfigPath = (): string => {
  return path.join(process.cwd(), BLOG_CONFIG.ROOT_DIR, BLOG_CONFIG.SITE_CONFIG_FILE);
};

/**
 * GET - 读取站点配置
 * 公开访问，因为前端需要读取备案信息等公开数据
 */
export async function GET() {
  try {
    const configPath = getSiteConfigPath();
    const content = await fs.readFile(configPath, 'utf-8');
    const config: SiteConfig = JSON.parse(content);
    
    return NextResponse.json(config);
  } catch (error) {
    // 如果文件不存在，返回默认配置
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      const defaultConfig: SiteConfig = {
        icpInfo: '',
        siteName: 'Next Blog',
        siteDescription: 'A modern blog management system',
      };
      return NextResponse.json(defaultConfig);
    }
    
    console.error('Error reading site config:', error);
    return NextResponse.json(
      { error: 'Failed to read site configuration' },
      { status: 500 }
    );
  }
}

/**
 * POST - 更新站点配置
 * 需要管理员认证
 */
export const POST = requireAuth(async (request: NextRequest) => {
  try {
    const config: SiteConfig = await request.json();
    
    // 验证配置数据
    if (typeof config !== 'object' || config === null) {
      return NextResponse.json(
        { error: 'Invalid configuration data' },
        { status: 400 }
      );
    }
    
    const configPath = getSiteConfigPath();
    
    // 确保目录存在
    const configDir = path.dirname(configPath);
    await fs.mkdir(configDir, { recursive: true });
    
    // 写入配置文件
    await fs.writeFile(
      configPath,
      JSON.stringify(config, null, 2),
      'utf-8'
    );
    
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error updating site config:', error);
    return NextResponse.json(
      { error: 'Failed to update site configuration' },
      { status: 500 }
    );
  }
});

