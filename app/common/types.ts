export interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  published: boolean;
  categories: string[];
  tags: string[];
}

export type CreatePostInput = Omit<Post, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePostInput = Partial<Omit<Post, 'id' | 'createdAt' | 'updatedAt'>>;

export interface BlogMeta {
  id: string;  // Same as folder name
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  published: boolean;
  tags?: string[];
  categories?: string[];
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
  categories?: string[];
}

export interface UpdateBlogInput {
  title?: string;
  description?: string;
  content?: string;
  published?: boolean;
  tags?: string[];
  categories?: string[];
}

export interface BlogConfig {
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  published: boolean;
  tags: string[];
  categories: string[];
}

export interface BlogMetaCache {
  lastUpdated: string;
  blogs: Record<string, BlogMeta>;  // Key is blog id (folder name)
  categories: string[];  // List of all categories across all blogs
  tags: string[];       // List of all tags across all blogs
}

export interface SearchParams {
  query?: string;
  categories?: string[];
  tags?: string[];
  page?: number;
  limit?: number;
  pubOnly?: boolean;
}