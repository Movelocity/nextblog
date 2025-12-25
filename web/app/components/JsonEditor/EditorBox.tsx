'use client';

import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { EditorBox as EditorBoxType, EditorType, EditorLanguage } from './types';
import { 
  RiCloseLine, 
  RiFileCopyLine, 
  RiCheckLine,
  RiCodeSSlashLine,
  RiFileTextLine,
  RiMarkdownLine
} from 'react-icons/ri';
import cn from 'classnames';

// Lazy load CodeMirror for better initial load performance
const CodeMirrorEditor = lazy(() => import('./CodeMirrorEditor'));
const MarkdownPreview = lazy(() => import('./MarkdownPreview'));

interface EditorBoxProps {
  box: EditorBoxType;
  onContentChange: (id: string, content: string) => void;
  onTypeChange: (id: string, type: EditorType) => void;
  onLanguageChange: (id: string, language: EditorLanguage) => void;
  onLabelChange: (id: string, label: string) => void;
  onDelete: (id: string) => void;
  onApplyOperation: (id: string, operation: string) => void;
  onSizeChange: (id: string, height: number) => void;
  customScripts?: Array<{ id: string; name: string; code: string; description?: string; outputMode?: 'inplace' | 'newBlock' }>;
  onExecuteScript?: (boxId: string, scriptId: string) => void;
}

/**
 * Individual editor box component with type switching and controls
 */
