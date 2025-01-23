'use client';
import classnames from 'classnames';
import { useState, useEffect, useRef } from 'react';
import { getTaxonomy } from '../services/posts';
import { RiMenuFill } from 'react-icons/ri'
import Link from 'next/link';

export default function SidePanel() {
  const [topLevelCategories, setTopLevelCategories] = useState<string[]>([]);
  const [show, setShow] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch initial posts and taxonomy
    const init = async () => {
      try {
        const { categories } = await getTaxonomy();
        // Get unique top-level categories
        const topLevel = new Set<string>();
        categories.forEach(cat => {
          const topLevelCat = cat.split('/')[0];
          topLevel.add(topLevelCat);
        });
        setTopLevelCategories(Array.from(topLevel));
      } catch (error) {
        console.error('Error fetching taxonomy:', error);
      }
    };
    init();

    const handleClick = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setShow(false);
      }
    }
    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    }
  }, []);
  return (
    <div className="flex items-center">
      <div className="cursor-pointer select-none" ref={triggerRef} onClick={() => setShow(!show)}>
        <RiMenuFill className="text-2xl" />
      </div>

      {/* Backdrop overlay */}
      <div 
        className={classnames(
          "fixed inset-0 bg-black/30 transition-opacity duration-300 md:hidden",
          show ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setShow(false)}
        aria-hidden="true"
      />

      <div 
        className={classnames(
          "fixed top-0 left-0 p-4 h-full w-64 bg-white dark:bg-gray-900 shadow-lg",
          "transition-all duration-300 ease-in-out transform",
          show ? "translate-x-0" : "-translate-x-full",
          // "md:transition-none md:transform-none"
        )}
        style={{ zIndex: 10 }}
      >
        {topLevelCategories.length > 0 && (
          <div className="pt-16">
            <h2 className="text-xl font-semibold mb-4">Categories</h2>
            <div className="flex flex-col gap-4">
              {topLevelCategories.map(category => (
                <Link
                  key={category}
                  href={`/posts/category/${category}`}
                  className="py-2 px-6 bg-white dark:bg-gray-900 shadow rounded-lg hover:shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-shadow"
                >
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">{category}</h3>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 