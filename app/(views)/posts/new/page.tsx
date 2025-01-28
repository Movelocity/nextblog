'use client';

import { useRouter } from 'next/navigation';
import { createPost } from '@/app/services/posts';
import { PostEditor, PostEditorData } from '@/app/components/Editor/PostEditor';
import { useEditPostStore } from '@/app/stores/EditPostStore';
import { useEffect } from 'react';

export default function NewPostPage() {
  const router = useRouter();
  const {setPost} = useEditPostStore();

  useEffect(() => {
    setPost({
      title: '',
      content: '',
      categories: [],
      tags: [],
      published: false,
    });
  }, [setPost]);

  const handleSubmit = async (data: PostEditorData) => {
    const newPost = await createPost({
      ...data,
      slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    });
    router.push(`/posts/${newPost.id}/edit`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PostEditor onCreate={handleSubmit}/>
    </div>
  );
} 