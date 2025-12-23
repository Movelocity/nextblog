'use client';

import { useEffect, useState, useCallback } from 'react';
import cn from 'classnames';
import { RiAddFill, RiUserFill, RiLogoutBoxLine, RiMoonFill, RiSunFill, RiFileTextLine } from 'react-icons/ri';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { getTaxonomy } from '@/app/services/posts';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { RiBook2Fill, RiHomeFill, RiDashboardFill, RiToolsFill, RiBook3Fill, RiServerFill } from 'react-icons/ri';
import { useIsMobile } from '@/app/hooks/useIsMobile';
import SearchModal from "@/app/components/Searching/SearchModal";
import { removeAuthToken } from '@/app/services/auth';
import { useAuth } from '@/app/hooks/useAuth';
import { type Theme } from '@/app/utils/globals';

export function SidePanel() {
  const { isAuthenticated, setIsAuthenticated, checkAuthStatus, openLoginModal } = useAuth(); 

  const [sidePanelOpen, setSidePanelOpen] = useState(false);

  const toggleSidePanel = useCallback(() => {
    console.log('toggleSidePanel');
    setSidePanelOpen(prev => !prev);
  }, []);

  const isMobile = useIsMobile();
  const pathname = usePathname();
  const [topLevelCategories, setTopLevelCategories] = useState<string[]>([]);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if(sidePanelOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
  }, [sidePanelOpen])

  useEffect(() => {
    if(isMobile) {
      setSidePanelOpen(false);
    } else {
      setSidePanelOpen(true);
    }
  }, [isMobile])

  useEffect(() => {
    const init = async () => {
      try {
        const { categories } = await getTaxonomy();
        const topLevel = new Set<string>();
        categories.forEach((cat: string) => {
          const topLevelCat = cat.split('/')[0];
          topLevel.add(topLevelCat);
        });
        setTopLevelCategories(Array.from(topLevel));
      } catch (error) {
        console.error('Error fetching taxonomy:', error);
      }
    };
    init();
  }, []);

  const [theme, setTheme] = useState<Theme>("light");

  const updateTheme = (newTheme: "light" | "dark") => {
    if(newTheme === "light") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setTheme(newTheme);
  }

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as Theme || "light";
    updateTheme(storedTheme);
  }, []);

  const handleToggle = () => {
    console.log('handleToggle', theme);
    updateTheme(theme === "light" ? "dark" : "light");
  };

  const openAtMobile = isMobile && sidePanelOpen;
  return (
    <div className={
      cn(
        isMobile 
        ? (sidePanelOpen ? "fixed w-full z-50" : "") 
        : (sidePanelOpen ? "relative w-48" : "")
      )
    }>
      <div className={cn(
        "fixed top-0 left-0 h-screen transition-all duration-300 flex z-[1000]", 
        openAtMobile && "w-full"
      )}>
        {sidePanelOpen && (
          <div 
            className={cn(
              "flex flex-col flex-1 py-8 text-gray-500 dark:text-gray-300 px-4 h-screen pb-16 gap-1",
              openAtMobile && "drop-shadow-lg"
            )}
          >
            <StyledLink icon={<RiHomeFill className="w-4 h-4" />} name="Home" tgUrl="/posts" currentPath={pathname} />
            <StyledLink icon={<RiBook3Fill className="w-4 h-4" />} name="Notes" tgUrl="/notes" currentPath={pathname}/>
            <StyledLink icon={<RiToolsFill className="w-4 h-4" />} name="Tools" tgUrl="/tools" currentPath={pathname}/>
            <StyledLink icon={<RiBook2Fill className="w-4 h-4" />} name="Categories" tgUrl="/categories" currentPath={pathname}>
              {topLevelCategories.sort().map((category) => (
                <Link
                  key={category}
                  href={`/categories/${category}`}
                  className={cn(
                    "mt-1 py-1 px-4 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md",
                    pathname?.startsWith(`/categories/${category}`) && "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium"
                  )}
                >
                  {category}
                </Link>
              ))}
            </StyledLink>
            <StyledLink icon={<RiFileTextLine className="w-4 h-4" />} name="PostsView" tgUrl="/posts-view" currentPath={pathname}></StyledLink>
            
            <StyledLink icon={<RiDashboardFill className="w-4 h-4" />} name="Dashboard" tgUrl="/dashboard" currentPath={pathname}/>
            {isAuthenticated && (<StyledLink icon={<RiServerFill className="w-4 h-4" />} name="System" tgUrl="/system" currentPath={pathname}/>)}
            
            <StyledLink icon={<RiAddFill className="w-4 h-4" />} name="New Post" tgUrl="/posts/new" currentPath={pathname}/>
            <div className="flex-1"></div>

            <div className="grid grid-cols-3 gap-1">
              <div 
                title={isAuthenticated ? "Logout" : "Login"}
                className="flex gap-1 h-10 items-center justify-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md py-1 px-2" 
                onClick={() => {
                  if(isAuthenticated) {
                    removeAuthToken();
                    setIsAuthenticated(false);
                  } else {
                    openLoginModal();
                  }
                }}
              >
                {isAuthenticated ? <RiLogoutBoxLine className="w-4 h-4" /> : <RiUserFill className="w-4 h-4" />}
              </div>

              <div className="flex gap-1 h-10 items-center justify-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md py-1 px-2" onClick={handleToggle}>
                {theme === "light" ? <RiMoonFill className="w-4 h-4" /> : <RiSunFill className="w-4 h-4" />}
              </div>

              <SearchModal />
            </div>
          </div>
        )}

        <div 
          className={cn(
            "h-full cursor-pointer flex justify-center items-center px-1 bg-transparent text-sm text-gray-400",
            openAtMobile ? "w-1/2 text-transparent hover:bg-transparent dark:hover:bg-transparent" : "hover:bg-gray-100/80 dark:hover:bg-zinc-800/80"
          )}
          onClick={toggleSidePanel}
          aria-hidden="true"
        >
          {sidePanelOpen ? <FaChevronLeft/> : <FaChevronRight/>}
        </div>
      </div>      
    </div>
  )
}

interface StyledLinkProps {
  icon: React.ReactNode;
  name: string;
  tgUrl: string;
  currentPath?: string | null;
  children?: React.ReactNode;
  onClick?: () => void;
}

const StyledLink = ({icon, name, tgUrl, currentPath, children}: StyledLinkProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  
  // Determine if this link is active
  const isActive = currentPath === tgUrl || currentPath?.startsWith(tgUrl + '/');
  
  const handleClick = () => {
    setIsOpen(!isOpen);
    if(tgUrl) {
      router.push(tgUrl);
    }
    if(children) {
      setIsOpen(!isOpen);
    }
  }

  if(children) { // optional children, if children is provided, then we need to render a dropdown
    return (
      <div className="flex flex-col cursor-pointer">
        <Link 
          href={tgUrl} 
          className={cn(
            "flex items-center gap-1 px-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md py-1",
            isActive && "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium"
          )} 
          onClick={handleClick}
        >
          {icon} {name}
        </Link>
        {isOpen && children}
      </div>
    )
  }
  return (  // just render a link if no children
    <Link 
      href={tgUrl} 
      className={cn(
        "flex items-center gap-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md py-1 px-2 cursor-pointer",
        isActive && "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium"
      )}
    >
      {icon} {name}
    </Link>
  )
}