const EditorBox = ({
  box,
  onContentChange,
  onTypeChange,
  onLanguageChange,
  onLabelChange,
  onDelete,
  onApplyOperation,
  onSizeChange,
  // customScripts = [],
  // onExecuteScript
}: EditorBoxProps) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [isDraggingHeight, setIsDraggingHeight] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const boxRef = useCallback((node: HTMLDivElement | null) => {
    if (node && !box.height) {
      // Set initial height if not set
      const rect = node.getBoundingClientRect();
      if (rect.height > 0) {
        onSizeChange(box.id, rect.height);
      }
    }
  }, [box.id, box.height, onSizeChange]);

  /**
   * Handles copying box content to clipboard
   */
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(box.content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [box.content]);

  /**
   * Handles editor type switching
   */
  const handleTypeChange = useCallback((newType: EditorType) => {
    onTypeChange(box.id, newType);
  }, [box.id, onTypeChange]);

  /**
   * Handles language mode change for CodeMirror
   */
  const handleLanguageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as EditorLanguage;
    onLanguageChange(box.id, newLang);
  }, [box.id, onLanguageChange]);

  /**
   * Handles vertical resize drag start
   */
  const handleHeightResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingHeight(true);
    setStartY(e.clientY);
    setStartHeight(box.height || 400);
  }, [box.height]);

  /**
   * Handles vertical resize drag
   */
  const handleHeightResizeDrag = useCallback((e: MouseEvent) => {
    if (!isDraggingHeight) return;
    const deltaY = e.clientY - startY;
    const newHeight = Math.max(200, Math.min(800, startHeight + deltaY));
    onSizeChange(box.id, newHeight);
  }, [isDraggingHeight, startY, startHeight, box.id, onSizeChange]);

  /**
   * Handles resize drag end
   */
  const handleResizeEnd = useCallback(() => {
    setIsDraggingHeight(false);
  }, []);

  /**
   * Sets up mouse event listeners for resize
   */
  useEffect(() => {
    if (isDraggingHeight) {
      document.addEventListener('mousemove', handleHeightResizeDrag);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleHeightResizeDrag);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isDraggingHeight, handleHeightResizeDrag, handleResizeEnd]);

  /**
   * Renders the appropriate editor based on type
   */
  const renderEditor = () => {
    switch (box.type) {
      case 'codemirror':
        return (
          <Suspense fallback={<div className="flex items-center justify-center h-full text-muted-foreground">加载编辑器中...</div>}>
            <CodeMirrorEditor
              value={box.content}
              language={box.language}
              onChange={(value) => onContentChange(box.id, value)}
            />
          </Suspense>
        );
      
      case 'markdown':
        return (
          <Suspense fallback={<div className="flex items-center justify-center h-full text-muted-foreground">加载预览中...</div>}>
            <MarkdownPreview content={box.content} />
          </Suspense>
        );
      
      case 'textarea':
      default:
        return (
          <textarea
            value={box.content}
            onChange={(e) => onContentChange(box.id, e.target.value)}
            placeholder="在此输入或粘贴文本..."
            className={cn(
              "w-full h-full p-4 font-mono text-sm bg-transparent text-foreground",
              "placeholder-muted-foreground",
              "focus:outline-none resize-none border-0"
            )}
            spellCheck={false}
          />
        );
    }
  };

  return (
    <div 
      ref={boxRef}
      className="flex flex-col bg-card border border-border rounded-lg shadow-sm overflow-hidden"
      style={{ 
        height: box.height ? `${box.height}px` : '400px'
      }}
    >
      {/* Box Header */}
      <div className="bg-muted border-b border-border px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isEditingLabel ? (
            <input
              type="text"
              value={box.label || ''}
              onChange={(e) => onLabelChange(box.id, e.target.value)}
              onBlur={() => setIsEditingLabel(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingLabel(false)}
              className="px-2 py-1 text-sm border border-border rounded bg-background text-foreground flex-1 min-w-0"
              placeholder="编辑框标签..."
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsEditingLabel(true)}
              className="px-2 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors flex-1 text-left min-w-0 truncate"
            >
              {box.label || '未命名编辑框'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Editor Type Selector */}
          <div className="flex items-center gap-1 border border-border rounded">
            <button
              onClick={() => handleTypeChange('textarea')}
              className={cn(
                "px-2 py-1 text-xs transition-colors",
                box.type === 'textarea' ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              title="纯文本"
            >
              <RiFileTextLine className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleTypeChange('codemirror')}
              className={cn(
                "px-2 py-1 text-xs transition-colors",
                box.type === 'codemirror' ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              title="代码编辑器"
            >
              <RiCodeSSlashLine className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleTypeChange('markdown')}
              className={cn(
                "px-2 py-1 text-xs transition-colors",
                box.type === 'markdown' ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              title="Markdown 预览"
            >
              <RiMarkdownLine className="w-4 h-4" />
            </button>
          </div>

          {/* Language Selector (only visible for CodeMirror) */}
          {box.type === 'codemirror' && (
            <select
              value={box.language}
              onChange={handleLanguageChange}
              className="px-2 py-1 text-xs border border-border rounded bg-background text-foreground"
            >
              <option value="json">JSON</option>
              <option value="javascript">JavaScript</option>
              <option value="bash">Bash</option>
              <option value="markdown">Markdown</option>
              <option value="plaintext">纯文本</option>
            </select>
          )}

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className={cn(
              "px-2 py-1 rounded text-xs transition-colors",
              copySuccess ? "text-green-600" : "text-muted-foreground hover:text-foreground"
            )}
            title="复制内容"
          >
            {copySuccess ? <RiCheckLine className="w-4 h-4" /> : <RiFileCopyLine className="w-4 h-4" />}
          </button>

          {/* Delete Button */}
          <button
            onClick={() => onDelete(box.id)}
            className="px-2 py-1 rounded text-xs text-muted-foreground hover:text-red-600 transition-colors"
            title="删除编辑框"
          >
            <RiCloseLine className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-auto bg-background">
        {renderEditor()}
      </div>

      {/* Box Footer with Operations and Script Selector */}
      <div className="bg-muted border-t border-border px-3 py-2">
        <div className="flex flex-col gap-2">
          <select
            onChange={(e) => {
              if (e.target.value) {
                onApplyOperation(box.id, e.target.value);
                e.target.value = ''; // Reset dropdown
              }
            }}
            className="flex-1 px-2 py-1 text-xs border border-border rounded bg-background text-foreground"
            defaultValue=""
          >
            <option value="" disabled>快速操作...</option>
            <option value="format">格式化 JSON</option>
            <option value="minify">压缩 JSON</option>
            <option value="unescape">反转义字符串</option>
            <option value="remove-newlines">移除换行符</option>
            <option value="remove-tabs">移除制表符</option>
            <option value="remove-quotes">移除引号</option>
          </select>
          
          {/* Script Selector */}
          {/* {customScripts.length > 0 ? (
            <select
              onChange={(e) => {
                if (e.target.value && onExecuteScript) {
                  onExecuteScript(box.id, e.target.value);
                  e.target.value = ''; // Reset dropdown
                }
              }}
              className="flex-1 px-2 py-1 text-xs border border-border rounded bg-background text-foreground"
              defaultValue=""
            >
              <option value="" disabled>运行自定义脚本...</option>
              {customScripts.map((script) => (
                <option key={script.id} value={script.id}>
                  {script.name}{script.description ? ` - ${script.description}` : ''}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex-1 text-xs text-muted-foreground text-center px-2 py-1">
              暂无脚本
            </div>
          )} */}
        </div>
      </div>

      {/* Vertical Resize Handle */}
      <div
        className={cn(
          "h-2 bg-muted border-t border-border cursor-ns-resize hover:bg-accent transition-colors",
          isDraggingHeight && "bg-accent"
        )}
        onMouseDown={handleHeightResizeStart}
        title="拖动以调整高度"
      />
    </div>
  );
};

export default EditorBox;

