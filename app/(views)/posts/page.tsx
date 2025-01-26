'use client';

import { Suspense, useEffect, useState } from 'react';
import { Post, SearchParams } from '@/app/common/types';
import { getPosts } from '@/app/services/posts';
import PostsList from '@/app/components/PostsList';
import { useToast } from '@/app/components/Toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { POSTS_CONFIG } from '@/app/common/config';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

function Page() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [total, setTotal] = useState(0);
  const page = Number(searchParams.get('page')) || 1;
  const limit = POSTS_CONFIG.MAX_POSTS_PER_PAGE;

  const fetchPosts = async (searchParams?: SearchParams) => {
    try {
      setLoading(true);
      const response = await getPosts(searchParams);
      setPosts(response.posts);
      setTotal(response.total);
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
    <div className="container mx-auto px-4 md:px-24 py-8">
      <PostsList posts={posts} isLoading={loading} />
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center gap-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm
                  ${pageNum === page 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                aria-label={`Go to page ${pageNum}`}
                aria-current={pageNum === page ? 'page' : undefined}
              >
                {pageNum}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            <FiChevronRight className="w-5 h-5" />
          </button>
        </div>
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
