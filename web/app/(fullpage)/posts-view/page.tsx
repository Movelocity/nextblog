'use client';

import { useState, useEffect, useCallback } from 'react';
import { BlogMeta } from '@/app/common/types';
import { getPost, createPost } from '@/app/services/posts';
import { PostsListSidebar } from './LeftPanel';
import { PostEditor, PostEditorData } from '@/app/components/Editor/PostEditor';
import { useEditPostStore } from '@/app/stores/EditPostStore';
import { useToast } from '@/app/components/layout/ToastHook';
import { useAuth } from '@/app/hooks/useAuth';
import { RiAddLine, RiFileTextLine, RiMenuUnfoldLine } from 'react-icons/ri';
import cn from 'classnames';
import IconBtn from '@/app/components/ui/IconBtn';
import { useIsMobile } from '@/app/hooks/useIsMobile';
import { type Theme } from '@/app/utils/globals';

/**
 * 全屏文档编辑视图页面
 * 左侧显示文档列表侧边栏，右侧显示文档编辑区域
 */
export default function PostsViewPage() {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const [isCreating, setIsCreating] = useState(false);
  const [loadingPost, setLoadingPost] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { post, setPost, setLoading, setLastSaved, isDirty, setIsDirty } = useEditPostStore();
  const { showToast } = useToast();
  const { isAuthenticated, isLoading: authLoading, openLoginModal } = useAuth();
  const [theme, setTheme] = useState<Theme>("light");

  const updateTheme = (newTheme: Theme) => {
    if(newTheme === "light") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setTheme(newTheme);
  }

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as Theme || "light";
    updateTheme(storedTheme);
  }, []);

  // 检查登录状态
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      openLoginModal({
        onSuccess: () => {
          showToast('登录成功', 'success');
        }
      });
    }
  }, [authLoading, isAuthenticated, openLoginModal, showToast]);

  // 加载选中的文章内容
  const loadPostContent = useCallback(async (postId: string) => {
    setLoadingPost(true);
    setLoading(true);
    try {
      const post = await getPost(postId);
      setPost({
        title: post.title,
        content: post.content,
        published: post.published,
        categories: post.categories || [],
        tags: post.tags || [],
      });
      setLastSaved(new Date());
      document.title = post.title || '文档编辑';
    } catch (error) {
      console.error('加载文档失败:', error);
      showToast('加载文档失败', 'error');
    } finally {
      setLoadingPost(false);
      setLoading(false);
      setIsDirty(false);
    }
  }, [setPost, setLoading, setLastSaved, showToast]);

  // 处理文档选择
  const handleSelectPost = useCallback((post: BlogMeta) => {
    // 如果有未保存的更改，提示用户（包括新建模式）
    if (isDirty && (selectedPostId || isCreating)) {
      const confirmSwitch = window.confirm('当前文档有未保存的更改，确定要切换吗？');
      if (!confirmSwitch) return;
    }
    
    setIsCreating(false);
    setSelectedPostId(post.id);
    loadPostContent(post.id);
  }, [isDirty, selectedPostId, isCreating, loadPostContent]);

  /**
   * 处理新建文档按钮点击
   * 进入前端新建模式，不调用 API
   */
  const handleCreate = useCallback(() => {
    // 如果有未保存的更改，提示用户
    if (isDirty && (selectedPostId || isCreating)) {
      const confirmSwitch = window.confirm('当前文档有未保存的更改，确定要新建吗？');
      if (!confirmSwitch) return;
    }
    
    // 进入新建模式
    setSelectedPostId(null);
    setIsCreating(true);
    setPost({
      title: '',
      content: '',
      published: false,
      categories: [],
      tags: [],
    });
    setIsDirty(false);
    setLastSaved(null);
    document.title = '新建文档';
  }, [isDirty, selectedPostId, isCreating, setPost, setIsDirty, setLastSaved]);

  /**
   * 处理新建文档首次保存
   * 调用 createPost API，成功后切换为编辑模式
   */
  const handleCreateSubmit = useCallback(async (data: PostEditorData) => {
    try {
      const newPost = await createPost(data);
      showToast('文档创建成功', 'success');
      
      // 切换为编辑模式
      setIsCreating(false);
      setSelectedPostId(newPost.id);
      setIsDirty(false);
      setLastSaved(new Date());
      document.title = newPost.title || '文档编辑';
      
      // 刷新文档列表
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('创建文档失败:', error);
      showToast('创建文档失败', 'error');
    }
  }, [showToast, setIsDirty, setLastSaved]);

  // 页面加载时设置标题
  useEffect(() => {
    document.title = '文档编辑视图';
  }, []);

  // 未选中文档时显示的空状态
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
      <RiFileTextLine className="w-16 h-16 mb-4 opacity-50" />
      <p className="text-lg">选择一篇文档开始编辑</p>
      <p className="text-sm mt-2">从左侧列表中选择文档，或使用搜索查找</p>
    </div>
  );

  // 加载中状态
  const LoadingState = () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  );

  const [sideBarCollapsed, setSideBarCollapsed] = useState(false);

  return (
    <div className="flex h-full">
      {/* 左侧文档列表侧边栏 */}
      <div className={cn(
        "w-64 flex-shrink-0 h-full ", 
        isMobile ? "bg-white dark:bg-zinc-900 fixed left-0 top-0 h-full": "transition-all duration-300",
        sideBarCollapsed && (isMobile ? "hidden" : "w-0")
      )}>
        <PostsListSidebar
          collapsed={sideBarCollapsed}
          onCollapse={setSideBarCollapsed}
          selectedId={selectedPostId}
          onSelect={handleSelectPost}
          // onCreate={handleCreate}
          refreshTrigger={refreshTrigger}
          theme={theme}
          onThemeChange={updateTheme}
        />
      </div>

      {/* 右侧编辑区域 */}
      <div className="flex-1 min-w-0 bg-white dark:bg-zinc-900 flex-col">
        <div className="w-full flex py-1 px-2 items-center gap-1 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-zinc-700">
          {sideBarCollapsed && <IconBtn icon={<RiMenuUnfoldLine className="w-5 h-5" />} onClick={() => setSideBarCollapsed(false)} />}
          <span className="text-sm p-1.5">{post.title || '无标题'}</span>

          <div className="ml-auto">
            <IconBtn icon={<RiAddLine className="w-5 h-5" />} onClick={handleCreate} />
          </div>
        </div>

        <div className="flex-1 min-h-0 h-screen overflow-y-auto muted-scrollbar">
          {loadingPost ? (
            <LoadingState />
          ) : isCreating ? (
            <PostEditor onCreate={handleCreateSubmit} />
          ) : selectedPostId ? (
            <PostEditor id={selectedPostId} />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  );
}

