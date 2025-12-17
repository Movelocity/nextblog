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
  /** 是否启用高级搜索（返回匹配上下文，仅登录用户可用） */
  highlight?: boolean;
  /** 上下文窗口大小（默认 50） */
  contextSize?: number;
}

/**
 * 搜索匹配结果
 * 用于高级搜索时返回关键词的上下文信息
 */
export interface SearchMatch {
  /** 匹配字段名（title, content, description, data, tags） */
  field: string;
  /** 关键词所在的上下文文本 */
  context: string;
  /** 关键词在原文中的字符偏移位置 */
  offset: number;
}

/**
 * 文章搜索结果（支持高级搜索）
 */
export interface PostSearchResult extends BlogMeta {
  /** 匹配次数（仅高级搜索时返回） */
  matchCount?: number;
  /** 匹配详情（仅高级搜索时返回） */
  matches?: SearchMatch[];
}

/**
 * 文章搜索响应
 */
export interface PostSearchResponse {
  posts: PostSearchResult[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Asset {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  url: string;
  createdAt: string;
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