'use client';

import { useEffect, useState } from 'react';
import { BlogMeta } from '@/app/common/types';
import { getPosts } from '@/app/services/posts';
import PostsList from '@/app/components/Posts/PostsList';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function CategoryPage() {
  const [posts, setPosts] = useState<BlogMeta[]>([]);
  const [availableSubCategories, setAvailableSubCategories] = useState<string[]>([]);
  
  const params = useParams();
  const categoryPath = (params.slug as string[]) || [];
  const currentCategory = categoryPath.join('/');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // setLoading(true);
        const response = await getPosts({ categories: [currentCategory] });
        setPosts(response.blogs_info);
        document.title = currentCategory;
  
        // Extract unique immediate sub-categories
        const subCategories = new Set<string>();
        response.blogs_info.forEach(post => {
          post.categories?.forEach(cat => {
            // Only add categories that are direct children of current category
            if (cat.startsWith(currentCategory + '/') && 
                cat.split('/').length === categoryPath.length + 1) {
              subCategories.add(cat.split('/').pop()!);
            }
          });
        });
  
        setAvailableSubCategories(Array.from(subCategories));
      } catch (error) {
        console.error('Error fetching posts:', error);
      } 
    };
    fetchPosts();
  }, [currentCategory]);

  const renderBreadcrumbs = () => {
    const crumbs = [];
    let path = '';

    crumbs.push(
      <Link 
        key="home" 
        href="/categories"
        className="text-blue-500 hover:text-blue-700"
      >
        Categories
      </Link>
    );

    categoryPath.forEach((segment, index) => {
      path += (path ? '/' : '') + segment;
      crumbs.push(
        <span key={`separator-${index}`} className="mx-2 text-gray-500">/</span>
      );
      crumbs.push(
        <Link
          key={path}
          href={`/categories/${path}`}
          className={`${
            index === categoryPath.length - 1
              ? 'text-gray-800 dark:text-gray-300 font-semibold'
              : 'text-blue-500 dark:text-blue-400 hover:text-blue-700'
          }`}
        >
          {segment}
        </Link>
      );
    });

    return <div className="text-sm mb-4">{crumbs}</div>;
  };

  return (
    <div className="px-4 max-w-[720px] mx-auto">
      {renderBreadcrumbs()}

      {availableSubCategories.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Sub-categories</h2>
          <div className="flex flex-wrap gap-4">
            {availableSubCategories.map(subCategory => (
              <Link
                key={subCategory}
                href={`/categories/${currentCategory}/${subCategory}`}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-200 transition-colors"
              >
                {subCategory}
              </Link>
            ))}
          </div>
        </div>
      )}

      <PostsList posts={posts} />
    </div>
  );
} 