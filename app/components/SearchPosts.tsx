import { useState, useCallback } from 'react';
import { SearchParams } from '../common/types';
import debounce from 'lodash/debounce';

interface SearchPostsProps {
  onSearch: (params: SearchParams) => void;
  availableCategories: string[];
  availableTags: string[];
}

export default function SearchPosts({ onSearch, availableCategories, availableTags }: SearchPostsProps) {
  const [query, setQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const debouncedSearch = useCallback(
    debounce((searchParams: SearchParams) => {
      onSearch(searchParams);
    }, 300),
    [onSearch]
  );

  const handleSearch = useCallback(() => {
    const searchParams: SearchParams = {
      query: query || undefined,
      categories: selectedCategories.length ? selectedCategories : undefined,
      tags: selectedTags.length ? selectedTags : undefined,
    };
    debouncedSearch(searchParams);
  }, [query, selectedCategories, selectedTags, debouncedSearch]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    handleSearch();
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => {
      const newCategories = prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category];
      return newCategories;
    });
    handleSearch();
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      const newTags = prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag];
      return newTags;
    });
    handleSearch();
  };

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg shadow">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          placeholder="Search posts..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label="Search posts"
        />
      </div>

      {availableCategories.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Categories</h3>
          <div className="flex flex-wrap gap-2">
            {availableCategories.map(category => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  selectedCategories.includes(category)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-pressed={selectedCategories.includes(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      {availableTags.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {availableTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-pressed={selectedTags.includes(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 