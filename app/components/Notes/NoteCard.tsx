'use client';

import { useState, useRef, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiSave, FiX, FiLock, FiUnlock, FiClock, FiChevronDown, FiChevronUp, FiCopy } from 'react-icons/fi';
import { HiDotsVertical } from "react-icons/hi";
import { Popover, PopoverTrigger, PopoverContent } from '@/app/components/ui/popover';
import type { NoteData } from '@/app/common/types.notes';
import cn from 'classnames';
import { useAuth } from '@/app/hooks/useAuth';
import { copyToClipboard } from '@/app/services/utils';

interface NoteCardProps {
  /** 笔记数据 */
  note: NoteData;
  /** 更新回调 */
  onUpdate: (id: string, updates: { data?: string; tags?: string[]; isPublic?: boolean }) => void;
  /** 删除回调 */
  onDelete: (id: string) => void;
}

/**
 * 笔记卡片组件
 * 支持查看和编辑笔记
 */
const NoteCard = ({ note, onUpdate, onDelete }: NoteCardProps) => {
  const { isAuthenticated } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(note.data);
  const [editedTags, setEditedTags] = useState(note.tags.join(', '));
  const [editedIsPublic, setEditedIsPublic] = useState(note.isPublic);
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldCollapse, setShouldCollapse] = useState(false);
  // const isMobile = useIsMobile();
  const contentRef = useRef<HTMLDivElement>(null);
  const MAX_HEIGHT = 280; // 最大高度阈值（像素）

  /**
   * 检测内容高度，判断是否需要折叠
   */
  useEffect(() => {
    if (contentRef.current && !isEditing) {
      const contentHeight = contentRef.current.scrollHeight;
      setShouldCollapse(contentHeight > MAX_HEIGHT);
      // 内容变化时重置展开状态
      setIsExpanded(false);
    }
  }, [note.data, isEditing, MAX_HEIGHT]);

  /**
   * 格式化时间
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return minutes <= 1 ? '刚刚' : `${minutes} 分钟前`;
      }
      return `${hours} 小时前`;
    }
    
    if (days === 1) return '昨天';
    if (days < 7) return `${days} 天前`;
    
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  /**
   * 开始编辑
   */
  const handleStartEdit = () => {
    setIsEditing(true);
    setEditedData(note.data);
    setEditedTags(note.tags.join(', '));
    setEditedIsPublic(note.isPublic);
  };

  /**
   * 取消编辑
   */
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedData(note.data);
    setEditedTags(note.tags.join(', '));
    setEditedIsPublic(note.isPublic);
  };

  /**
   * 保存编辑
   */
  const handleSaveEdit = () => {
    if (!editedData.trim()) {
      alert('笔记内容不能为空');
      return;
    }

    const tags = editedTags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    onUpdate(note.id, {
      data: editedData,
      tags,
      isPublic: editedIsPublic,
    });

    setIsEditing(false);
  };

  /**
   * 切换公开状态
   */
  const handleTogglePublic = () => {
    onUpdate(note.id, { isPublic: !note.isPublic });
  };

  return (
    <div className={cn('bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow border border-card p-4 pb-2')}>
      {isEditing ? (
        /* 编辑模式 */
        <div className="space-y-3">
          {/* 内容编辑 */}
          <textarea
            name="note-content"
            value={editedData}
            onChange={(e) => setEditedData(e.target.value)}
            className="w-full px-1 py-2 rounded-lg outline-none bg-transparent dark:text-white muted-scrollbar"
            rows={16}
            placeholder="笔记内容..."
          />
          {/* 操作按钮 */}
          <div className="flex gap-2">
            <button
              onClick={() => setEditedIsPublic(!editedIsPublic)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
                editedIsPublic
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              )}
            >
                {editedIsPublic ? <FiUnlock className="w-4 h-4" /> : <FiLock className="w-4 h-4" />}
              <span>{editedIsPublic ? 'Public' : 'Private'}</span>
            </button>

            {/* 标签编辑 */}
            <input
              type="text"
              value={editedTags}
              onChange={(e) => setEditedTags(e.target.value)}
              className="w-full px-3 py-1 border border-gray-300 dark:border-gray-700 outline-none rounded-lg bg-transparent dark:text-white max-w-48 hidden md:block"
              placeholder="标签（用逗号分隔）"
            />
            <span className="flex-1"></span>
            <button
              onClick={handleCancelEdit}
              className="flex items-center gap-1 px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
            >
              <FiX className="w-4 h-4" />
              取消
            </button>
            <button
              onClick={handleSaveEdit}
              className="flex items-center gap-1 px-3 py- bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <FiSave className="w-4 h-4" />
              保存
            </button>
          </div>
        </div>
      ) : (
        /* 查看模式 */
        <div>
          {/* 头部信息 */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <FiClock className="w-3.5 h-3.5" />
              <span>{formatDate(note.createdAt)}</span>
              {/* <span className="text-gray-400 dark:text-gray-500">{note.isPublic ? 'public' : 'private'}</span> */}
              {isAuthenticated && note.updatedAt !== note.createdAt && (
                <span className="text-gray-400 dark:text-gray-500">· 已编辑</span>
              )}
              {/** 未登陆状态不需要额外的public提示 */}
              {isAuthenticated && note.isPublic && <FiUnlock className="w-3 h-3 text-green-600" />} 
            </div>
            
            <div className={cn("flex items-center gap-2", !isAuthenticated && "hidden")}>
              <Popover>
                <PopoverTrigger>
                  <HiDotsVertical className="w-4 h-4" />
                </PopoverTrigger>
                <PopoverContent align="end" className="flex flex-col py-1 text-sm bg-card border border-card">
                  {/* 编辑按钮 */}
                  <button
                    onClick={handleStartEdit}
                    className="w-20 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-center items-center gap-1"
                    title="编辑"
                  >
                    <FiEdit2 className="w-4 h-4" /> 编辑
                  </button>

                  {/* 公开状态图标 */}
                  <button
                    onClick={handleTogglePublic}
                    className={cn(
                      'w-20 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-center items-center gap-1 ',
                      note.isPublic ? 'text-green-600' : ''
                    )}
                    title={note.isPublic ? '公开' : '私有'}
                  >
                    {note.isPublic ? <FiUnlock className="w-4 h-4" /> : <FiLock className="w-4 h-4" />} 
                    {note.isPublic ? '公开' : '私有'}
                  </button>

                  {/** 复制内容 */}
                  <button
                    onClick={() => copyToClipboard(note.data)}
                    className="w-20 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-center items-center gap-1"
                    title="复制"
                  >
                    <FiCopy className="w-4 h-4" /> 复制
                  </button>

                  {/* 删除按钮 */}
                  <button
                    onClick={() => onDelete(note.id)}
                    className="w-20 p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex justify-center items-center gap-1"
                    title="删除"
                  >
                    <FiTrash2 className="w-4 h-4" /> 删除
                  </button>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* 笔记内容 */}
          <div className="relative">
            <div 
              ref={contentRef}
              className={cn(
                "prose prose-base dark:prose-invert max-w-none transition-all duration-300 overflow-hidden",
                shouldCollapse && !isExpanded && "max-h-[280px]"
              )}
              style={shouldCollapse && !isExpanded ? {
                maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)'
              } : undefined}
            >
              <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed">
                {note.data}
              </p>
            </div>
            
            {/* 展开/折叠按钮 */}
            {shouldCollapse && (
              <div className={cn("w-full", isExpanded ? "" : "absolute bottom-0 left-0")}>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1 px-3 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-800 rounded-lg transition-colors mx-auto"
                >
                  {isExpanded ? (
                    <>
                      <FiChevronUp className="w-4 h-4" />
                      <span>收起</span>
                    </>
                  ) : (
                    <>
                      <FiChevronDown className="w-4 h-4" />
                      <span>展开</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* 标签 */}
            {note.tags.length > 0 && (
              <div className="absolute bottom-0 left-0 flex flex-wrap gap-2 pointer-events-none">
                {note.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteCard;

