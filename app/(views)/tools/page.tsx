'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  tools, 
  toolCategories, 
  ToolCategory, 
  searchTools,
  // getToolsByCategory,
  getPopularTools,
  getNewTools 
} from '@/app/common/tools.config';
import { RiSearchLine, RiStarFill, RiFireFill, RiSparklingFill } from 'react-icons/ri';
import cn from 'classnames';

/**
 * Tools aggregation dashboard page
 * Displays all available tools in a card grid layout with search and category filtering
 */
export default function ToolsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'all'>('all');
  const [showOnlyNew, setShowOnlyNew] = useState(false);
  const [showOnlyPopular, setShowOnlyPopular] = useState(false);

  // Filter tools based on search, category and flags
  const filteredTools = useMemo(() => {
    let result = tools;

    // Apply search filter
    if (searchQuery) {
      result = searchTools(searchQuery);
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter(tool => tool.category === selectedCategory);
    }

    // Apply new/popular filters
    if (showOnlyNew) {
      result = result.filter(tool => tool.isNew);
    }
    if (showOnlyPopular) {
      result = result.filter(tool => tool.isPopular);
    }

    return result;
  }, [searchQuery, selectedCategory, showOnlyNew, showOnlyPopular]);

  // Get recommended tools (popular and new)
  const recommendedTools = useMemo(() => {
    const popular = getPopularTools();
    const newTools = getNewTools();
    const combined = [...new Set([...popular, ...newTools])];
    return combined.slice(0, 4);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCategoryChange = (category: ToolCategory | 'all') => {
    setSelectedCategory(category);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            工具箱
          </h1>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索工具..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg 
                       bg-white dark:bg-zinc-900 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCategoryChange('all')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                selectedCategory === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-zinc-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
              )}
            >
              全部
            </button>
            {Object.entries(toolCategories).map(([key, value]) => (
              <button
                key={key}
                onClick={() => handleCategoryChange(key as ToolCategory)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  selectedCategory === key
                    ? value.color
                    : 'bg-white dark:bg-zinc-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
                )}
              >
                {value.name}
              </button>
            ))}
          </div>

          {/* Quick Filters */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyNew}
                onChange={(e) => setShowOnlyNew(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <RiSparklingFill className="text-yellow-500" />
                仅显示新工具
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyPopular}
                onChange={(e) => setShowOnlyPopular(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <RiFireFill className="text-orange-500" />
                仅显示热门工具
              </span>
            </label>
          </div>
        </div>

        {/* Recommended Tools Section */}
        {!searchQuery && selectedCategory === 'all' && !showOnlyNew && !showOnlyPopular && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <RiStarFill className="text-yellow-500" />
              推荐工具
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendedTools.map(tool => (
                <Link
                  key={tool.id}
                  href={tool.path}
                  className="group relative bg-gradient-to-br from-blue-50 to-purple-50 dark:from-zinc-800 dark:to-zinc-900 
                           rounded-lg p-4 hover:shadow-lg transition-all duration-300 border border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-zinc-700 transition-colors">
                      <tool.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        {tool.name}
                        {tool.isNew && (
                          <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
                            NEW
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTools.map(tool => (
            <Link
              key={tool.id}
              href={tool.path}
              className="group bg-white dark:bg-zinc-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800
                       hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300"
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'p-2 rounded-lg transition-colors',
                  toolCategories[tool.category].color
                )}>
                  <tool.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    {tool.name}
                    {tool.isNew && (
                      <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
                        NEW
                      </span>
                    )}
                    {tool.isPopular && (
                      <RiFireFill className="text-orange-500 w-4 h-4" />
                    )}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {tool.description}
                  </p>
                  <span className={cn(
                    'inline-block text-xs px-2 py-1 rounded mt-2',
                    toolCategories[tool.category].color
                  )}>
                    {toolCategories[tool.category].name}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* No Results */}
        {filteredTools.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              没有找到符合条件的工具
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
