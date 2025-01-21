'use client';

import { useEffect, useState } from 'react';
import { Post, SearchParams } from '@/app/common/types';
import { getPosts, deletePost } from '@/app/services/posts';
import PostsList from '@/app/components/PostsList';
import Link from 'next/link';
import SearchPosts from '@/app/components/SearchPosts';

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const fetchPosts = async (searchParams?: SearchParams) => {
    try {
      setLoading(true);
      const response = await getPosts(searchParams);
      setPosts(response.posts);

      // Extract unique categories and tags
      const categories = new Set<string>();
      const tags = new Set<string>();
      
      response.posts.forEach(post => {
        post.categories?.forEach(cat => categories.add(cat));
        post.tags?.forEach(tag => tags.add(tag));
      });

      setAvailableCategories(Array.from(categories));
      setAvailableTags(Array.from(tags));
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Blog Posts</h1>
      
      <div className="mb-8">
        <SearchPosts
          onSearch={fetchPosts}
          availableCategories={availableCategories}
          availableTags={availableTags}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <PostsList posts={posts} onDelete={handleDelete} />
      )}
    </div>
  );
} 