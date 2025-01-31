import { useState, useCallback, useEffect, useMemo } from 'react';
import { BlogMeta, SearchParams } from '../../common/types';
import debounce from 'lodash/debounce';
import { getTaxonomy } from '../../services/posts';
import CategoryTag from '@/app/components/CategoryTag';
import { getPosts } from '@/app/services/posts';

interface SearchPostsProps {
  onResult: (result: BlogMeta[]) => void;
  initialCategory?: string;
}

export default function SearchPosts({ 
  onResult,
  initialCategory 
}: SearchPostsProps) {
  const [query, setQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategory ? [initialCategory] : []
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const executeSearch = useCallback((searchParams: SearchParams) => {
    getPosts(searchParams).then(result => {
      onResult(result.blogs_info);
    }).catch(error => {
      console.error('Error searching posts:', error);
    });
  }, [onResult]);

  const getSearchParams = useCallback((): SearchParams => ({
    query: query.trim() || undefined,
    categories: selectedCategories.length ? selectedCategories : undefined,
    tags: selectedTags.length ? selectedTags : undefined,
  }), [query, selectedCategories, selectedTags]);

  // Memoize the debounced search function
  const debouncedSearch = useMemo(
    () =>
      debounce((searchParams: SearchParams) => {
        executeSearch(searchParams);
      }, 300),
    [executeSearch]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // Effect to trigger search when filters change
  useEffect(() => {
    const searchParams = getSearchParams();
    debouncedSearch(searchParams);
  }, [query, selectedCategories, selectedTags, debouncedSearch, getSearchParams]);

  // Fetch available categories and tags
  useEffect(() => {
    const fetchTaxonomy = async () => {
      try {
        const { categories, tags } = await getTaxonomy();
        setAvailableCategories(categories);
        setAvailableTags(tags);
      } catch (error) {
        console.error('Error fetching taxonomy:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTaxonomy();
  }, []);

  // Update selected categories when initialCategory changes
  useEffect(() => {
    if (initialCategory) {
      setSelectedCategories([initialCategory]);
    } else {
      setSelectedCategories([]);
    }
  }, [initialCategory]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const toggleCategory = useCallback((category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, []);

  if (loading) {
    return <div className="text-center py-4">Loading filters...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-2">
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          placeholder="Search posts..."
          className="w-full px-2 py-2 dark:text-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 outline-none"
          aria-label="Search posts"
        />
      </div>

      {availableCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 px-2">
          {availableCategories.map(category => (
            <CategoryTag
              key={category}
              category={category}
              onClick={() => toggleCategory(category)}
              showLink={false}
              selected={selectedCategories.includes(category)}
            />
          ))}
        </div>
      )}

      {availableTags.length > 0 && (
        <div className="py-1 px-3 flex flex-wrap gap-2">
          {availableTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`text-sm rounded-full transition-colors ${
                selectedTags.includes(tag)
                  ? 'text-blue-500 dark:text-blue-300'
                  : 'text-gray-400/50 hover:text-gray-400'
              }`}
              aria-pressed={selectedTags.includes(tag)}
            >
              {"#"+tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 