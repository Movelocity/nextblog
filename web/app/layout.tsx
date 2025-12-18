import { type Metadata } from "next";
import { SidePanel } from "@/app/components/layout/SidePanel";
import "./globals.css";
import { ToastProvider } from '@/app/components/layout/ToastHook';
import { LoginModal } from '@/app/components/Auth/LoginModal';

export const metadata: Metadata = {
  title: "Next Blog",
  description: "A modern blog management system built with Next.js",
};

export default function RootLayout({children}: {children: React.ReactNode;}) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-50 dark:bg-black text-black dark:text-white">
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
