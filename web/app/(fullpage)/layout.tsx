import { type Metadata } from "next";
import "../globals.css";
import { ToastProvider } from '@/app/components/layout/ToastHook';
import { LoginModal } from '@/app/components/Auth/LoginModal';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Next Blog",
    description: "A modern blog management system built with Next.js",
    other: {
      "API_BASE_URL": process.env.API_BASE_URL || "http://localhost:3000",
    }
  }
}

/**
 * 全屏布局 - 无系统侧边栏导航
 * 用于需要最大化工作区域的功能页面
 */
export default function FullpageLayout({children}: {children: React.ReactNode;}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="bg-gray-50 dark:bg-black text-black dark:text-white">
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

