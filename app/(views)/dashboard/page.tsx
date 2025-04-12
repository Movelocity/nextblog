'use client';

import { useState, useEffect, Suspense } from 'react';
import { getPosts, deletePost } from '@/app/services/posts';
import PostsTable from '@/app/components/Posts/PostsTable';
import { updatePost } from '@/app/services/posts';
import { useToast } from '@/app/components/Toast/context';
import { BLOG_CONFIG } from '@/app/common/config';
import { BlogMeta } from '@/app/common/types';
import Pagination from '@/app/components/Pagination';
import { useLoginModal } from '@/app/hooks/useLoginModal';
import { useAuth } from '@/app/hooks/useAuth';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

function DashboardContent() {
  const [blogs_info, setBlogsInfo] = useState<BlogMeta[]>([]);
  const { showToast } = useToast();
  const { isAuthenticated, isLoading, checkAuthStatus } = useAuth();
  const { setIsOpen: setLoginModalOpen, setOnSuccess: setLoginSuccess } = useLoginModal();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const [postsCnt, setPostsCnt] = useState(0);
  const totalPages = Math.ceil(postsCnt / BLOG_CONFIG.MAX_POSTS_PER_PAGE);
  const router = useRouter();

  useEffect(() => {
    checkAuthStatus();
    document.title = 'Dashboard';
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const handleLoginSuccess = () => {
        fetchPosts();
      };
      setLoginSuccess(handleLoginSuccess);
      setLoginModalOpen(true);
    }
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts();
    }
  }, [page, isAuthenticated]);

  const fetchPosts = async () => {
    try {
      const { blogs_info, total } = await getPosts({ 
        page: page, 
        limit: BLOG_CONFIG.MAX_POSTS_PER_PAGE,
        pubOnly: false 
      });
      setBlogsInfo(blogs_info);
      setPostsCnt(total);
    } catch (error) {
      console.error('Error fetching posts:', error);
      showToast('Error fetching posts', 'error');
    } 
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // 登录弹窗由全局 GlobalLoginModal 处理
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    
    // Update URL with new page number
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/dashboard?${params.toString()}`);
  };

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
              // fetchPosts();
              setBlogsInfo(blogs_info.map(blog => 
                blog.id === id ? { ...blog, published: !currentStatus } : blog
              ));
            } catch (error) {
              console.error('Error toggling post status:', error);
            }
          }}
        />
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}