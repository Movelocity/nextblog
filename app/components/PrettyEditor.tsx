import { useEffect, useState } from 'react';
import { Markdown } from './Markdown';
import { calculateReadingTime } from '../services/utils';
import classNames from 'classnames';

type PrettyEditorProps = {
  title: string;
  content: string;
  published: boolean;
  onChangeTitle: (title: string) => void;
  onChangeContent: (content: string) => void;
  onChangePublished: (published: boolean) => void;
  onSubmit: (e: any) => void;

  isSaving: boolean;
  lastSaved: Date | null;
  loading: boolean;
}

export const PrettyEditor = ({ 
  title, content, published, 
  onChangeTitle, onChangeContent, onChangePublished, onSubmit, 
  isSaving, lastSaved, loading 
}: PrettyEditorProps) => {
  const [isPreview, setIsPreview] = useState(false);
  const wordCount = content.trim().split(/\s+/).length;
  const readingTime = calculateReadingTime(content);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 's') {
          e.preventDefault();
          onSubmit(e);
        } else if (e.key === 'p') {
          e.preventDefault();
          setIsPreview(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content, onSubmit]);
  
  return (
    <form onSubmit={onSubmit} className="h-full">
      <div className="flex flex-col h-full">
        {/* Title and Controls */}
        <div className="flex flex-col pb-2 border-b border-gray-200 dark:border-gray-700 p-4">
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => onChangeTitle(e.target.value)}
            className="my-4 block w-full border-gray-300 outline-none bg-transparent text-3xl font-bold"
            placeholder="Post title"
            required
          />
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
            <span>
              {isPreview ? "[Preview mode]" : "[Editing mode]"}
            </span>
            <span>
              {wordCount} words · {readingTime} min read
            </span>
            <span>
              {isSaving ? 'Saving...' : lastSaved ? `Last saved ${lastSaved.toLocaleTimeString()}` : ''}
            </span>
            <button
              type="button"
              onClick={() => setIsPreview(!isPreview)}
              className="w-24 px-2 text-sm text-gray-500"
            >
              {isPreview ? 'Edit' : 'Preview'}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className={classNames("px-2 text-sm text-gray-500", { "opacity-50 cursor-not-allowed": loading })}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <div className="flex items-center">
              <label htmlFor="published" className="block text-sm text-gray-900 dark:text-gray-100">
                {'Publish: '}
              </label>
              <input
                type="checkbox"
                id="published"
                checked={published}
                onChange={(e) => onChangePublished(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4">
          <div className={classNames(isPreview ? 'hidden' : '')}>
            <textarea
              id="content"
              value={content}
              onChange={(e) => onChangeContent(e.target.value)}
              className="w-full h-full min-h-[500px] border-gray-300 outline-none font-mono resize-none"
              placeholder="Write your post content here..."
              required
            />
          </div>
          <div className={classNames(!isPreview ? 'hidden' : '')}>
            <div className="prose max-w-none">
              <Markdown content={content} />
            </div>
          </div>
        </div>
      </div>
    </form>  
  )
};