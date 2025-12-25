import { type Metadata } from "next";
import "../globals.css";
import Script from "next/script";
import { ToastProvider } from '@/app/components/layout/ToastHook';
import { LoginModal } from '@/app/components/Auth/LoginModal';

export const metadata: Metadata = {
  title: "Next Blog",
  description: "A modern blog management system built with Next.js",
};

/**
 * 全屏布局 - 无系统侧边栏导航
 * 用于需要最大化工作区域的功能页面
 */
export default function FullpageLayout({children}: {children: React.ReactNode;}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="bg-gray-50 dark:bg-black text-black dark:text-white">
        <Script src="/runtime-env.js" strategy="beforeInteractive" />
        <ToastProvider>
          <main className="w-screen h-screen overflow-hidden">
            {children}
          </main>
          <LoginModal />
        </ToastProvider>
      </body>
    </html>
  );
}

