'use client';

import { useState, useEffect } from 'react';
import { BlogMeta } from '@/app/common/types';
import { RiSearchLine } from 'react-icons/ri';
import { FaRegFaceGrinBeamSweat } from "react-icons/fa6";
import Modal from '@/app/components/Modal';
import SearchPosts from './SearchPosts';
import Link from 'next/link';

const getExcerpt = (content: string) => {
  return content.slice(0, 150) + (content.length > 150 ? '...' : '');
};

const ResultItem = ({ post, onClick }: { post: BlogMeta, onClick: () => void }) => {
  return (
    <Link
      key={post.id}
      href={`/posts/${post.id}`}
      className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      onClick={onClick}
    >
      <div className="flex flex-col">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {post.title}
        </h4>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
          {getExcerpt(post.description)}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {post.categories?.map((category) => (
            <span
              key={category}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
            >
              {category}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
};

export default function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<BlogMeta[]>([]);

  const handleClose = () => {
    setIsOpen(false);
    setSearchResults([]);
  };

  useEffect(() => {
    // shortcut to toggle search modal
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
        event.preventDefault();
        setIsOpen(!isOpen);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-3 py-2 text-sm leading-4 font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 outline-none"
        aria-label="Search posts"
      >
        <RiSearchLine className="h-5 w-5" />
      </button>

      <Modal isOpen={isOpen} onClose={handleClose} size="lg">
        <div className="relative flex flex-col w-full mx-auto bg-white dark:bg-gray-800/95 rounded-lg">
          <SearchPosts onResult={setSearchResults} />
          <div className="flex-1 overflow-y-auto max-h-[60vh] min-h-[60vh]">
            {searchResults.length > 0 ? (
              <div>
                <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700/50">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Results ({searchResults.length})
                  </h3>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {searchResults.map((post) => (
                    <ResultItem key={post.id} post={post} onClick={handleClose} />
                  ))}
                </div>
              </div>
            ) : (// no result
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <FaRegFaceGrinBeamSweat className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto" />
                  <p className="text-gray-400 dark:text-gray-500">No results found</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
} 