'use client';

import { useState, useCallback, lazy, Suspense } from 'react';
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
  onApplyOperation
}: EditorBoxProps) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);

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
    <div className="flex flex-col bg-card border border-border rounded-lg shadow-sm overflow-hidden">
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
      <div className="flex-1 min-h-[300px] max-h-[500px] overflow-auto bg-background">
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
    </div>
  );
};

export default EditorBox;

