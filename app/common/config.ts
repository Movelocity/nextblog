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

export const BLOG_CONFIG = {
  ROOT_DIR: process.env.BLOG_ROOT_DIR || 'blogs',  // Root directory for all blogs
  META_FILE: 'meta.json',  // File to store metadata for all blogs
  CONTENT_FILE: 'index.md',  // Main content file for each blog
  ASSETS_DIR: 'assets',  // Directory for blog assets (images, etc.)
};

export interface BlogMeta {
  id: string;  // Same as folder name
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  published: boolean;
  tags?: string[];
}

export interface BlogContent {
  content: string;
  assets: string[];  // List of asset files in the blog folder
}

export interface Blog extends BlogMeta {
  content: string;
  assets: string[];
}

export interface CreateBlogInput {
  id: string;  // Will be used as folder name
  title: string;
  description: string;
  content: string;
  published?: boolean;
  tags?: string[];
}

export interface UpdateBlogInput {
  title?: string;
  description?: string;
  content?: string;
  published?: boolean;
  tags?: string[];
}

export interface BlogMetaCache {
  lastUpdated: string;
  blogs: Record<string, BlogMeta>;  // Key is blog id (folder name)
}

export const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
export const JWT_EXPIRES_IN = '24h';

export const ADMIN_CREDENTIALS = {
    email: 'hollway@example.com',
    password: 'hollway123'
};

export const API_ROUTES = {
    LOGIN: '/api/auth/login',
    POSTS: '/api/posts'
} as const; 