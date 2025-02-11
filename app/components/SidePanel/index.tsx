'use client';

import { useEffect, useState } from 'react';
import classnames from 'classnames';
import { RiAddFill, RiMenuFill } from 'react-icons/ri';
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
        "side-panel-toggle-bar px-1 bg-transparent",
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

interface StyledLinkProps {
  icon: React.ReactNode;
  name: string;
  tgUrl: string;
  children?: React.ReactNode;
}

const StyledLink = ({icon, name, tgUrl, children}: StyledLinkProps) => {
  const [isOpen, setIsOpen] = useState(true);
  if(children) { // optional children, if children is provided, then we need to render a dropdown
    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-1 px-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md py-1" onClick={() => setIsOpen(!isOpen)}>
          {icon} {name}
        </div>
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
      <StyledLink icon={<RiHomeFill className="w-4 h-4" />} name="Home" tgUrl="/posts" />
      <StyledLink icon={<RiBook2Fill className="w-4 h-4" />} name="Categories" tgUrl="/posts/category">
        {topLevelCategories.sort().map((category) => (
          <Link
            key={category}
            href={`/posts/category/${category}`}
            className="py-1 px-4 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md"
          >
            {category}
          </Link>
        ))}
      </StyledLink>
      <StyledLink icon={<RiDashboardFill className="w-4 h-4" />} name="Dashboard" tgUrl="/dashboard"/>
      <StyledLink icon={<RiAddFill className="w-4 h-4" />} name="New Post" tgUrl="/posts/new"/>
    </div>
  );
}; 