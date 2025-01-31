'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Blog } from '@/app/common/types';
import { getPost } from '@/app/services/posts';
import { isAuthenticated } from '@/app/services/auth';
import { PostViewer } from '@/app/components/Editor/PostViewer';

export default function PostPage() {
  const params = useParams();
  // const router = useRouter();
  const [post, setPost] = useState<Blog | null>(null);
  const [editable, setEditable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const authStatus = await isAuthenticated();
      setEditable(authStatus);
    };
    checkAuthStatus();
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await getPost(params.id as string);
        setPost(data);
        document.title = data.title;
        // Calculate word count
        // setWordCount(data.content.trim().split(/\s+/).length);
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
    <PostViewer post={post} editable={editable} />
  );
} 