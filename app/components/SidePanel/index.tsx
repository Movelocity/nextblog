'use client';

import { useEffect, useState } from 'react';
import classnames from 'classnames';
import { RiMenuFill } from 'react-icons/ri';
import Link from 'next/link';
import { useSidePanel } from './context';
import { getTaxonomy } from '@/app/services/posts';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { RiBook2Fill, RiHomeFill, RiDashboardFill } from 'react-icons/ri';
import './index.css';

export function SidePanel() {
  return (
    <div 
      className={classnames("side-panel h-full bg-white dark:bg-zinc-900")}
    >
      <ToggleBar/>
      <SidePanelContent />
    </div>
  )
}

export const ToggleBtn = ({className}: {className?: string}) => {
  const { toggleSidePanel } = useSidePanel();
  return (
    <div className={classnames("cursor-pointer select-none side-panel-toggle-btn", className)} onClick={toggleSidePanel}>
      <RiMenuFill className="text-2xl" />
    </div>
  );
}


export const ToggleBar = () => {
  const { isSidePanelOpen, toggleSidePanel } = useSidePanel();
  return (
    <div 
      className={classnames(
        "side-panel-toggle-bar px-1 bg-transparent dark:hover:bg-zinc-800",
        "text-gray-400/50 hover:text-gray-400 text-sm",
        "justify-center items-center",
      )}
      onClick={toggleSidePanel}
      aria-hidden="true"
    >
      {isSidePanelOpen ? <FaChevronLeft/> : <FaChevronRight/>}
    </div>
  )
}

const StyledLink = ({target, children}: {target: string, children: React.ReactNode}) => {
  return (
    <Link href={target} className="flex items-center gap-1 mb-4 hover:bg-zinc-800 rounded-md py-1 px-2">
      {children}
    </Link>
  )
}

const SidePanelContent = () => {
  const [topLevelCategories, setTopLevelCategories] = useState<string[]>([]);

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
    <div className="side-panel-content p-4 flex flex-col text-gray-500 dark:text-gray-300">
      <StyledLink target="/posts">
        <RiHomeFill className="w-4 h-4" />
        Home
      </StyledLink>
      <span className="flex items-center gap-1 mb-1 px-2">
        <RiBook2Fill className="w-4 h-4" />
        Categories
      </span>
      {topLevelCategories.map((category) => (
        <Link
          key={category}
          href={`/posts/category/${category}`}
          className="py-1 px-4 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md"
        >
          {category}
        </Link>
      ))}
      <StyledLink target="/dashboard">
        <RiDashboardFill className="w-4 h-4" />
        Dashboard
      </StyledLink>
    </div>
  );
}; 