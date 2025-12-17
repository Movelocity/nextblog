import { CreatePostInput, UpdatePostInput, SearchParams, Blog, BlogMeta, PostSearchResult, PostSearchResponse } from "../common/types"
import { get, post, put, del } from './utils';

/**
 * Fetches all available categories and tags from the API.
 *
 * @returns {Promise<{ categories: string[]; tags: string[] }>} A promise that resolves to categories and tags
 * @throws {Error} Throws an error if the fetch operation fails
 */
export const getTaxonomy = async (): Promise<{ categories: string[]; tags: string[] }> => {
  // Go 后端使用独立的 /categories 和 /tags 端点
  const [categoriesData, tagsData] = await Promise.all([
    get<Array<{ name: string; count: number }>>('/categories'),
    get<Array<{ name: string; count: number }>>('/tags')
  ]);
  
  return {
    categories: categoriesData.map(c => c.name),
    tags: tagsData.map(t => t.name)
  };
  // return {
  //   categories: [],
  //   tags: []
  // }
};

/**
 * Fetches a list of posts from the API with optional search parameters.
 *
 * @param {SearchParams} params - Search parameters including query, categories, tags, pagination, etc.
 * @returns {Promise<{ posts: BlogMeta[]; total: number }>} A promise that resolves to posts and total count
 * @throws {Error} Throws an error if the fetch operation fails
 * 
 * /api/posts/search?keyword=xxx&page=1&pageSize=10
 */
export const getPosts = async (params: SearchParams = {}): Promise<{ blogs_info: BlogMeta[]; total: number }> => {
  // 转换参数以匹配 Go 后端的期望格式
  const goParams: any = {
    page: params.page || 1,
    pageSize: params.limit || 10,
  };
  
  // Go 后端期望的响应格式
  interface GoPostListResponse {
    posts: BlogMeta[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }
  
  const response = await get<GoPostListResponse>('/posts', { params: goParams });
  
  // 适配响应格式
  return {
    blogs_info: response.posts,
    total: response.total
  };
};

/**
 * 搜索文章（普通搜索）
 * GET /api/posts/search?keyword=xxx&page=1&pageSize=10
 *
 * @param {SearchParams} params - 搜索参数，包括关键词、分页等
 * @returns {Promise<{ blogs_info: BlogMeta[]; total: number }>} 返回文章列表和总数
 * @throws {Error} 请求失败时抛出错误
 * 
 * 搜索范围会根据后端登录状态自动调整：
 * - 未登录：仅搜索已发布文章
 * - 已登录：搜索所有文章（包括草稿）
 */
export const searchPosts = async (params: SearchParams = {}): Promise<{ blogs_info: BlogMeta[]; total: number }> => {
  console.log("service: ", `/posts with params:`, params);
  
  // 转换参数以匹配 Go 后端的期望格式
  const goParams: Record<string, string | number | boolean | undefined> = {
    keyword: params.query || undefined,
    page: params.page || 1,
    pageSize: params.limit || 10,
  };
  
  // Go 后端期望的响应格式
  interface GoPostListResponse {
    posts: BlogMeta[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }
  
  const response = await get<GoPostListResponse>('/posts/search', { params: goParams });
  
  // 适配响应格式
  return {
    blogs_info: response.posts,
    total: response.total
  };
};

/**
 * 高级搜索文章（返回匹配上下文）
 * GET /api/posts/search?keyword=xxx&page=1&pageSize=10&highlight=true&contextSize=50
 *
 * @param {SearchParams} params - 搜索参数，包括关键词、分页、上下文窗口大小等
 * @returns {Promise<PostSearchResponse>} 返回带匹配上下文的文章列表
 * @throws {Error} 请求失败时抛出错误
 * 
 * 注意：高级搜索仅登录用户可用，未登录时 highlight 参数会被忽略
 */
export const searchPostsAdvanced = async (params: SearchParams = {}): Promise<PostSearchResponse> => {
  console.log("service: ", `/posts/search (advanced) with params:`, params);
  
  // 转换参数以匹配 Go 后端的期望格式
  const goParams: Record<string, string | number | boolean | undefined> = {
    keyword: params.query || undefined,
    page: params.page || 1,
    pageSize: params.limit || 10,
    highlight: true,
    contextSize: params.contextSize || 50,
  };
  
  return get<PostSearchResponse>('/posts/search', { params: goParams });
};


/**
 * Fetches a single post by ID
 * @param id Post ID
 * @returns Promise with post data
 */
export const getPost = async (id: string): Promise<Blog> => {
  // Go 后端使用 /posts/:id 格式
  return get<Blog>(`/posts/${id}`);
};

/**
 * Creates a new post
 * @param input Post creation input
 * @returns Promise with created post metadata
 */
export const createPost = async (input: CreatePostInput): Promise<BlogMeta> => {
  // Go 后端返回完整的 Post 对象，包含 BlogMeta 的所有字段
  return post<BlogMeta>('/posts', input);
};

/**
 * Updates an existing post
 * @param id Post ID to update
 * @param input Post update input
 * @returns Promise with updated post metadata
 */
export const updatePost = async (id: string, input: UpdatePostInput): Promise<BlogMeta> => {
  // Go 后端使用 PUT /posts/:id
  return put<BlogMeta>(`/posts/${id}`, input);
};

/**
 * Deletes a post by ID
 * @param id Post ID to delete
 * @returns Promise with void
 */
export const deletePost = async (id: string): Promise<void> => {
  // Go 后端使用 DELETE /posts/:id
  await del<{ message: string }>(`/posts/${id}`);
};
