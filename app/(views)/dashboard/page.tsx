'use client';

import { useState, useEffect } from 'react';
import { getPosts, deletePost } from '@/app/services/posts';
import LoginModal from '@/app/components/LoginModal';
import { login, setAuthToken, isAuthenticated as checkAuth, removeAuthToken } from '@/app/services/auth';
import PostsList from '@/app/components/PostsList';
import Link from 'next/link';
import { Post } from '@/app/common/types';

interface DashboardStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
}

export default function DashboardPage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const authStatus = checkAuth();
    setIsAuthenticated(authStatus);
    if (authStatus) {
      setIsLoginModalOpen(false);
      fetchPosts();
    }
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { posts, total } = await getPosts({ page: 1, limit: 100, getAll: true });
      console.log("posts", posts);
      setPosts(posts);
      const publishedPosts = posts.filter((post) => post.published);
      const draftPosts = posts.filter((post) => !post.published);

      setStats({
        totalPosts: posts.length,
        publishedPosts: publishedPosts.length,
        draftPosts: draftPosts.length,
      });
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await login({ email, password });
      setAuthToken(response.token);
      setIsAuthenticated(true);
      fetchPosts();
    } catch (error) {
      throw new Error('Invalid credentials');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsLoginModalOpen(true);
    removeAuthToken();
  };

  if (!isAuthenticated) {
    return (
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-red-600 border border-red-600 rounded hover:bg-red-50"
        >
          Logout
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium text-gray-900">Total Posts</h3>
          <p className="mt-2 text-3xl font-semibold text-blue-600">
            {stats.totalPosts}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium text-gray-900">Published Posts</h3>
          <p className="mt-2 text-3xl font-semibold text-green-600">
            {stats.publishedPosts}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium text-gray-900">Draft Posts</h3>
          <p className="mt-2 text-3xl font-semibold text-orange-600">
            {stats.draftPosts}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Manage Posts</h2>
          <Link
            href="/posts/new"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            New Post
          </Link>
        </div>
        
        {loading ? (
          <div className="text-center py-4">Loading posts...</div>
        ) : (
          <PostsList 
            posts={posts} 
            onDelete={async (id) => {
              await deletePost(id);
              fetchPosts();
            }} 
          />
        )}
      </div>
    </div>
  );
} 