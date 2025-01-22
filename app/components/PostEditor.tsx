import { useEffect, useState } from 'react';
import { getTaxonomy, updatePost } from '@/app/services/posts';
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

  return (
    <div className="relative min-h-[calc(100vh-6rem)] mx-auto">
      <div className="mx-auto px-4 lg:px-0">
        <PrettyEditor 
          onSubmit={handleSubmit}
          availableCategories={availableCategories}
          availableTags={availableTags}
        />
      </div>
    </div>
  );
}; 