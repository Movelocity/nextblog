'use client';

import { Suspense, useEffect, useState } from 'react';
import { Post, SearchParams } from '@/app/common/types';
import { getPosts } from '@/app/services/posts';
import PostsList from '@/app/components/PostsList';
import { useToast } from '@/app/components/Toast/context';
import { useRouter, useSearchParams } from 'next/navigation';
import { BLOG_CONFIG } from '@/app/common/config';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

function Page() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [total, setTotal] = useState(0);
  const page = Number(searchParams.get('page')) || 1;
  const limit = BLOG_CONFIG.MAX_POSTS_PER_PAGE;

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
    <div className="normal-content">
      <PostsList posts={posts} isLoading={loading} />
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center gap-1 px-2 max-w-full overflow-x-auto">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            aria-label="Previous page"
          >
            <FiChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          
          <div className="flex items-center gap-1 overflow-x-auto">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`min-w-[1.75rem] h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm
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
            className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            aria-label="Next page"
          >
            <FiChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
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
