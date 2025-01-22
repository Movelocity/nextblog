import { useEffect, useState, useCallback } from 'react';
import { getTaxonomy } from '@/app/services/posts';
import { AutoFill } from './AutoFill';
import classNames from 'classnames';
import { Markdown } from './Markdown';
import { debounce } from 'lodash';
import { MdPreview, MdEdit } from 'react-icons/md';
import { FaBars, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { calculateReadingTime } from '@/app/services/utils';
import { PostSidePanel } from './PostSidePanel';
import { TableOfContents } from './TableOfContents';

export interface PostFormData {
  title: string;
  content: string;
  published: boolean;
  categories: string[];
  tags: string[];
}

interface PostFormProps {
  initialData?: PostFormData;
  onSubmit: (data: PostFormData) => Promise<void>;
  submitLabel: string;
  onCancel?: () => void;
  onChange?: () => void;
}

export const PostForm = ({
  initialData,
  onSubmit,
  submitLabel,
  onCancel,
  onChange,
}: PostFormProps) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [content, setContent] = useState(initialData?.content ?? '');
  const [published, setPublished] = useState(initialData?.published ?? false);
  const [categoryInput, setCategoryInput] = useState('');
  const [categories, setCategories] = useState<string[]>(initialData?.categories ?? []);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Autosave functionality. Currently disabled, but reserved for future use.
  // Don't submit all the time at dev environment.
  // const debouncedSave = useCallback(
  //   debounce(async (data: PostFormData) => {
  //     try {
  //       setIsSaving(true);
  //       await onSubmit(data);
  //       setLastSaved(new Date());
  //     } catch (error) {
  //       console.error('Error autosaving:', error);
  //     } finally {
  //       setIsSaving(false);
  //     }
  //   }, 2000),
  //   [onSubmit]
  // );
  // useEffect(() => {
  //   if (initialData) {
  //     debouncedSave({
  //       title,
  //       content,
  //       published,
  //       categories,
  //       tags,
  //     });
  //   }
  //   onChange?.();
  // }, [title, content, published, categories, tags]);

  useEffect(() => {
    const loadTaxonomy = async () => {
      try {
        const { categories, tags } = await getTaxonomy();
        setAvailableCategories(categories);
        setAvailableTags(tags);
      } catch (error) {
        console.error('Error loading taxonomy:', error);
      }
    };
    loadTaxonomy();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 's') {
          e.preventDefault();
          handleSubmit(e as any);
        } else if (e.key === 'p') {
          e.preventDefault();
          setIsPreview(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit({
        title,
        content,
        published,
        categories,
        tags,
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    if (categoryInput.trim() && !categories.includes(categoryInput.trim())) {
      setCategories([...categories, categoryInput.trim()]);
      setCategoryInput('');
    }
  };

  const handleRemoveCategory = (category: string) => {
    setCategories(categories.filter(c => c !== category));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const wordCount = content.trim().split(/\s+/).length;
  const readingTime = calculateReadingTime(content);

  // Close sidebars when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (window.innerWidth < 768) {
        if (!target.closest('.sidebar-left') && !target.closest('.sidebar-toggle-left')) {
          setShowLeftSidebar(false);
        }
        if (!target.closest('.sidebar-right') && !target.closest('.sidebar-toggle-right')) {
          setShowRightSidebar(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative flex h-[calc(100vh-4rem)]">
      {/* Left Sidebar Toggle Button - Mobile */}
      <button
        onClick={() => setShowLeftSidebar(!showLeftSidebar)}
        className="sidebar-toggle-left md:hidden fixed left-0 top-1/2 -translate-y-1/2 p-2 z-10 bg-white dark:bg-gray-800 rounded-r-lg shadow-lg"
        aria-label="Toggle categories and tags panel"
      >
        {showLeftSidebar ? <FaChevronLeft /> : <FaChevronRight />}
      </button>

      {/* Left Sidebar - Categories & Tags */}
      <div
        className={classNames(
          "sidebar-left fixed md:static left-0 top-0 h-full w-64 transform transition-transform duration-300 ease-in-out z-20",
          {
            "-translate-x-full md:translate-x-0": !showLeftSidebar,
            "translate-x-0": showLeftSidebar
          },
          "bg-white dark:bg-gray-800 md:bg-transparent md:dark:bg-transparent pt-16 md:pt-0"
        )}
      >
        <PostSidePanel
          categoryInput={categoryInput}
          setCategoryInput={setCategoryInput}
          categories={categories}
          handleAddCategory={handleAddCategory}
          handleRemoveCategory={handleRemoveCategory}
          tagInput={tagInput}
          setTagInput={setTagInput}
          tags={tags}
          handleAddTag={handleAddTag}
          handleRemoveTag={handleRemoveTag}
          availableCategories={availableCategories}
          availableTags={availableTags}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-0">
        <form onSubmit={handleSubmit} className="h-full">
          <div className="flex flex-col h-full">
            {/* Title and Controls */}
            <div className="flex flex-col pb-2 border-b border-gray-200 dark:border-gray-700 p-4">
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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
                  onClick={handleSubmit}
                  className={classNames("px-2 text-sm text-gray-500", { "opacity-50 cursor-not-allowed": loading })}
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <div className="flex items-center">
                  <label htmlFor="published" className="block text-sm text-gray-900 dark:text-gray-100">
                    {initialData ? 'Publish: ' : 'Publish immediately: '}
                  </label>
                  <input
                    type="checkbox"
                    id="published"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
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
                  onChange={(e) => setContent(e.target.value)}
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
      </div>

      {/* Right Sidebar Toggle Button - Mobile */}
      <button
        onClick={() => setShowRightSidebar(!showRightSidebar)}
        className="sidebar-toggle-right md:hidden fixed right-0 top-1/2 -translate-y-1/2 p-2 z-10 bg-white dark:bg-gray-800 rounded-l-lg shadow-lg"
        aria-label="Toggle table of contents"
      >
        {showRightSidebar ? <FaChevronRight /> : <FaChevronLeft />}
      </button>

      {/* Right Sidebar - Table of Contents */}
      <div
        className={classNames(
          "sidebar-right fixed md:static right-0 top-0 h-full w-64 transform transition-transform duration-300 ease-in-out z-20",
          {
            "translate-x-full md:translate-x-0": !showRightSidebar,
            "translate-x-0": showRightSidebar
          },
          "bg-white dark:bg-gray-800 md:bg-transparent md:dark:bg-transparent pt-16 md:pt-0"
        )}
      >
        <TableOfContents content={content} />
      </div>
    </div>
  );
}; 