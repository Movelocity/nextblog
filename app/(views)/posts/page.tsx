'use client';

import { Suspense, useEffect, useState } from 'react';
import { BlogMeta, SearchParams } from '@/app/common/types';
import { getPosts } from '@/app/services/posts';
import PostsList from '@/app/components/Posts/PostsList';
import { useToast } from '@/app/components/Toast/context';
import { useRouter, useSearchParams } from 'next/navigation';
import { BLOG_CONFIG } from '@/app/common/globals';
import Pagination from '@/app/components/Pagination';
// import { PAGE_WIDTH } from '@/app/common/utils';

function Page() {
  const [posts, setPosts] = useState<BlogMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [total, setTotal] = useState(0);
  const page = Number(searchParams.get('page')) || 1;
  const limit = BLOG_CONFIG.MAX_POSTS_PER_PAGE;

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("update-title", { detail: { title: "文章列表" } }));
  }, []);

  const fetchPosts = async (searchParams?: SearchParams) => {
    try {
      setLoading(true);
      const { blogs_info, total } = await getPosts(searchParams);
      setPosts(blogs_info);
      setTotal(total);
    } catch (error) {
      console.error('Error fetching posts:', error);
      showToast('Error fetching posts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts({ page, limit });
  }, [page, limit]);

  const totalPages = Math.ceil(total / limit);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    
    // Update URL with new page number
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/posts?${params.toString()}`);
  };

  return (
    <div className="flex-1 p-8">
      <PostsList posts={posts} isLoading={loading} />
      
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
} 

export default function PostsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Page />
    </Suspense>
  )
}
