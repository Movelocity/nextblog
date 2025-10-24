import { useEffect, useRef, useState } from 'react';
import { getTaxonomy, updatePost } from '@/app/services/posts';
import { useEditPostStore } from '@/app/stores/EditPostStore';
import { useToast } from '@/app/components/layout/ToastHook';
import { TableOfContents } from '@/app/components/Posts/TableOfContents';
import { CategoryModal } from '@/app/components/CategoryTag/CategoryModal';
import PublishHint from '@/app/components/part/PubilshHint';
import CategoryTag from '@/app/components/CategoryTag';
import { AssetModal } from '@/app/components/Asset/AssetModal';
import { RiEdit2Line, RiEyeLine } from "react-icons/ri";
import cn from "classnames"
import { Markdown } from '@/app/components/Editor/Markdown';
import { useAuth } from '@/app/hooks/useAuth';

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
    post, lastSaved, loading,
    setIsSaving, setLastSaved, setLoading, setPostPublished, setPostTitle, setPostContent,
    setIsDirty, setError, setPostCategories, setPostTags
   } = useEditPostStore();

  const {isAuthenticated, openLoginModal} = useAuth();
  // const [isSaving, setIsSavingState] = useState(false);

  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const { showToast } = useToast();
  const handleSubmit = async () => {
    if(!isAuthenticated) {
      openLoginModal({
        onSuccess: () => {
          showToast('登录成功，请重新保存文章', 'info');
        }
      });
      
      return;
    }
    setLoading(true);
    try {
      if (id) {
        setIsSaving(true);
        console.log("submitting", post);
        await updatePost(id as string, post);
        setIsDirty(false);
        setLastSaved(new Date());
        setIsSaving(false);
        showToast('Post updated successfully', 'success');
      } else if (onCreate) {
        onCreate(post);
        showToast('Post created successfully', 'success');
      }  
    } catch (error) {
      console.error('Error updating post:', error);
      setError('Failed to update post. Please try again.');
      showToast('Failed to update post. Please try again.', 'error');
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
  }, [post.content, isPreview]);

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

  const onPublishToggle = () => {
    setPostPublished(!post.published);
    setIsDirty(true);
  }

  const onTitleChange = (title: string) => {
    setPostTitle(title);
    setIsDirty(true);
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] w-full py-6 pl-4 sm:pl-6 flex relative">
      <div className='flex flex-col h-full mb-64 flex-1'>
        {/* Title and Controls */}
        <div className="flex flex-col w-full border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-row items-center justify-between">
            <PublishHint published={post.published} onClick={onPublishToggle} />
          </div>
            
          <div className="pt-4">
            <input
              type="text"
              id="title"
              value={post.title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="block w-full px-0 text-4xl font-bold bg-transparent border-0 outline-none focus:ring-0 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Post title"
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center flex-wrap mt-4">
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center">
                {wordCount} words
              </span>
              <span className="italic">
                {lastSaved ? `Last saved ${lastSaved.toLocaleTimeString()}` : ''}
              </span>
            </div>

            <div className="flex items-center space-x-3 text-sm font-medium">
              <div className="flex gap-2 pr-4 border-r border-gray-300 dark:border-gray-600">
                {post.categories.map((category) => (
                  <CategoryTag
                    key={category}
                    category={category}
                    showLink={false}
                  />
                ))}
              </div>
              <button
                type="button"
                title="Edit categories and tags"
                onClick={() => setShowCategoryModal(true)}
                className="px-3 py-1.5 hover:text-blue-500 transition-colors"
                aria-label="Edit categories and tags"
              >
                Categories
              </button>

              <button
                onClick={handleSubmit}
                className={cn(
                  "px-3 py-1.5 hover:text-blue-500 transition-colors",
                  { "opacity-50 cursor-default": loading }
                )}
              >
                {'Save'}
              </button>
            </div>
          </div>
        </div>
        {/* Content Area */}
        <div className="flex-1 w-full mt-4">
          {isPreview ? (
            <Markdown content={post.content} />
          ) : (
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
          ) }
        </div>
      </div>

      {isPreview && <TableOfContents content={post.content} />}
      

      {/* Floating Buttons */}
      <div className="fixed bottom-8 right-4 sm:right-8 flex flex-col gap-4 z-50">
        {/* Asset Button */}
        {id && (
          <div className="flex items-center justify-center">
            <AssetModal blogId={id} />
          </div>
        )}

        {/* Preview Toggle Button */}
        <button
          type="button"
          onClick={() => setIsPreview(!isPreview)}
          className="flex items-center justify-center p-2 lg:p-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg transition-all duration-200 hover:scale-105"
          aria-label={isPreview ? 'Switch to edit mode' : 'Switch to preview mode'}
          title={isPreview ? 'Switch to edit mode' : 'Switch to preview mode'}
        >
          {isPreview ? <RiEdit2Line size={20} /> : <RiEyeLine size={20} />}
        </button>
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
  );
}; 