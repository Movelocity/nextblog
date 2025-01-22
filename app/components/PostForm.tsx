import { useEffect, useState, useCallback } from 'react';
import { getTaxonomy } from '@/app/services/posts';
import { AutoFill } from './AutoFill';
import classNames from 'classnames';
import { Markdown } from './Markdown';
import { debounce } from 'lodash';
import { MdPreview, MdEdit } from 'react-icons/md';
import { calculateReadingTime } from '@/app/services/utils';

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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* title */}
        <div className="flex flex-col pb-2 border-b border-gray-200">
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="my-4 block w-full border-gray-300 outline-none bg-transparent text-3xl font-bold"
            required
          />
          <div className="flex flex-row items-center gap-2 text-sm text-gray-400">
            <span>
              {"[Editing mode]"}
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
              <label htmlFor="published" className="block text-sm text-gray-900">
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

        {/* content */}
        <div className="w-full">
          <div className={classNames(isPreview ? 'hidden' : '')}>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={30}
              className="mt-1 block w-full border-gray-300 outline-none font-mono"
              required
            />
          </div>
          <div className={classNames(!isPreview ? 'hidden' : '')}>
            <div className="mt-1 prose max-w-none">
              <Markdown content={content} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categories
            </label>
            <div className="flex gap-2 mb-2">
              <AutoFill
                value={categoryInput}
                onChange={setCategoryInput}
                onAdd={handleAddCategory}
                suggestions={availableCategories}
                placeholder="Add a category"
                className="flex-1"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <span
                  key={category}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full"
                >
                  {category}
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(category)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <AutoFill
                value={tagInput}
                onChange={setTagInput}
                onAdd={handleAddTag}
                suggestions={availableTags}
                placeholder="Add a tag"
                className="flex-1"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}; 