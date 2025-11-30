import { CreatePostInput, UpdatePostInput, SearchParams, Blog, BlogMeta } from "../common/types"
import { get, post, put, del } from './utils';

/**
 * Fetches all available categories and tags from the API.
 *
 * @returns {Promise<{ categories: string[]; tags: string[] }>} A promise that resolves to categories and tags
 * @throws {Error} Throws an error if the fetch operation fails
 */
export const getTaxonomy = async (): Promise<{ categories: string[]; tags: string[] }> => {
  // Go 后端使用独立的 /categories 和 /tags 端点
  // const [categoriesData, tagsData] = await Promise.all([
  //   get<Array<{ name: string; count: number }>>('/categories'),
  //   get<Array<{ name: string; count: number }>>('/tags')
  // ]);
  
  // return {
  //   categories: categoriesData.map(c => c.name),
  //   tags: tagsData.map(t => t.name)
  // };
  return {
    categories: [],
    tags: []
  }
};

/**
 * Fetches a list of posts from the API with optional search parameters.
 *
 * @param {SearchParams} params - Search parameters including query, categories, tags, pagination, etc.
 * @returns {Promise<{ posts: BlogMeta[]; total: number }>} A promise that resolves to posts and total count
 * @throws {Error} Throws an error if the fetch operation fails
 */
export const getPosts = async (params: SearchParams = {}): Promise<{ blogs_info: BlogMeta[]; total: number }> => {
  console.log("service: ", `/posts with params:`, params);
  
  // 转换参数以匹配 Go 后端的期望格式
  const goParams: any = {
    page: params.page || 1,
    pageSize: params.limit || 10,
  };
  
  // 如果有 pubOnly 参数，转换为 published
  if (params.pubOnly !== undefined) {
    goParams.published = params.pubOnly;
  }
  
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
