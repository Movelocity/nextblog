'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { BlogMeta } from '@/app/common/types';
import { getPost, createPost } from '@/app/services/posts';
import { PostsListSidebar } from '@/app/components/Posts/PostsListSidebar';
import { PostEditor, PostEditorData } from '@/app/components/Editor/PostEditor';
import { useEditPostStore } from '@/app/stores/EditPostStore';
import { useToast } from '@/app/components/layout/ToastHook';
import { useAuth } from '@/app/hooks/useAuth';
import { RiFileTextLine } from 'react-icons/ri';

/**
 * 全屏文档编辑视图页面
 * 左侧显示文档列表侧边栏，右侧显示文档编辑区域
 */
export default function PostsViewPage() {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loadingPost, setLoadingPost] = useState(false);
  const { setPost, setLoading, setLastSaved, isDirty, setIsDirty } = useEditPostStore();
  const { showToast } = useToast();
  const { isAuthenticated, isLoading: authLoading, openLoginModal } = useAuth();
  const refreshListRef = useRef<(() => void) | null>(null);

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
      refreshListRef.current?.();
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

  return (
    <div className="flex h-full">
      {/* 左侧文档列表侧边栏 */}
      <div className="w-64 flex-shrink-0">
        <PostsListSidebar
          selectedId={selectedPostId}
          onSelect={handleSelectPost}
          onCreate={handleCreate}
          onRefreshRef={refreshListRef}
        />
      </div>

      {/* 右侧编辑区域 */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-900">
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
  );
}

