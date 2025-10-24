import type { Metadata } from "next";
import { SidePanel } from "@/app/components/layout/SidePanel";
import "./globals.css";

export const metadata: Metadata = {
  title: "Next Blog",
  description: "A modern blog management system built with Next.js",
};

import { ToastProvider } from '@/app/components/layout/ToastHook';
import { GlobalLoginModal } from '@/app/components/Auth/GlobalLoginModal';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body 
        className="bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-white"
        data-icp-info={process.env.ICP_INFO}
      >
        <ToastProvider>
          {/* <Navigation /> */}
          <div className="flex flex-row">
            <SidePanel />
            <main className="flex-1">
              <div className="auto-container">
                {children}
              </div>
            </main>
          </div>
          <GlobalLoginModal />
        </ToastProvider>
      </body>
    </html>
  );
}
