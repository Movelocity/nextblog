'use client';

import { useEffect, useState } from 'react';
import { Post, SearchParams } from '@/app/common/types';
import { getPosts, deletePost, getTaxonomy } from '@/app/services/posts';
import PostsList from '@/app/components/PostsList';
import Link from 'next/link';

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [topLevelCategories, setTopLevelCategories] = useState<string[]>([]);

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
      try {
        const { categories } = await getTaxonomy();
        // Get unique top-level categories
        const topLevel = new Set<string>();
        categories.forEach(cat => {
          const topLevelCat = cat.split('/')[0];
          topLevel.add(topLevelCat);
        });
        setTopLevelCategories(Array.from(topLevel));
      } catch (error) {
        console.error('Error fetching taxonomy:', error);
      }
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
    <div className="container mx-auto px-4 py-8">
      {topLevelCategories.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {topLevelCategories.map(category => (
              <Link
                key={category}
                href={`/posts/category/${category}`}
                className="p-4 bg-white shadow rounded-lg hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-medium text-gray-800">{category}</h3>
              </Link>
            ))}
          </div>
        </div>
      )}

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