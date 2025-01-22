'use client';

import { useState, useEffect } from 'react';
import { getPosts, deletePost } from '@/app/services/posts';
import LoginModal from '@/app/components/LoginModal';
import { login, setAuthToken, isAuthenticated as checkAuth, removeAuthToken } from '@/app/services/auth';
import PostsTable from '@/app/components/PostsTable';
import Link from 'next/link';
import { Post } from '@/app/common/types';
import { updatePost } from '@/app/services/posts';

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50 transition-colors"
        >
          Logout
        </button>
      </div>
      
      <div className="flex space-x-4 mb-6">
        <div className="flex-1 bg-white px-4 py-3 rounded-lg shadow-sm border flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-full">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Total Posts</p>
            <p className="text-xl font-semibold text-blue-600">{stats.totalPosts}</p>
          </div>
        </div>

        <div className="flex-1 bg-white px-4 py-3 rounded-lg shadow-sm border flex items-center space-x-3">
          <div className="p-2 bg-green-50 rounded-full">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Published</p>
            <p className="text-xl font-semibold text-green-600">{stats.publishedPosts}</p>
          </div>
        </div>

        <div className="flex-1 bg-white px-4 py-3 rounded-lg shadow-sm border flex items-center space-x-3">
          <div className="p-2 bg-orange-50 rounded-full">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Drafts</p>
            <p className="text-xl font-semibold text-orange-600">{stats.draftPosts}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <PostsTable 
            posts={posts} 
            onDelete={async (id) => {
              await deletePost(id);
              fetchPosts();
            }}
            onTogglePublish={async (id, currentStatus) => {
              try {
                await updatePost(id, { published: !currentStatus });
                fetchPosts();
              } catch (error) {
                console.error('Error toggling post status:', error);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}