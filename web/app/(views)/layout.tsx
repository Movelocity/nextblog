import { type Metadata } from "next";
import { SidePanel } from "@/app/components/layout/SidePanel";
import Script from "next/script";
import "../globals.css";
import { ToastProvider } from '@/app/components/layout/ToastHook';
import { LoginModal } from '@/app/components/Auth/LoginModal';
// export const dynamic = 'force-dynamic'; // 禁用静态缓存，强制实时渲染
 
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Next Blog",
    description: "A modern blog management system built with Next.js",
    // other: {
    //   "API_BASE_URL": process.env.API_BASE_URL || "http://localhost:3000",
    // }
  }
}

export default function RootLayout({children}: {children: React.ReactNode;}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="bg-gray-50 dark:bg-black text-black dark:text-white">
        <Script src="/runtime-env.js" strategy="beforeInteractive" />
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
