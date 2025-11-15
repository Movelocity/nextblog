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
  onSizeChange: (id: string, width: number, height: number) => void;
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
  onSizeChange
}: EditorBoxProps) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const boxRef = useCallback((node: HTMLDivElement | null) => {
    if (node && !box.height) {
      // Set initial height if not set
      const rect = node.getBoundingClientRect();
      if (rect.height > 0) {
        onSizeChange(box.id, box.width || 0, rect.height);
      }
    }
  }, [box.id, box.height, box.width, onSizeChange]);

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
   * Handles resize drag start
   */
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartY(e.clientY);
    setStartHeight(box.height || 300);
  }, [box.height]);

  /**
   * Handles resize drag
   */
  const handleResizeDrag = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const deltaY = e.clientY - startY;
    const newHeight = Math.max(200, Math.min(800, startHeight + deltaY));
    onSizeChange(box.id, box.width || 0, newHeight);
  }, [isDragging, startY, startHeight, box.id, box.width, onSizeChange]);

  /**
   * Handles resize drag end
   */
  const handleResizeEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  /**
   * Sets up mouse event listeners for resize
   */
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleResizeDrag);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeDrag);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isDragging, handleResizeDrag, handleResizeEnd]);

  /**
   * Renders the appropriate editor based on type
   */
  const renderEditor = () => {
    switch (box.type) {
      case 'codemirror':
        return (
          <Suspense fallback={<div className="flex items-center justify-center h-full text-muted-foreground">Loading editor...</div>}>
            <CodeMirrorEditor
              value={box.content}
              language={box.language}
              onChange={(value) => onContentChange(box.id, value)}
            />
          </Suspense>
        );
      
      case 'markdown':
        return (
          <Suspense fallback={<div className="flex items-center justify-center h-full text-muted-foreground">Loading preview...</div>}>
            <MarkdownPreview content={box.content} />
          </Suspense>
        );
      
      case 'textarea':
      default:
        return (
          <textarea
            value={box.content}
            onChange={(e) => onContentChange(box.id, e.target.value)}
            placeholder="Enter or paste text here..."
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
      style={{ height: box.height ? `${box.height}px` : '400px' }}
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
              placeholder="Box label..."
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsEditingLabel(true)}
              className="px-2 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors flex-1 text-left min-w-0 truncate"
            >
              {box.label || 'Untitled Box'}
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
              title="Plain Text"
            >
              <RiFileTextLine className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleTypeChange('codemirror')}
              className={cn(
                "px-2 py-1 text-xs transition-colors",
                box.type === 'codemirror' ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              title="Code Editor"
            >
              <RiCodeSSlashLine className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleTypeChange('markdown')}
              className={cn(
                "px-2 py-1 text-xs transition-colors",
                box.type === 'markdown' ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              title="Markdown Preview"
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
              <option value="markdown">Markdown</option>
              <option value="plaintext">Plain Text</option>
            </select>
          )}

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className={cn(
              "px-2 py-1 rounded text-xs transition-colors",
              copySuccess ? "text-green-600" : "text-muted-foreground hover:text-foreground"
            )}
            title="Copy content"
          >
            {copySuccess ? <RiCheckLine className="w-4 h-4" /> : <RiFileCopyLine className="w-4 h-4" />}
          </button>

          {/* Delete Button */}
          <button
            onClick={() => onDelete(box.id)}
            className="px-2 py-1 rounded text-xs text-muted-foreground hover:text-red-600 transition-colors"
            title="Delete box"
          >
            <RiCloseLine className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-auto bg-background">
        {renderEditor()}
      </div>

      {/* Box Footer with Operations */}
      <div className="bg-muted border-t border-border px-3 py-2">
        <select
          onChange={(e) => {
            if (e.target.value) {
              onApplyOperation(box.id, e.target.value);
              e.target.value = ''; // Reset dropdown
            }
          }}
          className="px-2 py-1 text-xs border border-border rounded bg-background text-foreground"
          defaultValue=""
        >
          <option value="" disabled>Quick Operations...</option>
          <option value="format">Format JSON</option>
          <option value="minify">Minify JSON</option>
          <option value="unescape">Unescape String</option>
          <option value="remove-newlines">Remove Newlines</option>
          <option value="remove-tabs">Remove Tabs</option>
          <option value="remove-quotes">Remove Quotes</option>
        </select>
      </div>

      {/* Resize Handle */}
      <div
        className={cn(
          "h-2 bg-muted border-t border-border cursor-ns-resize hover:bg-accent transition-colors",
          isDragging && "bg-accent"
        )}
        onMouseDown={handleResizeStart}
        title="Drag to resize"
      />
    </div>
  );
};

export default EditorBox;

