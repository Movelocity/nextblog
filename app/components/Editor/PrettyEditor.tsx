import { useEffect, useState, useRef } from 'react';
import { Markdown } from '@/app/components/Editor/Markdown';
import { TableOfContents } from '@/app/components/Posts/TableOfContents';
import classNames from 'classnames';
import { useEditPostStore } from '@/app/stores/EditPostStore';
import { CategoryModal } from '@/app/components/CategoryTag/CategoryModal';
import PublishHint from '@/app/components/part/PubilshHint';
import CategoryTag from '@/app/components/CategoryTag';
import { AssetModal } from '@/app/components/Asset/AssetModal';

type PrettyEditorProps = {
  id?: string;
  onSubmit: () => void;
  availableCategories: string[];
  availableTags: string[];
}

export const PrettyEditor = ({ 
  id,
  onSubmit,
  availableCategories,
  availableTags,
}: PrettyEditorProps) => {
  const { 
    post, setPostTitle, setPostContent, setPostPublished, 
    isSaving, lastSaved, loading, setIsDirty,
    setPostCategories, setPostTags
  } = useEditPostStore();
  const [isPreview, setIsPreview] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const wordCount = post.content.trim().match(/[\S]+/g)?.length || 0;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      // Store current scroll position and cursor position
      const scrollPos = window.scrollY;
      const selectionStart = textarea.selectionStart;
      const selectionEnd = textarea.selectionEnd;

      // Adjust height
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(500, textarea.scrollHeight+100)}px`;

      // Restore scroll position
      window.scrollTo(0, scrollPos);

      // Restore cursor position
      textarea.setSelectionRange(selectionStart, selectionEnd);
    };

    adjustHeight();
    
    // Observe textarea content changes
    const observer = new MutationObserver(adjustHeight);
    observer.observe(textarea, { 
      attributes: true, 
      characterData: true, 
      childList: true, 
      subtree: true 
    });

    return () => observer.disconnect();
  }, [post.content]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 's') {
          e.preventDefault();
          onSubmit();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSubmit]);

  const handleCategoryChange = (category: string) => {
    const newCategories = post.categories.includes(category)
      ? post.categories.filter(c => c !== category)
      : [...post.categories, category];
    setPostCategories(newCategories);
    setIsDirty(true);
  };

  const handleTagChange = (tag: string) => {
    const newTags = post.tags.includes(tag)
      ? post.tags.filter(t => t !== tag)
      : [...post.tags, tag];
    setPostTags(newTags);
    setIsDirty(true);
  };
  
  return (
    <div className="h-full post-content">
      <div className="flex flex-col h-full mb-64">
        {/* Title and Controls */}
        <div className="flex flex-col pb-4 max-w-[780px] w-full border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-row items-center justify-between">
            <PublishHint published={post.published} onClick={() => {
              setPostPublished(!post.published);
              setIsDirty(true);
            }} />
          </div>
            
          <div className="pt-4">
            <input
              type="text"
              id="title"
              value={post.title}
              onChange={(e) => {
                setPostTitle(e.target.value);
                setIsDirty(true);
              }}
              className="block w-full px-0 text-4xl font-bold bg-transparent border-0 outline-none focus:ring-0 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Post title"
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4">
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center">
                {wordCount} words
              </span>
              <span className="italic">
                {lastSaved ? `Last saved ${lastSaved.toLocaleTimeString()}` : ''}
              </span>
            </div>

            <div className="flex items-center space-x-3 text-sm font-medium">
              {post.categories && post.categories.length > 0 && (
                <div className="flex gap-2 pr-4 border-r border-gray-300 dark:border-gray-600">
                  {post.categories.map((category) => (
                    <CategoryTag
                      key={category}
                      category={category}
                      showLink={false}
                    />
                  ))}
                </div>
              )}
              <button
                type="button"
                title="Edit categories and tags"
                onClick={() => setShowCategoryModal(true)}
                className="px-3 py-1.5 hover:text-blue-500 transition-colors"
                aria-label="Edit categories and tags"
              >
                Categories
              </button>

              { id && <AssetModal blogId={id} /> }

              <button
                type="button"
                onClick={() => setIsPreview(!isPreview)}
                className="px-3 py-1.5 hover:text-blue-500 transition-colors"
              >
                {isPreview ? 'Edit' : 'Preview'}
              </button>
              <button
                onClick={onSubmit}
                className={classNames(
                  "px-3 py-1.5 hover:text-blue-500 transition-colors",
                  { "opacity-50 cursor-default": loading }
                )}
              >
                {'Save'}
              </button>
            </div>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="sticky top-24 mx-auto w-full z-50">
          <TableOfContents 
            content={post.content} 
            className='toc absolute min-w-[10rem] max-w-[15rem]'
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 max-w-[780px] w-full mt-4">
          <div className={classNames(isPreview ? 'hidden' : '')}>
            <textarea
              ref={textareaRef}
              id="content"
              value={post.content}
              onChange={(e) => {
                setPostContent(e.target.value);
                setIsDirty(true);
              }}
              className="w-full bg-transparent outline-none font-mono resize-none"
              placeholder="Write your post content here..."
              required
            />
          </div>
          <div className={classNames(!isPreview ? 'hidden' : '')}>
            <div className="prose max-w-none">
              <Markdown content={post.content} />
            </div>
          </div>
        </div>
      </div>

      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        availableCategories={availableCategories}
        availableTags={availableTags}
        selectedCategories={post.categories}
        selectedTags={post.tags}
        onCategoryChange={handleCategoryChange}
        onTagChange={handleTagChange}
      />
    </div>  
  )
};