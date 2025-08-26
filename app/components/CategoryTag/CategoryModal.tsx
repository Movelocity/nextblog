import { useState } from 'react';
import Modal from '@/app/components/Modal';
import CategoryTag from './index';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableCategories: string[];
  availableTags: string[];
  selectedCategories: string[];
  selectedTags: string[];
  onCategoryChange: (category: string) => void;
  onTagChange: (tag: string) => void;
}

export const CategoryModal = ({
  isOpen,
  onClose,
  availableCategories,
  availableTags,
  selectedCategories,
  selectedTags,
  onCategoryChange,
  onTagChange,
}: CategoryModalProps) => {
  const [newCategory, setNewCategory] = useState('');
  const [newTag, setNewTag] = useState('');
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);

  const handleAddCategory = () => {
    const trimmedCategory = newCategory.trim();
    if (trimmedCategory && !availableCategories.includes(trimmedCategory) && !customCategories.includes(trimmedCategory)) {
      onCategoryChange(trimmedCategory);
      setCustomCategories(prev => [...prev, trimmedCategory]);
      setNewCategory('');
    }
  };

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !availableTags.includes(trimmedTag) && !customTags.includes(trimmedTag)) {
      onTagChange(trimmedTag);
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      className="space-y-6 p-4"
    >
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Categories</h3>
        <input
          name="newCategory"
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, handleAddCategory)}
          placeholder="Type a category and press Enter"
          className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          aria-label="New category name"
        />
        <div className="flex flex-wrap gap-2">
          {availableCategories.map((category) => (
            <CategoryTag
              key={category}
              category={category}
              onClick={() => onCategoryChange(category)}
              showLink={false}
              selected={selectedCategories.includes(category)}
            />
          ))}
          {customCategories.map((category) => (
            <CategoryTag
              key={category}
              category={category}
              onClick={() => onCategoryChange(category)}
              showLink={false}
              selected={selectedCategories.includes(category)}
              className="border-2"
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Tags</h3>
        <input
          name="newTag"
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, handleAddTag)}
          placeholder="Type a tag and press Enter"
          className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          aria-label="New tag name"
        />
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => (
            <CategoryTag
              key={tag}
              category={tag}
              onClick={() => onTagChange(tag)}
              showLink={false}
              selected={selectedTags.includes(tag)}
              className="bg-green-100 text-green-800 hover:bg-green-200"
            />
          ))}
          {customTags.map((tag) => (
            <CategoryTag
              key={tag}
              category={tag}
              onClick={() => onTagChange(tag)}
              showLink={false}
              selected={selectedTags.includes(tag)}
              className="bg-green-100 text-green-800 hover:bg-green-200 border-2 border-green-200"
            />
          ))}
        </div>
      </div>
    </Modal>
  );
}; 