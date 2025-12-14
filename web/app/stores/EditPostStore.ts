import { create } from 'zustand';
import { PostEditorData } from '@/app/components/Editor/PostEditor';

export interface EditPostStore {
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  loading: boolean;
  error: string | null;
  setIsDirty: (isDirty: boolean) => void;
  setIsSaving: (isSaving: boolean) => void;
  setLastSaved: (lastSaved: Date | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  post: PostEditorData;
  setPost: (post: PostEditorData) => void;
  setPostTitle: (title: string) => void;
  setPostContent: (content: string) => void;
  setPostPublished: (published: boolean) => void;
  setPostCategories: (categories: string[]) => void;
  setPostTags: (tags: string[]) => void;
}

export const useEditPostStore = create<EditPostStore>()((set) => ({
  // Editor state
  isDirty: false,
  isSaving: false,
  lastSaved: null,
  loading: false,
  error: null,
  setIsDirty: (isDirty) => set({ isDirty }),
  setIsSaving: (isSaving) => set({ isSaving }),
  setLastSaved: (lastSaved) => set({ lastSaved }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Post state
  post: {
    title: '',
    content: '',
    published: false,
    categories: [],
    tags: [],
  },
  setPost: (post) => set({ post }),
  setPostTitle: (title) => set((state) => ({ post: { ...state.post, title } })),
  setPostContent: (content) => set((state) => ({ post: { ...state.post, content } })),
  setPostPublished: (published) => set((state) => ({ post: { ...state.post, published } })),
  setPostCategories: (categories) => set((state) => ({ post: { ...state.post, categories } })),
  setPostTags: (tags) => set((state) => ({ post: { ...state.post, tags } })),
}));
