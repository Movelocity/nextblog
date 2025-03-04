'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Blog } from '@/app/common/types';
import { getPost } from '@/app/services/posts';
import { PostViewer } from '@/app/components/Editor/PostViewer';

export default function PostPage() {
  const params = useParams();
  // const router = useRouter();
  const [post, setPost] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [wordCount, setWordCount] = useState(0);

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
    <PostViewer post={post} />
  );
} 