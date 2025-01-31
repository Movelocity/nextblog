'use client';
import { useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getPost } from '@/app/services/posts';
import { isAuthenticated } from '@/app/services/auth';
import { PostEditor } from '@/app/components/Editor/PostEditor';
import { MdArrowBack, MdLogin } from 'react-icons/md';
import { useEditPostStore } from '@/app/stores/EditPostStore';

const ErrorComponent = ({ message }: { message: string }) => {
  const router = useRouter();

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
            <p className="mt-2 text-sm text-red-700">{message}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 inline-flex items-center text-sm font-medium text-red-600 hover:text-red-500"
            >
              <MdArrowBack className="mr-1" /> Go Back
            </button>
            <button
              onClick={() => {
                localStorage?.setItem("authToken", "");  // clear deprecated auth token
                router.push("/dashboard");
              }}
              className="ml-4 mt-4 inline-flex items-center text-sm font-medium text-red-600 hover:text-red-500"
            >
              <MdLogin className="mr-1" /> Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function EditPostPage() {
  const params = useParams();
  const { isDirty, error, setPost, setError, setLoading, setLastSaved } = useEditPostStore();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const post = await getPost(params.id as string);
        setPost({
          title: post.title,
          content: post.content,
          published: post.published,
          categories: post.categories || [],
          tags: post.tags || [],
        });
        document.title = post.title;
        setLastSaved(new Date());
        setLoading(false);
      } catch (error) {
        console.error('Error fetching post:', error);
        setError('Failed to load post');
        setLoading(false);
      }
    };

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
  }, [params.id, setPost, setError, setLoading, setLastSaved]);

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

  if (error) {
    return <ErrorComponent message={error} />;
  }

  return (
    <PostEditor id={params.id as string}/>
  );
} 