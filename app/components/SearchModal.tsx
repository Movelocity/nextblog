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

      <Modal isOpen={isOpen} onClose={handleClose} title="Search Posts">
        <div className="space-y-6">
          <SearchPosts onSearch={handleSearch} />

          <div className="mt-6">
            {loading ? (
              <div className="text-center py-4">Searching...</div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Results</h3>
                <div className="divide-y divide-gray-200">
                  {searchResults.map((post) => (
                    <Link
                      key={post.id}
                      href={`/posts/${post.id}`}
                      className="block py-4 hover:bg-gray-50 transition-colors"
                      onClick={handleClose}
                    >
                      <div className="flex flex-col">
                        <h4 className="text-base font-medium text-gray-900">
                          {post.title}
                        </h4>
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                          {getExcerpt(post.content)}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {post.categories?.map((category) => (
                            <span
                              key={category}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
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
              <div className="text-center py-4 text-gray-500">
                No results found
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
} 