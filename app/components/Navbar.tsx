'use client';

import Link from "next/link";
import SearchModal from "./SearchModal";
import ThemeBtn from "./ThemeBtn";
import { useState, useEffect } from 'react';
import { isAuthenticated as checkAuth, removeAuthToken } from '@/app/services/auth';
import { useRouter } from 'next/navigation';
import { RiLogoutBoxLine } from 'react-icons/ri';
import { ToggleBtn } from "@/app/features/SidePanel";

export const Navigation = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuthStatus = async () => {
      const authStatus = await checkAuth();
      setIsAuthenticated(authStatus);
    };
    checkAuthStatus();
  }, []);

  const handleLogout = () => {
    removeAuthToken();
    setIsAuthenticated(false);
    router.push('/dashboard');
  };

  return (
    <nav 
      className="bg-white/50 dark:bg-zinc-800/60 shadow-md fixed top-0 left-0 right-0 z-50"
      style={{ height: "var(--navbar-height)" }}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12 py-2 gap-2">
          <ToggleBtn />
          <Link 
            href="/" 
            className="ml-2 px-2 text-gray-900 dark:text-white font-semibold"
          >
            Blog
          </Link>
          <div className="flex flex-1 justify-end">
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/posts"
                className="text-gray-500 hover:text-gray-900 dark:hover:text-white"
              >
                Posts
              </Link>
              <Link
                href="/dashboard"
                className="text-gray-500 hover:text-gray-900 dark:hover:text-white"
              >
                Dashboard
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <SearchModal />
            <ThemeBtn />
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 transition-colors"
                aria-label="Logout"
              >
                <RiLogoutBoxLine className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}