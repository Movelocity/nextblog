'use client';

import Link from 'next/link';
import { Markdown } from '@/app/components/Editor/Markdown';
import { TableOfContents } from '@/app/components/Posts/TableOfContents';
import { FaTags } from 'react-icons/fa';
import { RiEdit2Line } from 'react-icons/ri';
import PublishHint from '@/app/components/part/PubilshHint';
import { Blog } from '@/app/common/types';
import CategoryTag from '@/app/components/CategoryTag';
import { useAuth } from '@/app/hooks/useAuth';
import { AssetModal } from '@/app/components/Asset/AssetModal';

type PostViewerProps = {
  post: Blog;
}

export const PostViewer = ({ post }: PostViewerProps) => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="post-content h-full">
      <div className="flex flex-col h-full min-h-[calc(100vh-6rem)]">
        {/* Title and Controls */}
        <div className="flex flex-col pb-4 max-w-[780px] w-full">

          <h1 className="block w-full px-0 text-4xl font-bold bg-transparent border-0 outline-none focus:ring-0 dark:text-white">
            {post.title}
          </h1>

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
        <footer className="flex flex-col md:flex-row gap-4 max-w-[780px] w-full mt-2 pt-2 border-t dark:border-gray-700 text-gray-700 dark:text-gray-400">
          {post.tags && post.tags.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <FaTags className="w-4 h-4" />
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-gray-100 dark:text-white rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p>Created: {new Date(post.createdAt).toLocaleString()}</p>

          <p>Updated: {new Date(post.updatedAt).toLocaleString()}</p>

          <p>
            <Link href="https://beian.miit.gov.cn/" target="_blank" className="cursor-pointer hover:underline">
              {process.env.NEXT_PUBLIC_ICP_INFO}
            </Link>
          </p>

          <PublishHint published={post.published} />
        </footer>

        {/* Floating Buttons */}
        <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-50">
          {/* Asset Button */}
          {isAuthenticated && (
            <div className="flex items-center justify-center">
              <AssetModal blogId={post.id} />
            </div>
          )}

          {/* Edit Button */}
          {isAuthenticated && (
            <Link
              href={`/posts/${post.id}/edit`}
              className="flex items-center justify-center p-2 lg:p-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg transition-all duration-200 hover:scale-105"
              aria-label="Edit post"
              title="Edit post"
            >
              <RiEdit2Line size={20} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};