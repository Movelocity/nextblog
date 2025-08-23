'use client';

import { useEffect, useState } from 'react';
import cn from 'classnames';
import { RiAddFill, RiMenuFill } from 'react-icons/ri';
import Link from 'next/link';
import { useSidePanel } from './context';
import { getTaxonomy } from '@/app/services/posts';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { RiBook2Fill, RiHomeFill, RiDashboardFill } from 'react-icons/ri';
// import './index.css';
import { useIsMobile } from '@/app/hooks/useIsMobile';

export function SidePanel() {
  const isMobile = useIsMobile();
  const [topLevelCategories, setTopLevelCategories] = useState<string[]>([]);
  const { isSidePanelOpen, toggleSidePanel } = useSidePanel();

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
  
  return (
    <div className={cn(
      "h-screen z-10 transition-all duration-300", 
      isSidePanelOpen && "w-48",
      isMobile && isSidePanelOpen && "fixed"
    )}>
      <div className="fixed flex h-screen">
        <div 
          className={cn(
            "flex flex-col pt-16 w-48 text-gray-500 dark:text-gray-300 bg-white dark:bg-zinc-900 px-4",
            !isSidePanelOpen && "hidden",
          )}
          style={{
            filter: isMobile && isSidePanelOpen ? "drop-shadow(0 0 10px #000a)" : ""
          }}
        >
          <StyledLink icon={<RiHomeFill className="w-4 h-4" />} name="Home" tgUrl="/posts" />
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
        </div>

        {/** toggle bar */}
        <div 
          className={cn(
            "h-full cursor-pointer px-1",
            "bg-transparent",
            !(isMobile && isSidePanelOpen) && "hover:bg-gray-100/80 dark:hover:bg-zinc-800/80",
            "text-transparent text-gray-400/50 hover:text-gray-400 text-sm",
            "flex justify-center items-center",
          )}
          style={{
            width: isMobile && isSidePanelOpen ? "calc(100vw - 12rem)" : ""
          }}
          onClick={toggleSidePanel}
          aria-hidden="true"
        >
          {isSidePanelOpen ? <FaChevronLeft/> : <FaChevronRight/>}
        </div>
      </div>
    </div>
  )
}

export const ToggleBtn = ({className}: {className?: string}) => {
  const { toggleSidePanel } = useSidePanel();
  return (
    <div 
      className={cn("cursor-pointer select-none side-panel-toggle-btn", className)} 
      onClick={toggleSidePanel}
    >
      <RiMenuFill className="text-2xl" />
    </div>
  );
}

interface StyledLinkProps {
  icon: React.ReactNode;
  name: string;
  tgUrl: string;
  children?: React.ReactNode;
}

const StyledLink = ({icon, name, tgUrl, children}: StyledLinkProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const handleClick = () => {
    setIsOpen(!isOpen);
    if(children) {
      setIsOpen(true);
    }
  }
  if(children) { // optional children, if children is provided, then we need to render a dropdown
    return (
      <div className="flex flex-col">
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
      className="flex items-center gap-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md py-1 px-2"
    >
      {icon} {name}
    </Link>
  )
}
