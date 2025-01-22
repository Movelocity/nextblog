import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import SearchModal from "./components/SearchModal";
import ThemeBtn from "./components/ThemeBtn";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blog Management System",
  description: "A modern blog management system built with Next.js",
};

function Navigation() {
  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link 
              href="/" 
              className="flex items-center px-2 text-gray-900 dark:text-white font-semibold"
            >
              Blog Manager
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/posts"
                className="inline-flex items-center px-1 pt-1 text-gray-500 hover:text-gray-900 dark:hover:text-white"
              >
                Posts
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center px-1 pt-1 text-gray-500 hover:text-gray-900 dark:hover:text-white"
              >
                Dashboard
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <SearchModal />
            <ThemeBtn />
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={geist.className}>
      <body className="min-h-screen bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-white">
        <Navigation />
        <main className="py-6 mt-12">
          {children}
        </main>
      </body>
    </html>
  );
}
