'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Post } from '@/app/common/types';
import { getPost } from '@/app/services/posts';
import { isAuthenticated } from '@/app/services/auth';
import Link from 'next/link';
import classNames from 'classnames';
import { Markdown } from '@/app/components/Markdown';

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
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
    <div className="max-w-4xl mx-auto p-4">
      {/* Breadcrumb Navigation */}
      <nav className="flex mb-6 text-sm text-gray-600" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/posts" className="hover:text-gray-900">
              Posts
            </Link>
          </li>
          {post.categories?.map((category, index) => (
            <li key={category} className="flex items-center">
              <svg className="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <Link 
                href={`/posts/category/${category}`}
                className={classNames(
                  "hover:text-gray-900",
                  { "text-gray-900 font-medium": index === post.categories.length - 1 }
                )}
              >
                {category}
              </Link>
            </li>
          ))}
        </ol>
      </nav>

      {/* Post Header */}
      <header className="mb-8">
        <div className="flex justify-between items-start">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
          {editable && (
            <Link
              href={`/posts/${post.id}/edit`}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Edit Post
            </Link>
          )}
        </div>
        
        {/* Post Metadata */}
        <div className="flex items-center space-x-6 text-sm text-gray-600">
          <time dateTime={new Date(post.updatedAt).toISOString()} className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Updated {new Date(post.updatedAt).toLocaleDateString()}
          </time>
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
            {wordCount} words
          </span>
          {post.tags && post.tags.length > 0 && (
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <div className="flex space-x-2">
                {post.tags.slice(0, 3).map((tag: string) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {post.tags.length > 3 && (
                  <span className="text-xs text-gray-500">+{post.tags.length - 3}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Post Content */}
      <div className="max-w-none mb-8">
        <Markdown content={post.content} />
      </div>

      {/* Post Footer */}
      <footer className="mt-8 pt-4 border-t text-sm text-gray-500">
        <p>Status: {post.published ? 'Published' : 'Draft'}</p>
        <p>Created: {new Date(post.createdAt).toLocaleString()}</p>
      </footer>
    </div>
  );
} 