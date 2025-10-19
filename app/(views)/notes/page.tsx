'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchNotes, createNote, updateNote, deleteNote } from '@/app/services/notes';
import type { NoteData } from '@/app/common/types.notes';
import NoteCard from '@/app/components/Notes/NoteCard';
import {NoteEditor, NoteSidebar} from '@/app/components/Notes';
import { useIsMobile } from '@/app/hooks/useIsMobile';
import ToastContainer from '@/app/components/Toast';
import type { ToastType } from '@/app/components/Toast';

/**
 * 笔记管理页面
 * 支持创建、查看、编辑笔记，按时间倒序显示，支持分页加载
 */
const NotesPage = () => {
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
  const [showPublicOnly, setShowPublicOnly] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastType }>>([]);
  
  const isMobile = useIsMobile();
  const pageSize = 10;
  const hasMore = notes.length < total;

  /**
   * 显示提示消息
   */
  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  /**
   * 移除提示消息
   */
  const handleDismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  /**
   * 加载笔记列表
   */
  const loadNotes = useCallback(async (pageNum: number, append = false) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const result = await fetchNotes({
        page: pageNum,
        pageSize,
        tag: selectedTag,
        isPublic: showPublicOnly ? true : undefined,
      });
      
      setNotes(prev => append ? [...prev, ...result.notes] : result.notes);
      setTotal(result.total);
      setPage(pageNum);
    } catch (error) {
      showToast('加载笔记失败', 'error');
      console.error('Failed to load notes:', error);
    } finally {
      setLoading(false);
    }
  }, [loading, selectedTag, showPublicOnly, showToast]);

  /**
   * 初始加载
   */
  useEffect(() => {
    loadNotes(1, false);
  }, [selectedTag, showPublicOnly]);

  /**
   * 加载更多
   */
  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadNotes(page + 1, true);
    }
  }, [hasMore, loading, page, loadNotes]);

  /**
   * 创建新笔记
   */
  const handleCreateNote = useCallback(async (data: string, tags: string[], isPublic: boolean) => {
    if (!data.trim()) {
      showToast('笔记内容不能为空', 'warning');
      return;
    }

    setCreating(true);
    try {
      await createNote({ data, tags, isPublic });
      showToast('笔记创建成功', 'success');
      // 重新加载列表
      await loadNotes(1, false);
    } catch (error) {
      showToast('创建笔记失败', 'error');
      console.error('Failed to create note:', error);
    } finally {
      setCreating(false);
    }
  }, [loadNotes, showToast]);

  /**
   * 更新笔记
   */
  const handleUpdateNote = useCallback(async (
    id: string, 
    updates: { data?: string; tags?: string[]; isPublic?: boolean }
  ) => {
    try {
      await updateNote({ id, ...updates });
      showToast('笔记更新成功', 'success');
      
      // 更新本地状态
      setNotes(prev => prev.map(note => 
        note.id === id 
          ? { ...note, ...updates, updatedAt: new Date().toISOString() }
          : note
      ));
    } catch (error) {
      showToast('更新笔记失败', 'error');
      console.error('Failed to update note:', error);
    }
  }, [showToast]);

  /**
   * 删除笔记
   */
  const handleDeleteNote = useCallback(async (id: string) => {
    if (!confirm('确定要删除这条笔记吗？')) {
      return;
    }

    try {
      await deleteNote(id);
      showToast('笔记已删除', 'success');
      
      // 从本地状态中移除
      setNotes(prev => prev.filter(note => note.id !== id));
      setTotal(prev => prev - 1);
    } catch (error) {
      showToast('删除笔记失败', 'error');
      console.error('Failed to delete note:', error);
    }
  }, [showToast]);

  /**
   * 选择标签
   */
  const handleSelectTag = useCallback((tag: string | undefined) => {
    setSelectedTag(tag);
    setPage(1);
  }, []);

  /**
   * 切换公开过滤
   */
  const handleTogglePublicFilter = useCallback(() => {
    setShowPublicOnly(prev => !prev);
    setPage(1);
  }, []);

  return (
    <div className="min-h-screen p-8">
      <div className="w-full">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 主内容区 */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* 不需要页面标题 */}

            {/* 创建笔记区域 */}
            <NoteEditor
              onSubmit={handleCreateNote}
              loading={creating}
              placeholder="写点什么..."
            />

            {/* 笔记列表 */}
            <div className="space-y-3">
              {loading && notes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <p className="text-gray-500 dark:text-gray-400">
                    {selectedTag ? '没有找到相关笔记' : '还没有笔记，开始创建第一条吧！'}
                  </p>
                </div>
              ) : (
                notes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onUpdate={handleUpdateNote}
                    onDelete={handleDeleteNote}
                  />
                ))
              )}
            </div>

            {/* Load More 按钮 */}
            {hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-6 py-3 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? '加载中...' : '加载更多'}
                </button>
              </div>
            )}

            {!hasMore && notes.length > 0 && (
              <div className="mt-6 text-center text-gray-500 dark:text-gray-400">
                已显示全部笔记
              </div>
            )}
          </div>

          {/* 侧边栏 */}
          {!isMobile && (
            <NoteSidebar
              selectedTag={selectedTag}
              showPublicOnly={showPublicOnly}
              onSelectTag={handleSelectTag}
              onTogglePublicFilter={handleTogglePublicFilter}
            />
          )}
        </div>
      </div>

      {/* Toast 通知 */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
};

export default NotesPage;

