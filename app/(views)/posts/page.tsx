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
  const [topLevelCategories, setTopLevelCategories] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const fetchPosts = async (searchParams?: SearchParams) => {
    try {
      setLoading(true);
      const response = await getPosts(searchParams);
      setPosts(response.posts);

      // Extract unique top-level categories and tags
      const categories = new Set<string>();
      const tags = new Set<string>();
      
      response.posts.forEach(post => {
        post.categories?.forEach(cat => {
          // Only add top-level categories
          const topLevel = cat.split('/')[0];
          categories.add(topLevel);
        });
        post.tags?.forEach(tag => tags.add(tag));
      });

      setTopLevelCategories(Array.from(categories));
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

  const handleSearch = (params: SearchParams) => {
    fetchPosts(params);
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
                <p className="text-sm text-gray-500 mt-1">
                  {posts.filter(post => 
                    post.categories?.some(cat => cat.startsWith(category + '/') || cat === category)
                  ).length} posts
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
      
      <div className="mb-8">
        <SearchPosts
          onSearch={handleSearch}
          availableCategories={[]}
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