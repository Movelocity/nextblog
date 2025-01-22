import { useEffect, useState } from 'react';
import { getTaxonomy, updatePost } from '@/app/services/posts';
import classNames from 'classnames';

import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { PostSidePanel } from './PostSidePanel';
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
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-6rem)] mx-auto">
      {/* Left Sidebar - Categories & Tags */}
      <div className="fixed top-24 left-4 w-72 hidden lg:block">
        <PostSidePanel
          availableCategories={availableCategories}
          availableTags={availableTags}
        />
      </div>

      {/* Mobile Left Sidebar */}
      <div
        className={classNames(
          "fixed lg:hidden left-0 top-0 h-screen w-72 transform transition-transform duration-300 ease-in-out z-30",
          {
            "-translate-x-full": !showLeftSidebar,
            "translate-x-0": showLeftSidebar
          },
          "bg-white dark:bg-gray-800 pt-16"
        )}
      >
        <PostSidePanel
          availableCategories={availableCategories}
          availableTags={availableTags}
        />
      </div>

      {/* Mobile Toggle Button */}
      <button
        onClick={() => setShowLeftSidebar(!showLeftSidebar)}
        className="lg:hidden fixed left-0 top-1/2 -translate-y-1/2 p-2 z-40 bg-white dark:bg-gray-800 rounded-r-lg shadow-lg"
        aria-label="Toggle categories and tags panel"
      >
        {showLeftSidebar ? <FaChevronLeft /> : <FaChevronRight />}
      </button>

      {/* Main Content */}
      <div className="mx-auto px-4 lg:px-0 lg:ml-80">
        <PrettyEditor onSubmit={handleSubmit} />
      </div>
    </div>
  );
}; 