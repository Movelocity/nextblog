'use client';

import { useRouter } from 'next/navigation';
import { createPost } from '@/app/services/posts';
import { PostEditor, PostEditorData } from '@/app/components/Editor/PostEditor';
import { useEditPostStore } from '@/app/stores/EditPostStore';
import { useEffect } from 'react';

export default function NewPostPage() {
  const router = useRouter();
  const {setPost, setIsDirty} = useEditPostStore();

  useEffect(() => {
    setPost({
      title: '',
      content: '',
      categories: [],
      tags: [],
      published: false,
    });
    document.title = 'New Post';
  }, [setPost]);

  const handleSubmit = async (data: PostEditorData) => {
    const newPost = await createPost(data);
    setIsDirty(false);
    router.push(`/posts/${newPost.id}/edit`);
  };

  return (
    <PostEditor onCreate={handleSubmit}/>
  );
} 