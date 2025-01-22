import { useEffect, useState } from 'react';
import { Markdown } from './Markdown';
import { TableOfContents } from './TableOfContents';
import classNames from 'classnames';
import { useEditPostStore } from '../stores/EditPostStore';
import { FaTags } from 'react-icons/fa';
import Modal from './Modal';

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
  const wordCount = post.content.trim().split(/\s+/).length;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 's') {
          e.preventDefault();
          const form = document.querySelector('form');
          if (form) {
            onSubmit();
          }
        } else if (e.key === 'p') {
          e.preventDefault();
          setIsPreview(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSubmit]);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit();
  }

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
    <form 
      onSubmit={handleSave} 
      className="h-full"
      style={{ paddingInlineStart: '20rem' }}
    >
      <div className="flex flex-col h-full">
        {/* Title and Controls */}
        <div className="flex flex-col pb-4 max-w-[780px] w-full">
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
              <span className="flex items-center px-2.5 ml-1">
                {isPreview ? "Preview" : "Edit"}
              </span>
              <span className="flex items-center">
                {wordCount} words
              </span>
              <span className="italic">
                {isSaving ? 'Saving...' : lastSaved ? `Last saved ${lastSaved.toLocaleTimeString()}` : ''}
              </span>
            </div>

            <div className="flex items-center space-x-3 gap-4">
              <button
                type="button"
                onClick={() => setShowCategoryModal(true)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors flex items-center gap-2"
                aria-label="Edit categories and tags"
              >
                <FaTags className="w-4 h-4" />
                <span>Categories & Tags</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPreview(!isPreview)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                {isPreview ? 'Edit' : 'Preview'}
              </button>

              <div className="flex items-center space-x-2 pl-2 border-l border-gray-200 dark:border-gray-700">
                <label
                  htmlFor="published"
                  className="text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  Published
                </label>
                <input
                  type="checkbox"
                  id="published"
                  checked={post.published}
                  onChange={(e) => {
                    setPostPublished(e.target.checked);
                    setIsDirty(true);
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 border-gray-300 rounded transition-colors cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={onSubmit}
                className={classNames(
                  "px-3 py-1.5 text-sm font-medium hover:text-blue-500 rounded-md transition-colors",
                  { "opacity-50 cursor-not-allowed": loading }
                )}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="sticky top-24 mx-auto w-full z-50">
          <TableOfContents 
            content={post.content} 
            className='absolute min-w-[10rem] max-w-[15rem]'
            style={{ insetInlineStart: '800px' }}
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 max-w-[780px] w-full mt-4">
          <div className={classNames(isPreview ? 'hidden' : '')}>
            <textarea
              id="content"
              value={post.content}
              onChange={(e) => {
                setPostContent(e.target.value);
                setIsDirty(true);
              }}
              style={{
                minHeight: '500px',
                height: '1080px',
              }}
              className="w-full h-full bg-transparent outline-none font-mono resize-none"
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
        title="Categories & Tags"
        size="md"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  type="button"
                  className={classNames(
                    "px-3 py-1.5 text-sm font-medium rounded-full transition-colors",
                    post.categories.includes(category)
                      ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagChange(tag)}
                  type="button"
                  className={classNames(
                    "px-3 py-1.5 text-sm font-medium rounded-full transition-colors",
                    post.tags.includes(tag)
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </form>  
  )
};