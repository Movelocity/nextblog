import type { Metadata } from "next";
import { Navigation } from "./components/Navbar";
import { ToastProvider } from "./components/Toast";
import "./globals.css";


export const metadata: Metadata = {
  title: "Blog Management System",
  description: "A modern blog management system built with Next.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-white">
        <ToastProvider>
          <Navigation />
          <main className="py-6 mt-12">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
