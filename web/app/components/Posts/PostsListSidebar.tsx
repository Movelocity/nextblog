'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { BlogMeta } from '@/app/common/types';
import { searchPosts } from '@/app/services/posts';
import { RiSearchLine, RiMoonFill, RiSunFill, RiHome3Fill, RiAddLine } from 'react-icons/ri';
import cn from 'classnames';
import debounce from 'lodash/debounce';
import { type Theme } from '@/app/utils/globals';
import Link from 'next/link';

interface PostsListSidebarProps {
  /** 当前选中的文档 ID */
  selectedId: string | null;
  /** 选中文档时的回调 */
  onSelect: (post: BlogMeta) => void;
  /** 新建文档时的回调，若提供则不跳转到 /posts/new */
  onCreate?: () => void;
  /** 刷新文档列表的回调引用 */
  onRefreshRef?: React.MutableRefObject<(() => void) | null>;
}

/** 骨架项预设宽度，避免使用随机值导致 hydration 问题 */
const SKELETON_WIDTHS = ['60%', '75%', '50%', '80%', '55%', '70%', '65%', '85%'];

/**
 * 骨架加载项组件
 * 模拟文档列表项的骨架占位
 */
const SkeletonItem = ({ width }: { width: string }) => (
  <div className="px-4 py-2.5 border-l-2 border-transparent">
    <div className="flex items-center gap-2">
      {/* 状态圆点骨架 */}
      <span className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-zinc-700 flex-shrink-0 animate-pulse" />
      {/* 标题骨架 */}
      <div 
        className="h-4 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" 
        style={{ width }} 
      />
    </div>
  </div>
);

/**
 * 文档列表骨架加载组件
 * 显示多个骨架项模拟加载状态
 */
const PostsListSkeleton = () => (
  <ul className="py-2">
    {SKELETON_WIDTHS.map((width, index) => (
      <li key={index}>
        <SkeletonItem width={width} />
      </li>
    ))}
  </ul>
);

/**
 * 文档列表侧边栏组件
 * 显示可搜索、可滚动的文档标题列表
 */
export const PostsListSidebar = ({ selectedId, onSelect, onCreate, onRefreshRef }: PostsListSidebarProps) => {
  const [posts, setPosts] = useState<BlogMeta[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const inputRef = useRef<HTMLInputElement>(null);

  // 初始化主题
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme || 'light';
    updateTheme(storedTheme);
    console.log('useEffect', storedTheme);
  }, []);

  // 切换主题
  const updateTheme = (newTheme: "light" | "dark") => {
    if(newTheme === "light") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setTheme(newTheme);
  }

  const handleToggleTheme = () => {
    console.log('handleToggle', theme);
    updateTheme(theme === "light" ? "dark" : "light");
  };

  // 搜索文档
  const executeSearch = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const { blogs_info } = await searchPosts({
        query: query.trim() || undefined,
        limit: 100, // 获取较多文档以便本地筛选
      });
      setPosts(blogs_info);
    } catch (error) {
      console.error('搜索文档失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 防抖搜索
  const debouncedSearch = useMemo(
    () => debounce((query: string) => executeSearch(query), 300),
    [executeSearch]
  );

  // 初始加载
  useEffect(() => {
    executeSearch('');
  }, [executeSearch]);

  // 暴露刷新方法给父组件
  useEffect(() => {
    if (onRefreshRef) {
      onRefreshRef.current = () => executeSearch(searchQuery);
    }
    return () => {
      if (onRefreshRef) {
        onRefreshRef.current = null;
      }
    };
  }, [onRefreshRef, executeSearch, searchQuery]);

  // 搜索词变化时触发搜索
  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => debouncedSearch.cancel();
  }, [searchQuery, debouncedSearch]);

  // 处理搜索输入
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // 键盘快捷键: Cmd/Ctrl + K 聚焦搜索框
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-700">

      <div className="p-3 flex items-center justify-between text-gray-500 dark:text-gray-400">
        <Link href="/dashboard"><RiHome3Fill className="w-5 h-5 hover:text-gray-700 dark:hover:text-gray-200" /></Link>
        {onCreate ? (
          <button onClick={onCreate} className="hover:text-gray-700 dark:hover:text-gray-200">
            <RiAddLine className="w-5 h-5" />
          </button>
        ) : (
          <Link href="/posts/new"><RiAddLine className="w-5 h-5 hover:text-gray-700 dark:hover:text-gray-200" /></Link>
        )}
      </div>
      {/* 搜索框 */}
      <div className="px-3 pb-2">
        <div className="relative">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="搜索文档... (⌘K)"
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 dark:bg-zinc-800 border-0 rounded-md outline-none focus:ring-1 focus:ring-blue-500 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            aria-label="搜索文档"
          />
        </div>
      </div>

      {/* 文档列表 */}
      <div className="flex-1 overflow-y-auto muted-scrollbar">
        {loading ? (
          <PostsListSkeleton />
        ) : posts.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
            {searchQuery ? '未找到匹配的文档' : '暂无文档'}
          </div>
        ) : (
          <ul className="py-2">
            {posts.map((post) => (
              <li key={post.id}>
                <button
                  onClick={() => onSelect(post)}
                  className={cn(
                    'w-full text-left px-4 py-2.5 text-sm transition-colors',
                    'hover:bg-gray-100 dark:hover:bg-zinc-800',
                    selectedId === post.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {/* 发布状态指示器 */}
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full flex-shrink-0',
                        post.published 
                          ? 'bg-green-500' 
                          : 'bg-gray-300 dark:bg-gray-600'
                      )}
                      title={post.published ? '已发布' : '草稿'}
                    />
                    <span className="truncate">{post.title || '无标题'}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 底部操作栏 */}
      <div className="p-3 border-t border-gray-200 dark:border-zinc-700 flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {posts.length} 篇文档
        </span>
        <button
          onClick={handleToggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400 transition-colors"
          aria-label={theme === 'light' ? '切换至暗色模式' : '切换至亮色模式'}
          title={theme === 'light' ? '切换至暗色模式' : '切换至亮色模式'}
        >
          {theme === 'light' ? <RiMoonFill className="w-4 h-4" /> : <RiSunFill className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

export default PostsListSidebar;

