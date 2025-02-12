'use client';

import Link from 'next/link';
import { Markdown } from '@/app/components/Editor/Markdown';
import { TableOfContents } from '@/app/components/Posts/TableOfContents';
import { FaTags, FaEdit } from 'react-icons/fa';
import PublishHint from '@/app/components/part/PubilshHint';
import { Blog } from '@/app/common/types';
import CategoryTag from '@/app/components/CategoryTag';
type PostViewerProps = {
  post: Blog;
  editable: boolean;
}

export const PostViewer = ({ post, editable }: PostViewerProps) => {
  return (
    <div className="post-content h-full">
      <div className="flex flex-col h-full">
        {/* Title and Controls */}
        <div className="flex flex-col pb-4 max-w-[780px] w-full">
          <PublishHint published={post.published} />
          <div className="pt-4">
            <h1 className="block w-full px-0 text-4xl font-bold bg-transparent border-0 outline-none focus:ring-0 dark:text-white">
              {post.title}
            </h1>
          </div>

          <div className="flex flex-row items-center justify-start mt-4 gap">
            {post.categories && post.categories.length > 0 && (
              <div className="space-x-2">
                {post.categories.map((category) => (
                  <CategoryTag
                    key={category}
                    category={category}
                    showLink={false}
                  />
                ))}
              </div>
            )}

            {editable && (
              <Link
                href={`/posts/${post.id}/edit`}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-500 transition-colors flex items-center gap-2"
              >
                <FaEdit className="w-4 h-4" /> Edit
              </Link>
            )}
          </div>
        </div>

        {/* Table of Contents */}
        <div className="sticky top-24 mx-auto w-full z-50">
          <TableOfContents 
            content={post.content} 
            className="absolute"
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 max-w-[780px] w-full mt-4 mb-64">
          <div className="prose max-w-none">
            <Markdown content={post.content} />
          </div>
        </div>

        {/* Post Footer */}
        <footer className="mt-8 pt-4 border-t text-sm text-gray-500 max-w-[780px] flex flex-row gap-2">
          {post.tags && post.tags.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <FaTags className="w-4 h-4" />
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          <p>Created: {new Date(post.createdAt).toLocaleString()}</p>

          <p className="pl-2 border-l-2 border-gray-300 dark:border-gray-700">
            Updated: {new Date(post.updatedAt).toLocaleString()} 
          </p>
        </footer>
      </div>
    </div>
  );
};