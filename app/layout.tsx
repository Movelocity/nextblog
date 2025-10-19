import type { Metadata } from "next";
// import { Navigation } from "@/app/components/layout/Navbar";
import { SidePanel } from "@/app/components/SidePanel";
import "./globals.css";

export const metadata: Metadata = {
  title: "Next Blog",
  description: "A modern blog management system built with Next.js",
};

import { ToastProvider } from '@/app/components/Toast/context';
import { SidePanelProvider } from '@/app/components/SidePanel/context';
import { GlobalLoginModal } from '@/app/components/Auth/GlobalLoginModal';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ToastProvider>
      <SidePanelProvider>
        {children}
      </SidePanelProvider>
    </ToastProvider>
  );
} 

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
        <Providers>
          {/* <Navigation /> */}
          <main className="flex flex-row">
            <SidePanel />
            <div className="flex-1">
              {children}
            </div>
          </main>
          <GlobalLoginModal />
        </Providers>
      </body>
    </html>
  );
}
