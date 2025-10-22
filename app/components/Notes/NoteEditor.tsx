'use client';

import { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';
import { FiSend, FiLock, FiUnlock } from 'react-icons/fi';

interface NoteEditorProps {
  /** 提交回调 */
  onSubmit: (data: string, tags: string[], isPublic: boolean) => void;
  /** 加载状态 */
  loading?: boolean;
  /** 占位符 */
  placeholder?: string;
}

/**
 * 笔记编辑器组件
 * 用于创建新笔记
 */
const NoteEditor = ({ onSubmit, loading = false, placeholder = '写点什么...' }: NoteEditorProps) => {
  const [data, setData] = useState('');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [showTagEdit, setShowTagEdit] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * 自动调整textarea高度
   */
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  /**
   * 当内容改变时调整高度
   */
  useEffect(() => {
    adjustTextareaHeight();
  }, [data]);

  /**
   * 提交笔记
   */
  const handleSubmit = () => {
    if (!data.trim()) {
      return;
    }

    const tagArray = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    onSubmit(data, tagArray, isPublic);

    // 重置表单
    setData('');
    setTags('');
    setIsPublic(false);
    setShowTagEdit(false);
  };

  /**
   * 处理快捷键
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + Enter 提交
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      {/* 主输入区 */}
      <textarea
        name="new-note-content"
        ref={textareaRef}
        value={data}
        onChange={(e) => setData(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={classNames(
          'w-full p-1 rounded-lg outline-none focus:outline-none',
          'bg-transparent dark:text-white transition-all text-base',
          'muted-scrollbar'
        )}
        style={{ minHeight: '60px', maxHeight: '400px', overflow: 'auto' }}
        disabled={loading}
      />

      {/* 底部操作栏 */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {/* 公开状态 */}
          <button
            onClick={() => setIsPublic(!isPublic)}
            className={classNames(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
              isPublic
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            )}
            disabled={loading}
          >
            {isPublic ? <FiUnlock className="w-4 h-4" /> : <FiLock className="w-4 h-4" />}
            <span>{isPublic ? 'Public' : 'Private'}</span>
          </button>
          {/* 标签输入 */}
          {showTagEdit && (
            <input
              name="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="标签（用逗号分隔，如：工作, 学习, 想法）"
              className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
              disabled={loading}
            />
          )}
          <button
            onClick={() => setShowTagEdit(!showTagEdit)}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            disabled={loading}
          >
            {showTagEdit ? 'OK' : '#'}
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !data.trim()}
          className={classNames(
            'flex items-center gap-2 px-3 py-1 rounded-lg text-white transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            loading || !data.trim()
              ? 'bg-gray-400 dark:bg-gray-600'
              : 'bg-blue-600 hover:bg-blue-700'
          )}
        >
          <FiSend className="w-4 h-4" />
          {loading ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
};

export default NoteEditor;

