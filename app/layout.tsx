import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Navigation } from "./components/Navbar";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
});

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
