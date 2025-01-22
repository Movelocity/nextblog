'use client';

import { useEffect, useState } from 'react';
import { Post, SearchParams } from '@/app/common/types';
import { getPosts, deletePost } from '@/app/services/posts';
import PostsList from '@/app/components/PostsList';


export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);


  const fetchPosts = async (searchParams?: SearchParams) => {
    try {
      setLoading(true);
      const response = await getPosts(searchParams);
      setPosts(response.posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch initial posts and taxonomy
    const init = async () => {
      fetchPosts();
    };
    init();
  }, []);


  const handleDelete = async (id: string) => {
    try {
      await deletePost(id);
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-24 py-8">
      {loading ? (
        <div className="text-center py-4">Loading posts...</div>
      ) : (
        <PostsList 
          posts={posts} 
          onDelete={handleDelete}
        />
      )}
    </div>
  );
} 