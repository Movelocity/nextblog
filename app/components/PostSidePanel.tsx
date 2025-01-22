import { FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { AutoFill } from './AutoFill';
import classNames from 'classnames';
import { useState } from 'react';
import { useEditPostStore } from '../stores/EditPostStore';

interface PostSidePanelProps {
  availableCategories: string[];
  availableTags: string[];
  className?: string;
}

export const PostSidePanel = ({
  availableCategories,
  availableTags,
  className
}: PostSidePanelProps) => {
  const [isCategoriesCollapsed, setIsCategoriesCollapsed] = useState(false);
  const [isTagsCollapsed, setIsTagsCollapsed] = useState(false);
  const [categoryInput, setCategoryInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  const { post, setPostCategories, setPostTags } = useEditPostStore();
  const { categories, tags } = post;

  const handleAddCategory = () => {
    if (categoryInput.trim() && !categories.includes(categoryInput.trim())) {
      setPostCategories([...categories, categoryInput.trim()]);
      setCategoryInput('');
    }
  };

  const handleRemoveCategory = (category: string) => {
    setPostCategories(categories.filter(c => c !== category));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setPostTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setPostTags(tags.filter(t => t !== tag));
  };

  return (
    <div className={classNames("p-4 space-y-6", className)}>
      {/* Categories Section */}
      <div>
        <div 
          className="flex items-center justify-between mb-2 cursor-pointer select-none"
          onClick={() => setIsCategoriesCollapsed(!isCategoriesCollapsed)}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Categories
          </h3>
          {isCategoriesCollapsed ? (
            <FaChevronRight className="w-4 h-4 text-gray-300" />
          ) : (
            <FaChevronDown className="w-4 h-4 text-gray-300" />
          )}
        </div>
        
        {!isCategoriesCollapsed && (
          <div className="space-y-3">
            <AutoFill
              value={categoryInput}
              onChange={setCategoryInput}
              onAdd={handleAddCategory}
              suggestions={availableCategories}
              placeholder="Add a category"
              className="w-full"
            />
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <span
                  key={category}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {category}
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(category)}
                    className="text-blue-600 hover:text-blue-800"
                    aria-label={`Remove category ${category}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tags Section */}
      <div>
        <div 
          className="flex items-center justify-between mb-2 cursor-pointer select-none"
          onClick={() => setIsTagsCollapsed(!isTagsCollapsed)}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tags
          </h3>
          {isTagsCollapsed ? (
            <FaChevronRight className="w-4 h-4 text-gray-300" />
          ) : (
            <FaChevronDown className="w-4 h-4 text-gray-300" />
          )}
        </div>
        
        {!isTagsCollapsed && (
          <div className="space-y-3">
            <AutoFill
              value={tagInput}
              onChange={setTagInput}
              onAdd={handleAddTag}
              suggestions={availableTags}
              placeholder="Add a tag"
              className="w-full"
            />
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-green-600 hover:text-green-800"
                    aria-label={`Remove tag ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 