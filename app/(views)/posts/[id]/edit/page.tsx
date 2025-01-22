'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getPost, updatePost } from '@/app/services/posts';
import { isAuthenticated } from '@/app/services/auth';
import { PostEditor, PostEditorData } from '@/app/components/PostEditor';
import { MdArrowBack } from 'react-icons/md';

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<PostEditorData | undefined>();
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = isAuthenticated();
      if (!authenticated) {
        console.log("not authenticated");
        // router.push('/posts/' + params.id);
        return;
      }
      await fetchPost();
    };

    checkAuth();
  }, [params.id]);

  // Handle unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

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

      const handleSubmit = async (data: PostEditorData) => {
    try {
      console.log("submitting", data);
      await updatePost(params.id as string, {
        ...data,
        slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      });
      setIsDirty(false);
      // router.push('/posts/' + params.id);
    } catch (error) {
      console.error('Error updating post:', error);
      setError('Failed to update post. Please try again.');
    }
  };

  const handleFormChange = () => {
    setIsDirty(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500"></div>
          <p className="text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
              <button
                // onClick={() => router.back()}
                className="mt-4 inline-flex items-center text-sm font-medium text-red-600 hover:text-red-500"
              >
                <MdArrowBack className="mr-1" /> Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PostEditor
      initialData={initialData}
      onSubmit={handleSubmit}
    />
  );
} 