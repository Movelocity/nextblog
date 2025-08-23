'use client';

import Link from "next/link";
import SearchModal from "@/app/components/Searching/SearchModal";
import ThemeBtn from "@/app/components/part/ThemeBtn";
import { useEffect, useState } from 'react';
import { removeAuthToken } from '@/app/services/auth';
import { useRouter } from 'next/navigation';
import { RiLogoutBoxLine } from 'react-icons/ri';
import { ToggleBtn } from "@/app/components/SidePanel";
import { useScrollDirection } from '@/app/hooks/useScrollDirection';
import { useIsMobile } from '@/app/hooks/useIsMobile';
// import { useSidePanel } from '@/app/components/SidePanel/context';
import { useAuth } from '@/app/hooks/useAuth';
import cn from 'classnames'

export const Navigation = () => {
  const { isAuthenticated, setIsAuthenticated, checkAuthStatus } = useAuth();
  const router = useRouter();
  const { visible } = useScrollDirection();
  const isMobile = useIsMobile();
  // const { isSidePanelOpen } = useSidePanel();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    checkAuthStatus();
  }, [checkAuthStatus]);

  const handleLogout = () => {
    removeAuthToken();
    setIsAuthenticated(false);
    router.push('/dashboard');
  };

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-40 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-gray-700 transition-transform duration-300", 
      {
        'translate-y-0': visible,
        '-translate-y-full': !visible
      }
    )}>
      <div className="container px-4">
        <div className="flex justify-between items-center w-[95vw] h-12">
          <div className="flex items-center space-x-4">
            {hasMounted && !isMobile && <ToggleBtn />}
            <Link href="/" className="text-lg font-bold">
              Next Blog
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <SearchModal />
            <ThemeBtn />
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                aria-label="Logout"
              >
                <RiLogoutBoxLine size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};