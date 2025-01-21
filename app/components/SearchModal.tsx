'use client';

import { useState } from 'react';
import { Post, SearchParams } from '@/app/common/types';
import { getPosts } from '@/app/services/posts';
import Modal from './Modal';
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

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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

      <Modal isOpen={isOpen} onClose={handleClose} title="Search Posts" size="full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          <div className="lg:border-r lg:pr-8">
            <SearchPosts onSearch={handleSearch} />
          </div>

          <div className="lg:pl-8">
            {loading ? (
              <div className="flex items-center justify-center h-full">
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
                  <p className="text-gray-500">Searching posts...</p>
                </div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Results ({searchResults.length})
                  </h3>
                </div>
                <div className="divide-y divide-gray-200 -mx-4 sm:mx-0">
                  {searchResults.map((post) => (
                    <Link
                      key={post.id}
                      href={`/posts/${post.id}`}
                      className="block px-4 py-6 hover:bg-gray-50 transition-colors sm:rounded-lg"
                      onClick={handleClose}
                    >
                      <div className="flex flex-col">
                        <h4 className="text-lg font-medium text-gray-900">
                          {post.title}
                        </h4>
                        <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                          {getExcerpt(post.content)}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {post.categories?.map((category) => (
                            <span
                              key={category}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
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
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <svg
                    className="h-12 w-12 text-gray-400 mx-auto mb-4"
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
                  <p className="text-gray-500">No results found</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
} 