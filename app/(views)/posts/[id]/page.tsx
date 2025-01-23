'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Post } from '@/app/common/types';
import { getPost } from '@/app/services/posts';
import { isAuthenticated } from '@/app/services/auth';
import Link from 'next/link';
import classNames from 'classnames';
import { Markdown } from '@/app/components/Markdown';
import { TableOfContents } from '@/app/components/TableOfContents';
import { FaTags, FaEdit } from 'react-icons/fa';
import PublishHint from '@/app/components/PubilshHint';
export default function PostPage() {
  const params = useParams();
  // const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [editable, setEditable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    const authenticated = isAuthenticated();
    setEditable(authenticated);
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await getPost(params.id as string);
        setPost(data);
        // Calculate word count
        setWordCount(data.content.trim().split(/\s+/).length);
      } catch (error) {
        setError('Failed to load post');
        console.error('Error fetching post:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center p-4">
        Post not found
      </div>
    );
  }

  return (
    <div className="h-full"
      style={{
        paddingInlineStart: "var(--content-inline-start)",
        paddingInlineEnd: "var(--content-inline-end)"
      }}
    >
      <div className="flex flex-col h-full">
        {/* Title and Controls */}
        <div className="flex flex-col pb-4 max-w-[780px] w-full">
          <div className="pt-4">
            <h1 className="block w-full px-0 text-4xl font-bold bg-transparent border-0 outline-none focus:ring-0 dark:text-white">
              {post.title}
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4">
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center px-2.5 ml-1">
                {wordCount} words
              </span>
              <time dateTime={post.updatedAt} className="flex items-center">
                Updated {new Date(post.updatedAt).toLocaleDateString()}
              </time>
            </div>

            <div className="flex items-center space-x-3 gap-4">
              {post.categories && post.categories.length > 0 && (
                <div className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-md flex items-center gap-2">
                  <FaTags className="w-4 h-4" />
                  <div className="flex gap-2">
                    {post.categories.map((category) => (
                      <Link
                        key={category}
                        href={`/posts/category/${category}`}
                        className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {category}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <PublishHint published={post.published} />

              {editable && (
                <Link
                  href={`/posts/${post.id}/edit`}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors flex items-center gap-2"
                >
                  <FaEdit className="w-4 h-4" />
                  <span>Edit</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="sticky top-24 mx-auto w-full z-50">
          <TableOfContents 
            content={post.content} 
            className="absolute min-w-[10rem] max-w-[15rem]"
            style={{ insetInlineStart: '800px' }}
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 max-w-[780px] w-full mt-4">
          <div className="prose max-w-none">
            <Markdown content={post.content} />
          </div>
        </div>

        {/* Post Footer */}
        <footer className="mt-8 pt-4 border-t text-sm text-gray-500 max-w-[780px]">
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
        </footer>
      </div>
    </div>
  );
} 