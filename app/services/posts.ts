import { CreatePostInput, UpdatePostInput, SearchParams, Blog, BlogMeta } from "../common/types"
import { get, post, put, del } from './utils';

/**
 * Fetches all available categories and tags from the API.
 *
 * @returns {Promise<{ categories: string[]; tags: string[] }>} A promise that resolves to categories and tags
 * @throws {Error} Throws an error if the fetch operation fails
 */
export const getTaxonomy = async (): Promise<{ categories: string[]; tags: string[] }> => {
  return get<{ categories: string[]; tags: string[] }>('/api/taxonomy');
};

/**
 * Fetches a list of posts from the API with optional search parameters.
 *
 * @param {SearchParams} params - Search parameters including query, categories, tags, pagination, etc.
 * @returns {Promise<{ posts: BlogMeta[]; total: number }>} A promise that resolves to posts and total count
 * @throws {Error} Throws an error if the fetch operation fails
 */
export const getPosts = async (params: SearchParams = {}): Promise<{ blogs_info: BlogMeta[]; total: number }> => {
  // console.log("params", params)
  console.log("service: ", `/api/posts with params:`, params)
  
  return get<{ blogs_info: BlogMeta[]; total: number }>('/api/posts', { params });
};

/**
 * Fetches a single post by ID
 * @param id Post ID
 * @returns Promise with post data
 */
export const getPost = async (id: string): Promise<Blog> => {
  return get<Blog>('/api/posts', { params: { id } });
};

/**
 * Creates a new post
 * @param input Post creation input
 * @returns Promise with created post metadata
 */
export const createPost = async (input: CreatePostInput): Promise<BlogMeta> => {
  return post<BlogMeta>('/api/posts', input);
};

/**
 * Updates an existing post
 * @param id Post ID to update
 * @param input Post update input
 * @returns Promise with updated post metadata
 */
export const updatePost = async (id: string, input: UpdatePostInput): Promise<BlogMeta> => {
  return put<BlogMeta>('/api/posts', input, { params: { id } });
};

/**
 * Deletes a post by ID
 * @param id Post ID to delete
 * @returns Promise with void
 */
export const deletePost = async (id: string): Promise<void> => {
  return del<void>('/api/posts', { params: { id } });
};
