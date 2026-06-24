'use client';

import { useState } from 'react';
import classNames from 'classnames';
import { FiSearch, FiFilter, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useAuth } from '@/app/hooks/useAuth';
import { useNoteStats } from '@/app/hooks/useNoteStats';

interface NoteMobileFilterProps {
  /** 当前选中的标签 */
  selectedTag?: string;
  /** 是否只显示公开笔记 */
  showPublicOnly: boolean;
  /** 当前搜索关键词 */
  searchQuery: string;
  /** 选择标签回调 */
  onSelectTag: (tag: string | undefined) => void;
  /** 切换公开过滤回调 */
  onTogglePublicFilter: () => void;
  /** 搜索关键词变更回调 */
  onSearchChange: (query: string) => void;
}

/**
 * 移动端笔记筛选条
 * 仅在移动端渲染（由父组件根据 isMobile 控制），提供标签筛选、公开过滤和搜索。
 * 复用 useNoteStats 获取标签统计，与桌面端 NoteSidebar 共享数据源。
 */
const NoteMobileFilter = ({
  selectedTag,
  showPublicOnly,
  searchQuery,
  onSelectTag,
  onTogglePublicFilter,
  onSearchChange,
}: NoteMobileFilterProps) => {
  const { tagStats, loading } = useNoteStats();
  const { isAuthenticated } = useAuth();
  const [expanded, setExpanded] = useState(false);

  const sortedTags = Object.entries(tagStats).sort((a, b) => b[1] - a[1]);
  const hasActiveFilter = !!selectedTag || !!searchQuery.trim();

  return (
    <div className="bg-card rounded-lg shadow-sm border border-card">
      {/* 搜索框（始终展示） */}
      <div className="flex items-center gap-2 px-3 py-2">
        <FiSearch className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="搜索笔记..."
          className="flex-1 bg-transparent outline-none text-sm dark:text-white"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <FiX className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 展开切换按钮 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={classNames(
          'w-full flex items-center justify-between px-3 py-2 border-t border-card text-sm',
          hasActiveFilter ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
        )}
      >
        <span className="flex items-center gap-2">
          <FiFilter className="w-4 h-4" />
          {hasActiveFilter
            ? `筛选中${selectedTag ? `：#${selectedTag}` : ''}`
            : '筛选标签'}
        </span>
        {expanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
      </button>

      {/* 展开后的筛选内容 */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-card">
          {/* 公开过滤（仅登录用户） */}
          {isAuthenticated && (
            <button
              onClick={onTogglePublicFilter}
              className={classNames(
                'w-full px-3 py-2 rounded-lg text-sm transition-colors text-left',
                showPublicOnly
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              )}
            >
              {showPublicOnly ? '✓ ' : ''}仅显示公开笔记
            </button>
          )}

          {/* 标签横向滚动条 */}
          <div>
            {loading ? (
              <div className="text-center py-2 text-gray-400 text-xs">加载中...</div>
            ) : sortedTags.length === 0 ? (
              <div className="text-center py-2 text-gray-400 text-xs">还没有标签</div>
            ) : (
              <div className="flex gap-2 overflow-x-auto muted-scrollbar pb-1">
                <button
                  onClick={() => onSelectTag(undefined)}
                  className={classNames(
                    'flex-shrink-0 px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors',
                    !selectedTag
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  )}
                >
                  全部
                </button>
                {sortedTags.map(([tag, count]) => (
                  <button
                    key={tag}
                    onClick={() => onSelectTag(tag)}
                    className={classNames(
                      'flex-shrink-0 px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors',
                      selectedTag === tag
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    )}
                  >
                    #{tag} ({count})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteMobileFilter;
