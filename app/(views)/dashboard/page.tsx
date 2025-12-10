'use client';

import { useState, useEffect, Suspense } from 'react';
import { getPosts, deletePost } from '@/app/services/posts';
import PostsTable from '@/app/components/Posts/PostsTable';
import { updatePost } from '@/app/services/posts';
import { useToast } from '@/app/components/layout/ToastHook';
import { BLOG_CONFIG } from '@/app/common/globals';
import { BlogMeta } from '@/app/common/types';
import Pagination from '@/app/components/Pagination';
import { useAuth } from '@/app/hooks/useAuth';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

function DashboardContent() {
  const [blogs_info, setBlogsInfo] = useState<BlogMeta[]>([]);
  const { showToast } = useToast();
  const { isAuthenticated, isLoading, openLoginModal } = useAuth();
  const [loadingPosts, setLoadingPosts] = useState(true);
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const [postsCnt, setPostsCnt] = useState(0);
  const totalPages = Math.ceil(postsCnt / BLOG_CONFIG.MAX_POSTS_PER_PAGE);
  const router = useRouter();

  useEffect(() => {
    document.title = 'Dashboard';
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const handleLoginSuccess = () => {
        fetchPosts();
      };
      openLoginModal({onSuccess: handleLoginSuccess});
    }
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts();
    }
  }, [page, isAuthenticated]);

  const fetchPosts = async () => {
    try {
      setLoadingPosts(true);
      const { blogs_info, total } = await getPosts({ 
        page: page, 
        limit: BLOG_CONFIG.MAX_POSTS_PER_PAGE,
        // pubOnly: false 
      });
      setBlogsInfo(blogs_info);
      setPostsCnt(total);
    } catch (error) {
      console.error('Error fetching posts:', error);
      showToast('Error fetching posts', 'error');
    } finally {
      setLoadingPosts(false);
    }
  };

  if (loadingPosts) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        {/* <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div> */}
      </div>
    );
  }

  if (!isAuthenticated) {
    return <div className="w-full h-full flex justify-center items-center">
      <button className="text-gray-900 dark:text-gray-300" onClick={()=>{openLoginModal()}}>LOGIN</button>
    </div>; // 登录弹窗由全局 GlobalLoginModal 处理
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    
    // Update URL with new page number
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/dashboard?${params.toString()}`);
  };

  const handleDelete = (id: string) => {
    if (!id) return;
    deletePost(id).then(() => {
      fetchPosts();
    });
  }

  const handleTogglePublish = (id: string, currentStatus: boolean) => {
    if (!id) return;
    updatePost(id, { published: !currentStatus }).then(()=> {
      setBlogsInfo(blogs_info.map(blog => 
        blog.id === id ? { ...blog, published: !currentStatus } : blog
      ));
    }).catch((error) => {
      console.error('Error toggling post status:', error);
    });
            
  }

  return (
    <div className="relative">
      <PostsTable 
        posts={blogs_info} 
        onDelete={handleDelete}
        onTogglePublish={handleTogglePublish}
      />
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
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