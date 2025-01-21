'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Post } from '@/app/common/types';
import { getPost } from '@/app/services/posts';
import { isAuthenticated } from '@/app/services/auth';
import Link from 'next/link';

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [editable, setEditable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authenticated = isAuthenticated();
    setEditable(authenticated);
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await getPost(params.id as string);
        setPost(data);
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{post.title}</h1>
        {editable && (
          <Link
            href={`/posts/${post.id}/edit`}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Edit Post
          </Link>
        )}
      </div>

      <div className="prose max-w-none mb-8">
        <p className="whitespace-pre-wrap">{post.content}</p>
      </div>

      {(post.categories?.length > 0 || post.tags?.length > 0) && (
        <div className="border-t pt-4 mt-8">
          {post.categories?.length > 0 && (
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-2">Categories</h2>
              <div className="flex flex-wrap gap-2">
                {post.categories.map(category => (
                  <Link
                    key={category}
                    href={`/posts/category/${category}`}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200"
                  >
                    {category}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {post.tags?.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 text-sm text-gray-500 border-t pt-4">
        <p>Created: {new Date(post.createdAt).toLocaleString()}</p>
        <p>Last updated: {new Date(post.updatedAt).toLocaleString()}</p>
        <p>Status: {post.published ? 'Published' : 'Draft'}</p>
      </div>
    </div>
  );
} 