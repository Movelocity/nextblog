export const POSTS_CONFIG = {
  POSTS_DIR: process.env.POSTS_DIR || 'posts',  // Directory where posts are stored
  MAX_POSTS_PER_PAGE: 10,
};

export interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  slug: string;
  published: boolean;
}

export type CreatePostInput = Omit<Post, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePostInput = Partial<Omit<Post, 'id' | 'createdAt' | 'updatedAt'>>; 