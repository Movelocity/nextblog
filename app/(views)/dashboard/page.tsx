'use client';

import { useState, useEffect } from 'react';
import { getPosts, deletePost } from '@/app/services/posts';
import LoginModal from '@/app/components/LoginModal';
import { login, setAuthToken, isAuthenticated as checkAuth } from '@/app/services/auth';
import PostsTable from '@/app/components/Posts/PostsTable';
import { Post } from '@/app/common/types';
import { updatePost } from '@/app/services/posts';
import { useToast } from '@/app/components/Toast/context';


export default function DashboardPage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const authStatus = await checkAuth();
      setIsAuthenticated(authStatus);
      if (authStatus) {
        setIsLoginModalOpen(false);
        fetchPosts();
      }
    };
    checkAuthStatus();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { posts } = await getPosts({ page: 1, limit: 100, getAll: true });
      setPosts(posts);
      showToast('Posts fetched successfully', 'success');
    } catch (error) {
      console.error('Error fetching posts:', error);
      showToast('Error fetching posts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string, remember: boolean) => {
    try {
      const response = await login({ email, password });
      setAuthToken(response.token);
      setIsAuthenticated(true);
      fetchPosts();
    } catch (error) {
      console.log('error', error);
      throw new Error('Invalid credentials');
    }
    return true;
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
    <div className="normal-content">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden">
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
      </div>
    </div>
  );
}