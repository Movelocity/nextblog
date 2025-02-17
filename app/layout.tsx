import type { Metadata } from "next";
import { Navigation } from "./components/Navbar";
import { SidePanel } from "@/app/components/SidePanel";
import "./globals.css";

export const metadata: Metadata = {
  title: "Next Blog",
  description: "A modern blog management system built with Next.js",
};

import { ToastProvider } from '@/app/components/Toast/context';
import { SidePanelProvider } from '@/app/components/SidePanel/context';
import Link from "next/link";

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
    <html lang="en">
      <body className="min-h-screen bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-white">
        <Providers>
          <SidePanel />
          <Navigation />
          <main className="py-6 mt-12">
            {children}
          </main>
        </Providers>

        <div 
          className="py-2 w-full text-center text-gray-700 dark:text-gray-200" 
        >
          <Link href="https://beian.miit.gov.cn/" target="_blank" className="cursor-pointer hover:underline">
            {process.env.ICP_INFO}
          </Link>
        </div>
      </body>
    </html>
  );
}
