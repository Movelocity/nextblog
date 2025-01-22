import { useEffect, useState } from 'react';
import { getTaxonomy } from '@/app/services/posts';
import classNames from 'classnames';

import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { PostSidePanel } from './PostSidePanel';
import { TableOfContents } from './TableOfContents';
import { PrettyEditor } from './PrettyEditor';
export interface PostEditorData {
  title: string;
  content: string;
  published: boolean;
  categories: string[];
  tags: string[];
}

interface PostEditorProps {
  initialData?: PostEditorData;
  onSubmit: (data: PostEditorData) => Promise<void>;
}

export const PostEditor = ({
  initialData,
  onSubmit
}: PostEditorProps) => {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [content, setContent] = useState(initialData?.content ?? '');
  const [published, setPublished] = useState(initialData?.published ?? false);

  const [categoryInput, setCategoryInput] = useState('');
  const [categories, setCategories] = useState<string[]>(initialData?.categories ?? []);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);

  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log("content", content);
    try {
      setIsSaving(true);
      await onSubmit({
        title,
        content,
        published,
        categories,
        tags,
      });
      setLastSaved(new Date());
      setIsSaving(false);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

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
        <PrettyEditor
          title={title}
          content={content}
          published={published}
          onChangeTitle={setTitle}
          onChangeContent={setContent}
          onChangePublished={setPublished}
          onSubmit={handleSubmit}
          isSaving={isSaving}
          lastSaved={lastSaved}
          loading={loading}
        />
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