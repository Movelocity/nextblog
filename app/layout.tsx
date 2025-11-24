import type { Metadata } from "next";
import { SidePanel } from "@/app/components/layout/SidePanel";
import "./globals.css";
import fs from 'fs/promises';
import path from 'path';
import { BLOG_CONFIG } from '@/app/common/globals';
import type { SiteConfig } from '@/app/common/types';

export const metadata: Metadata = {
  title: "Next Blog",
  description: "A modern blog management system built with Next.js",
};

import { ToastProvider } from '@/app/components/layout/ToastHook';
import { LoginModal } from '@/app/components/Auth/LoginModal';

/**
 * 读取站点配置
 * 从 site-config.json 文件中读取配置（运行时可修改）
 */
async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const configPath = path.join(process.cwd(), BLOG_CONFIG.ROOT_DIR, BLOG_CONFIG.SITE_CONFIG_FILE);
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.log('No site config found, using defaults');
    return { icpInfo: '' };
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteConfig = await getSiteConfig();
  
  return (
    <html lang="zh-CN">
      <body 
        className="bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-white"
        data-icp-info={siteConfig.icpInfo || ''}
      >
        <ToastProvider>
          {/* <Navigation /> */}
          <div className="flex flex-row">
            <SidePanel />
            <main className="auto-container">
              {children}
            </main>
          </div>
          <LoginModal />
        </ToastProvider>
      </body>
    </html>
  );
}
