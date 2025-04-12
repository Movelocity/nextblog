'use client';
import { use, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getPost } from '@/app/services/posts';
import { isAuthenticated } from '@/app/services/auth';
import { PostEditor } from '@/app/components/Editor/PostEditor';
import { useEditPostStore } from '@/app/stores/EditPostStore';
import { useToast } from '@/app/components/Toast/context';

export default function EditPostPage() {
  const params = useParams();
  const { isDirty, error, setPost, setError, setLoading, setLastSaved } = useEditPostStore();
  const { showToast } = useToast();
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

  useEffect(() => {
    if (error) {
      showToast(error, 'error');
    }
  }, [error, showToast]);

  return (
    <PostEditor id={params.id as string}/>
  );
} 