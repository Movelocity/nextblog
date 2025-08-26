'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { getTaxonomy } from '@/app/services/posts';
// import CategoryTag from '@/app/components/CategoryTag';
import { PAGE_WIDTH } from '@/app/common/utils';
import cn from 'classnames';

/**
 * Page component to display all available categories as cards.
 */
export default function CategoriesPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const taxonomy = await getTaxonomy();
        // Filter out potential empty or invalid categories if necessary
        const validCategories = taxonomy.categories.filter(cat => cat && cat.trim() !== '');
        setCategories(validCategories);
        setError(null);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const renderContent = useMemo(() => {
    if (loading) {
      return <div className="text-center p-8">Loading categories...</div>;
    }
  
    if (error) {
      return <div className="text-center p-8 text-red-500">{error}</div>;
    }

    return (
      <div>
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Categories</h1>
        {categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Link
                key={category}
                href={`/categories/${category}`}
                className="block p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md hover:translate-y-[-2px] transition-all duration-200"
              >
                {category}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">No categories found.</p>
        )}
      </div>
    )
  }, [categories, loading, error])

  return (
    <div className={PAGE_WIDTH}>
      {renderContent}
    </div>
  );
} 