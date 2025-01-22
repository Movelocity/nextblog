import { useEffect, useState } from 'react';
import { getTaxonomy, updatePost } from '@/app/services/posts';
import classNames from 'classnames';

import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { PostSidePanel } from './PostSidePanel';
import { TableOfContents } from './TableOfContents';
import { PrettyEditor } from './PrettyEditor';
import { useEditPostStore } from '@/app/stores/EditPostStore';

export interface PostEditorData {
  title: string;
  content: string;
  published: boolean;
  categories: string[];
  tags: string[];
}

interface PostEditorProps {
  id?: string;
  onCreate?: (data: PostEditorData) => void;
}

export const PostEditor = ({ id, onCreate }: PostEditorProps) => {
  const { 
    post, setIsSaving, setLastSaved, setLoading,
    setIsDirty, setError
   } = useEditPostStore();

  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (id) {
        setIsSaving(true);
        console.log("submitting", post);
        await updatePost(id as string, post);
        setIsDirty(false);
        setLastSaved(new Date());
        setIsSaving(false);
      } else if (onCreate) {
        onCreate(post);
      }  
    } catch (error) {
      console.error('Error updating post:', error);
      setError('Failed to update post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          availableCategories={availableCategories}
          availableTags={availableTags}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-0">
        <PrettyEditor
          onSubmit={handleSubmit}
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
        <TableOfContents content={post.content} />
      </div>
    </div>
  );
}; 