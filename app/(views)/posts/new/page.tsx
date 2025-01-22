'use client';

import { useRouter } from 'next/navigation';
import { createPost } from '@/app/services/posts';
import { PostEditor, PostEditorData } from '@/app/components/PostEditor';

export default function NewPostPage() {
  const router = useRouter();

  const handleSubmit = async (data: PostEditorData) => {
    await createPost({
      ...data,
      slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    });
    router.push('/posts');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Post</h1>
      <PostEditor
        onCreate={handleSubmit}
      />
    </div>
  );
} 