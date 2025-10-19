'use client';

import { useEffect, useState } from 'react';
import cn from 'classnames';
import { RiAddFill, RiMenuFill, RiMoonFill, RiSunFill } from 'react-icons/ri';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSidePanel } from './context';
import { getTaxonomy } from '@/app/services/posts';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { RiBook2Fill, RiHomeFill, RiDashboardFill, RiToolsFill, RiBook3Fill } from 'react-icons/ri';
import { useIsMobile } from '@/app/hooks/useIsMobile';

type Theme = "light" | "dark";

export function SidePanel() {
  // const { isAuthenticated, setIsAuthenticated, checkAuthStatus } = useAuth();
  const isMobile = useIsMobile();
  const [topLevelCategories, setTopLevelCategories] = useState<string[]>([]);
  const { isSidePanelOpen, toggleSidePanel, closeSidePanel } = useSidePanel();
  useEffect(() => {
    if(isMobile) {
      closeSidePanel();
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
  
  return (
    <>
      <div className={cn(
        "h-screen z-10 transition-all duration-300", 
        isSidePanelOpen && "w-48",
        isMobile && isSidePanelOpen && "fixed"
      )}>
        <div 
          className={cn(
            "fixed flex flex-col w-48 text-gray-500 dark:text-gray-300 bg-white dark:bg-zinc-900 px-4 h-screen pb-16",
            !isSidePanelOpen && "hidden",
          )}
          style={{ filter: isMobile && isSidePanelOpen ? "drop-shadow(0 0 20px #0009)" : ""}}
        >
          <div className="flex items-center justify-start">
            <div 
              className="cursor-pointer select-none my-2"
              onClick={toggleSidePanel}
            >
              <RiMenuFill className="text-2xl" />
            </div>
          </div>
          
          <StyledLink icon={<RiHomeFill className="w-4 h-4" />} name="Home" tgUrl="/posts" />
          <StyledLink icon={<RiBook3Fill className="w-4 h-4" />} name="Notes" tgUrl="/notes"/>
          <StyledLink icon={<RiToolsFill className="w-4 h-4" />} name="Tools" tgUrl="/tools"/>
          <StyledLink icon={<RiBook2Fill className="w-4 h-4" />} name="Categories" tgUrl="/categories">
            {topLevelCategories.sort().map((category) => (
              <Link
                key={category}
                href={`/categories/${category}`}
                className="py-1 px-4 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md"
              >
                {category}
              </Link>
            ))}
          </StyledLink>
          
          <StyledLink icon={<RiDashboardFill className="w-4 h-4" />} name="Dashboard" tgUrl="/dashboard"/>
          
          <StyledLink icon={<RiAddFill className="w-4 h-4" />} name="New Post" tgUrl="/posts/new"/>
          <div className="flex-1"></div>

          <StyledButton 
            icon={theme === "light" ? <RiMoonFill className="w-4 h-4" /> : <RiSunFill className="w-4 h-4" />} 
            name={theme === "light" ? "Dark Mode" : "Light Mode"} 
            onClick={handleToggle}
          />

        </div>

      </div>
      {/** toggle bar */}
      <div 
        className={cn(
          "h-screen cursor-pointer flex justify-center items-center px-1",
          "bg-transparent text-transparent text-gray-400/50 hover:text-gray-400 text-sm",
          {
            "hover:bg-gray-100/80 dark:hover:bg-zinc-800/80": !(isMobile && isSidePanelOpen),
            "hidden": isMobile && isSidePanelOpen
          }
        )}
        style={{
          width: isMobile && isSidePanelOpen ? "calc(100vw - 12rem)" : ""
        }}
        onClick={toggleSidePanel}
        aria-hidden="true"
      >
        {isSidePanelOpen ? <FaChevronLeft/> : <FaChevronRight/>}
      </div>
    </>
  )
}

interface StyledLinkProps {
  icon: React.ReactNode;
  name: string;
  tgUrl: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

const StyledLink = ({icon, name, tgUrl, children}: StyledLinkProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const handleClick = () => {
    setIsOpen(!isOpen);
    if(tgUrl) {
      router.push(tgUrl);
    }
    if(children) {
      setIsOpen(true);
    }
  }

  if(children) { // optional children, if children is provided, then we need to render a dropdown
    return (
      <div className="flex flex-col cursor-pointer">
        <Link 
          href={tgUrl} 
          className={cn(
            "flex items-center gap-1 px-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md py-1",
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
      className="flex items-center gap-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md py-1 px-2 cursor-pointer"
    >
      {icon} {name}
    </Link>
  )
}


const StyledButton = ({icon, name, onClick}: {icon: React.ReactNode; name: string; onClick: () => void}) => {
  return (
    <button className="flex items-center gap-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md py-1 px-2 cursor-pointer" onClick={onClick}>
      {icon} {name}
    </button>
  )
}