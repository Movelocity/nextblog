'use client';

import { useState, useEffect } from 'react';
import { getPosts, deletePost } from '@/app/services/posts';
import LoginModal from '@/app/components/Login/LoginModal';
import { isAuthenticated as checkAuth } from '@/app/services/auth';
import PostsTable from '@/app/components/Posts/PostsTable';
import { updatePost } from '@/app/services/posts';
import { useToast } from '@/app/components/Toast/context';
import { BLOG_CONFIG } from '@/app/common/config';
import { BlogMeta } from '@/app/common/types';
export default function DashboardPage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [blogs_info, setBlogsInfo] = useState<BlogMeta[]>([]);
  const { showToast } = useToast();

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
      const { blogs_info } = await getPosts({ 
        page: 1, 
        limit: BLOG_CONFIG.MAX_POSTS_PER_PAGE,
        pubOnly: false 
      });
      setBlogsInfo(blogs_info);
      showToast('Posts fetched successfully', 'success');
    } catch (error) {
      console.error('Error fetching posts:', error);
      showToast('Error fetching posts', 'error');
    } 
  };

  const handleLogin = async () => {
    setIsAuthenticated(true);
    fetchPosts();
  };

  if (!isAuthenticated) {
    return (
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleLogin}
      />
    );
  }

  return (
    <div className="normal-content">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden">
        <PostsTable 
          posts={blogs_info} 
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