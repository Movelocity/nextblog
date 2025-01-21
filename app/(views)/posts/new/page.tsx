'use client';

import { useRouter } from 'next/navigation';
import { createPost } from '@/app/services/posts';
import { PostForm, PostFormData } from '@/app/components/PostForm';

export default function NewPostPage() {
  const router = useRouter();

  const handleSubmit = async (data: PostFormData) => {
    await createPost({
      ...data,
      slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    });
    router.push('/posts');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Post</h1>
      <PostForm
        onSubmit={handleSubmit}
        submitLabel="Create Post"
      />
    </div>
  );
} 