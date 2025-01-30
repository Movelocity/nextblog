'use client';

import { useState, useEffect } from 'react';
import { Post, SearchParams } from '@/app/common/types';
import { getPosts } from '@/app/services/posts';
import Modal from '@/app/components/Modal';
import SearchPosts from './SearchPosts';
import Link from 'next/link';

export default function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (params: SearchParams) => {
    try {
      setLoading(true);
      const response = await getPosts(params);
      setSearchResults(response.posts);
    } catch (error) {
      console.error('Error searching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchResults([]);
  };

  const getExcerpt = (content: string) => {
    return content.slice(0, 150) + (content.length > 150 ? '...' : '');
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
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </button>

      <Modal isOpen={isOpen} onClose={handleClose}>
        <div className="relative flex flex-col w-full max-w-2xl mx-auto bg-white dark:bg-gray-800/95 rounded-lg shadow-2xl">
          <SearchPosts onSearch={handleSearch} />

          <div className="flex-1 overflow-y-auto max-h-[60vh]">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <svg
                    className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400">Searching posts...</p>
                </div>
              </div>
            ) : searchResults.length > 0 ? (
              <div>
                <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700/50">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Results ({searchResults.length})
                  </h3>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {searchResults.map((post) => (
                    <Link
                      key={post.id}
                      href={`/posts/${post.id}`}
                      className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      onClick={handleClose}
                    >
                      <div className="flex flex-col">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {post.title}
                        </h4>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                          {getExcerpt(post.content)}
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
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <svg
                    className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 21a9 9 0 110-18 9 9 0 010 18z"
                    />
                  </svg>
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