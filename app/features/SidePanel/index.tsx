'use client';

import { useEffect, useState } from 'react';
import classnames from 'classnames';
import { RiMenuFill } from 'react-icons/ri';
import Link from 'next/link';
import { useSidePanel } from './context';
import { getTaxonomy } from '@/app/services/posts';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export function SidePanel() {
  const { isSidePanelOpen } = useSidePanel();
  return (
    <div 
      className={classnames(
        "side-panel h-full bg-white dark:bg-zinc-900",
        "transition-all duration-300 ease-in-out transform",
        isSidePanelOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <ToggleBar/>
      <Categories />
    </div>
  )
}

export const ToggleBtn = ({className}: {className?: string}) => {
  const { toggleSidePanel } = useSidePanel();
  return (
    <div className={classnames("cursor-pointer select-none", className)} onClick={toggleSidePanel}>
      <RiMenuFill className="text-2xl" />
    </div>
  );
}


export const ToggleBar = () => {
  const { isSidePanelOpen, toggleSidePanel } = useSidePanel();
  return (
    <div 
      className={classnames(
        "side-panel-toggle-bar px-1 bg-transparent hover:bg-gray-100 dark:hover:bg-zinc-800",
        isSidePanelOpen ? "flex justify-center items-center" : "hidden",
      )}
      onClick={toggleSidePanel}
      aria-hidden="true"
    >
      {isSidePanelOpen ? <FaChevronLeft/> : <FaChevronRight/>}
    </div>
  )
}
  
const Categories = () => {
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
    <div className="side-panel-content p-4 flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Categories</h2>
      {topLevelCategories.map((category) => (
        <Link
          key={category}
          href={`/posts/category/${category}`}
          className="py-2 px-6 bg-white dark:bg-gray-800 shadow rounded-lg hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-shadow"
        >
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">{category}</h3>
        </Link>
      ))}
    </div>
  );
}; 