import { useEffect, useState, useRef } from 'react';
import { Markdown } from '@/app/components/Markdown';
import { TableOfContents } from '@/app/components/TableOfContents';
import classNames from 'classnames';
import { useEditPostStore } from '@/app/stores/EditPostStore';
import { FaTags } from 'react-icons/fa';
import Modal from '@/app/components/Modal';
import PublishHint from '@/app/components/PubilshHint';
import Link from 'next/link';

type PrettyEditorProps = {
  onSubmit: () => void;
  availableCategories: string[];
  availableTags: string[];
}

export const PrettyEditor = ({ 
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
  const wordCount = post.content.trim().match(/[\S]+/g)?.length || 0; // 更新 wordCount 计算方式
  const [newCategory, setNewCategory] = useState('');
  const [newTag, setNewTag] = useState('');
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
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

  // const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();
  //   onSubmit();
  // }

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

  const handleAddCategory = () => {
    const trimmedCategory = newCategory.trim();
    if (trimmedCategory && !availableCategories.includes(trimmedCategory) && !customCategories.includes(trimmedCategory)) {
      handleCategoryChange(trimmedCategory);
      setCustomCategories(prev => [...prev, trimmedCategory]);
      setNewCategory('');
    }
  };

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !availableTags.includes(trimmedTag) && !customTags.includes(trimmedTag)) {
      handleTagChange(trimmedTag);
      setCustomTags(prev => [...prev, trimmedTag]);
      setNewTag('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, handler: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handler();
    }
  };
  
  return (
    <div className="h-full post-content">
      <div className="flex flex-col h-full mb-64">
        {/* Title and Controls */}
        <div className="flex flex-col pb-4 max-w-[780px] w-full border-b border-gray-200 dark:border-gray-700">
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

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setShowCategoryModal(true)}
                className="p-1.5 group"
                aria-label="Edit categories and tags"
              >
                <FaTags className="w-4 h-4 group-hover:text-blue-500" />
              </button>
              {post.categories && post.categories.length > 0 && (
                <div className="text-sm font-medium text-gray-700 dark:text-gray-200 rounded-md flex items-center">
                  <div className="flex gap-2">
                    {post.categories.map((category) => (
                      <Link
                        key={category}
                        href={`/posts/category/${category}`}
                        className="hover:text-blue-600 dark:hover:text-blue-500 transition-colors"
                      >
                        {category}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <PublishHint published={post.published} onClick={() => {
                setPostPublished(!post.published);
                setIsDirty(true);
              }} />
              <button
                type="button"
                onClick={() => setIsPreview(!isPreview)}
                className="px-3 py-1.5 text-sm font-medium hover:text-blue-500 transition-colors"
              >
                {isPreview ? 'Edit' : 'Preview'}
              </button>
              <button
                onClick={onSubmit}
                className={classNames(
                  "px-3 py-1.5 text-sm font-medium hover:text-blue-500 transition-colors",
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
            className='hidden md:block absolute min-w-[12rem] max-w-[15rem]'
            style={{ insetInlineStart: '800px' }}
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

      {/* Category Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        size="md"
      >
        <div className="space-y-6 p-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Categories</h3>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, handleAddCategory)}
              placeholder="Type a category and press Enter"
              className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-md outline-none"
              aria-label="New category name"
            />
            <div className="flex flex-wrap gap-1">
              {availableCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  type="button"
                  className={classNames(
                    "px-2 text-sm font-medium rounded-full transition-colors",
                    post.categories.includes(category)
                      ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  )}
                >
                  {category}
                </button>
              ))}
              {customCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  type="button"
                  className={classNames(
                    "px-2 text-sm font-medium rounded-full transition-colors border-2",
                    post.categories.includes(category)
                      ? "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 dark:text-white">Tags</h3>
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, handleAddTag)}
              placeholder="Type a tag and press Enter"
              className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="New tag name"
            />
            <div className="flex flex-wrap gap-1">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagChange(tag)}
                  type="button"
                  className={classNames(
                    "px-2 text-sm font-medium rounded-full transition-colors",
                    post.tags.includes(tag)
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  )}
                >
                  {tag}
                </button>
              ))}
              {customTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagChange(tag)}
                  type="button"
                  className={classNames(
                    "px-2 text-sm font-medium rounded-full transition-colors border-2",
                    post.tags.includes(tag)
                      ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-200"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>  
  )
};