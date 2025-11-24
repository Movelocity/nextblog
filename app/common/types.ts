export interface BlogMeta {
  id: string;  // Same as folder name
  title: string;
  description: string;
  content?: string;
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

export type CreatePostInput = {
  title: string;
  content: string;
  published: boolean;
  categories: string[];
  tags: string[];
};

export type UpdatePostInput = {
  title?: string;
  content?: string;
  published?: boolean;
  categories?: string[];
  tags?: string[];
};

export interface CreateBlogInput {
  id: string;
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
  tags?: string[];
  categories?: string[];
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

export interface Asset {
  name: string;
  path: string;
  size: number;
  type: string;
  lastModified: string;
}

/**
 * 站点配置，存储在 site-config.json 中
 * 可以在运行时修改，无需重新构建
 */
export interface SiteConfig {
  icpInfo?: string;  // 备案信息
  siteName?: string;  // 站点名称
  siteDescription?: string;  // 站点描述
}