'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getPost, updatePost } from '@/app/services/posts';
import { isAuthenticated } from '@/app/services/auth';
import { PostForm, PostFormData } from '@/app/components/PostForm';

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<PostFormData | undefined>();

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = isAuthenticated();
      if (!authenticated) {
        router.push('/posts/' + params.id);
        return;
      }
      await fetchPost();
    };

    checkAuth();
  }, [params.id]);

  const fetchPost = async () => {
    try {
      const post = await getPost(params.id as string);
      setInitialData({
        title: post.title,
        content: post.content,
        published: post.published,
        categories: post.categories || [],
        tags: post.tags || [],
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching post:', error);
      setError('Failed to load post');
      setLoading(false);
    }
  };

  const handleSubmit = async (data: PostFormData) => {
    await updatePost(params.id as string, {
      ...data,
      slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    });
    router.push('/posts/' + params.id);
  };

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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Edit Post</h1>
      <PostForm
        initialData={initialData}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
        onCancel={() => router.back()}
      />
    </div>
  );
} 