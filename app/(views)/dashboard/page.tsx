'use client';

import { useState, useEffect } from 'react';
import { getPosts, deletePost } from '@/app/services/posts';
import LoginModal from '@/app/components/LoginModal';
import { login, setAuthToken, isAuthenticated as checkAuth, removeAuthToken } from '@/app/services/auth';
import PostsTable from '@/app/components/PostsTable';
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
  const [_stats, setStats] = useState<DashboardStats>({
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