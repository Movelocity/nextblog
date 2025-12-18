'use client';

import { useParams } from 'next/navigation';
import { Blog } from '@/app/common/types';
import { getPost } from '@/app/services/posts';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Markdown } from '@/app/components/Editor/Markdown';
import { FaTags } from 'react-icons/fa';
import { RiEdit2Line } from 'react-icons/ri';
import CategoryTag from '@/app/components/CategoryTag';
import { useAuth } from '@/app/hooks/useAuth';
import { AssetModal } from '@/app/components/Asset/AssetModal';
import { TableOfContents } from '@/app/components/Posts/TableOfContents';
import cn from 'classnames';
import { getSiteConfig } from '@/app/services/system';

export default function PostPage() {
  const params = useParams();
  const [post, setPost] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPost = async () => {
      try {
        setLoading(true);
        if (!params.id || typeof params.id !== 'string') {
          setError('Invalid post ID');
          return;
        }
        const data = await getPost(params.id);
        setPost(data);
        document.title = data.title;
      } catch (error) {
        setError('Failed to load post');
        console.error('Error loading post:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPost();
  }, [params.id]);

  const { isAuthenticated } = useAuth();
  const [icpInfo, setIcpInfo] = useState<string>("");

  useEffect(() => {
    // const icpInfo = document.querySelector('body')?.getAttribute('data-icp-info');
    const fetchConfig = async () => {
      const config = await getSiteConfig();
      setIcpInfo(config.icpInfo || "");
    };
    fetchConfig();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="text-red-500 text-center p-4">
        {error || 'Post not found'}
      </div>
    );
  }

  return (
    <div>
      <div className="h-full py-8 flex flex-col flex-1">
        {/* Title and Controls */}
        <div className="flex flex-col pb-4 border-b border-gray-200 dark:border-gray-700 px-4 max-w-4xl mx-auto w-full">
          <h1 className="block w-full px-2 break-words text-4xl font-bold bg-transparent border-0 outline-none focus:ring-0 dark:text-white">
            {post.title}
          </h1>

          <div className="flex flex-row items-center justify-start mt-4 gap-2">
            {post.categories?.map((category) => (
              <CategoryTag
                key={category}
                category={category}
                showLink={false}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 mt-4 mb-64 min-h-[40vh] max-w-4xl mx-auto w-full">
          <Markdown content={post.content} />
        </div>

        {/* Post Footer */}
        <footer className={cn(
          "text-sm flex flex-row w-full pt-4 border-t justify-center flex-wrap gap-4",
          "dark:border-gray-700 text-gray-700 dark:text-gray-400",
        )}>
          {post.tags && post.tags.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <FaTags className="w-4 h-4" />
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-gray-100 dark:text-white rounded-full dark:bg-gray-800" 
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
              {icpInfo}
            </Link>
          </p>
        </footer>
      </div>

      <TableOfContents content={post.content} />
      
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
  );
} 