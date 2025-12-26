'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { BlogMeta } from '@/app/common/types';
import { searchPosts } from '@/app/services/posts';
import { RiSearchLine, RiMoonFill, RiSunFill, RiHome3Fill, RiAddLine, RiMenuFoldLine } from 'react-icons/ri';
import cn from 'classnames';
import debounce from 'lodash/debounce';
import { type Theme } from '@/app/utils/globals';
import Link from 'next/link';
import IconBtn from '@/app/components/ui/IconBtn';
import { useRouter } from 'next/navigation';

interface PostsListSidebarProps {
  /** 当前选中的文档 ID */
  selectedId: string | null;
  /** 选中文档时的回调 */
  onSelect: (post: BlogMeta) => void;
  /** 新建文档时的回调，若提供则不跳转到 /posts/new */
  onCreate?: () => void;
  /** 刷新触发器，当值变化时重新加载列表 */
  refreshTrigger?: number;
  /** 是否折叠 */
  collapsed: boolean;
  /** 折叠回调 */
  onCollapse: (collapsed: boolean) => void;
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
export const PostsListSidebar = ({ collapsed, onCollapse, selectedId, onSelect, refreshTrigger }: PostsListSidebarProps) => {
  const [posts, setPosts] = useState<BlogMeta[]>([]);
  const [displayPosts, setDisplayPosts] = useState<BlogMeta[]>([]); // 用于显示的列表，延迟更新
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const inputRef = useRef<HTMLInputElement>(null);
  const postsLengthRef = useRef(0);
  const isInitialLoadRef = useRef(true); // 标记是否是初始加载
  const router = useRouter();

  // 切换主题
  const updateTheme = useCallback((newTheme: "light" | "dark") => {
    if(newTheme === "light") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setTheme(newTheme);
  }, []);

  const handleToggleTheme = () => {
    console.log('handleToggle', theme);
    updateTheme(theme === "light" ? "dark" : "light");
  };

  // 初始化主题
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme || 'light';
    updateTheme(storedTheme);
    console.log('useEffect', storedTheme);
  }, [updateTheme]);

  // 搜索文档
  const executeSearch = useCallback(async (query: string, pageNum: number = 1, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      // 不清空 posts，保留旧数据用于显示
    }
    
    try {
      const { blogs_info, total: totalCount } = await searchPosts({
        query: query.trim() || undefined,
        page: pageNum,
        limit: 20, // 每页加载 20 条
      });
      
      if (append) {
        setPosts(prev => {
          const newPosts = [...prev, ...blogs_info];
          postsLengthRef.current = newPosts.length;
          setDisplayPosts(newPosts); // 立即更新显示列表
          return newPosts;
        });
      } else {
        setPosts(blogs_info);
        setDisplayPosts(blogs_info); // 数据加载完成后再更新显示列表
        postsLengthRef.current = blogs_info.length;
      }
      
      // 判断是否还有更多数据
      const totalLoaded = append ? postsLengthRef.current : blogs_info.length;
      setHasMore(totalLoaded < totalCount);
      setTotal(totalCount);
      setPage(pageNum);
    } catch (error) {
      console.error('搜索文档失败:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // 加载更多
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      executeSearch(searchQuery, page + 1, true);
    }
  }, [searchQuery, page, loadingMore, hasMore, executeSearch]);

  // 防抖搜索（搜索时重置分页）
  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      setPage(1);
      setHasMore(true);
      executeSearch(query, 1, false);
    }, 300),
    [executeSearch]
  );

  // 初始加载（立即执行，无防抖延迟）
  useEffect(() => {
    executeSearch('', 1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 监听刷新触发器
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      setPage(1);
      setHasMore(true);
      executeSearch(searchQuery, 1, false);
    }
  }, [refreshTrigger, executeSearch, searchQuery]);

  // 搜索词变化时触发搜索（跳过初始加载，避免重复调用）
  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }
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

  // 手动点击加载更多
  const handleLoadMore = () => {
    if (hasMore && !loadingMore && !loading) {
      loadMore();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-700">
      <div className="px-3 py-1 flex items-center justify-between text-gray-500 dark:text-gray-400">
        <IconBtn icon={<RiMenuFoldLine className="w-5 h-5" />} onClick={() => onCollapse(true)} />
        <div className="flex items-center gap-1">
          <IconBtn icon={<RiHome3Fill className="w-5 h-5" />} onClick={() => router.push('/dashboard')} />
        </div>
      </div>
      {/* 搜索框 */}
      <div className="px-3 pb-2">
        <div className={cn("relative", collapsed ? "hidden" : "")}>
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
          <input
            ref={inputRef}
            id="posts-search-input"
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
        {loading && displayPosts.length === 0 ? (
          // 仅在首次加载且没有数据时显示骨架
          <PostsListSkeleton />
        ) : displayPosts.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
            {searchQuery ? '未找到匹配的文档' : '暂无文档'}
          </div>
        ) : (
          <>
            <ul className="py-2">
              {displayPosts.map((post) => (
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
            
            {/* 手动加载更多按钮 */}
            {hasMore && (
              <div className="text-center pb-4">
                {loadingMore ? (
                  <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                    <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin" />
                    <span>加载中...</span>
                  </div>
                ) : (
                  <button
                    onClick={handleLoadMore}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                  >
                    加载更多
                  </button>
                )}
              </div>
            )}
            
            {/* 没有更多数据提示 */}
            {!hasMore && displayPosts.length > 0 && (
              <div className="text-center text-gray-400 dark:text-gray-500 text-xs">
                已加载全部文档
              </div>
            )}
          </>
        )}
      </div>

      {/* 底部操作栏 */}
      <div className="p-3 border-t border-gray-200 dark:border-zinc-700 flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {displayPosts.length > 0 && total > 0 ? `${displayPosts.length} / ${total}` : `${displayPosts.length}`} 篇文档
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

