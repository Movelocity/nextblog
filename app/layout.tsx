import type { Metadata } from "next";
import { SidePanel } from "@/app/components/layout/SidePanel";
import "./globals.css";
import { getSiteConfig } from '@/app/services/system';

export const metadata: Metadata = {
  title: "Next Blog",
  description: "A modern blog management system built with Next.js",
};

import { ToastProvider } from '@/app/components/layout/ToastHook';
import { LoginModal } from '@/app/components/Auth/LoginModal';

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
        data-icp-info={siteConfig?.icpInfo || ''}
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
