import { API_ROUTES } from '../common/config';
import { CreatePostInput, Post, UpdatePostInput, SearchParams } from "../common/types"
import { getAuthToken } from './auth';

const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/**
 * Fetches all available categories and tags from the API.
 *
 * @returns {Promise<{ categories: string[]; tags: string[] }>} A promise that resolves to categories and tags
 * @throws {Error} Throws an error if the fetch operation fails
 */
export const getTaxonomy = async (): Promise<{ categories: string[]; tags: string[] }> => {
  const response = await fetch(API_ROUTES.TAXONOMY, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch taxonomy');
  }

  return response.json();
};

/**
 * Fetches a list of posts from the API with optional search parameters.
 *
 * @param {SearchParams} params - Search parameters including query, categories, tags, pagination, etc.
 * @returns {Promise<{ posts: Post[]; total: number }>} A promise that resolves to posts and total count
 * @throws {Error} Throws an error if the fetch operation fails
 */
export const getPosts = async (params: SearchParams = {}): Promise<{ posts: Post[]; total: number }> => {
  const searchParams = new URLSearchParams();
  
  if (params.query) searchParams.set('query', params.query);
  if (params.categories?.length) searchParams.set('categories', JSON.stringify(params.categories));
  if (params.tags?.length) searchParams.set('tags', JSON.stringify(params.tags));
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.getAll) searchParams.set('getAll', params.getAll.toString());

  const response = await fetch(`${API_ROUTES.POSTS}?${searchParams.toString()}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch posts');
  }

  return response.json();
};

export const getPost = async (id: string): Promise<Post> => {
  const response = await fetch(`${API_ROUTES.POSTS}?id=${id}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch post');
  }

  return response.json();
};

export const createPost = async (input: CreatePostInput): Promise<Post> => {
  const response = await fetch(API_ROUTES.POSTS, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error('Failed to create post');
  }

  return response.json();
};

export const updatePost = async (id: string, input: UpdatePostInput): Promise<Post> => {
  const response = await fetch(`${API_ROUTES.POSTS}?id=${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error('Failed to update post');
  }

  return response.json();
};

export const deletePost = async (id: string): Promise<void> => {
  const response = await fetch(`${API_ROUTES.POSTS}?id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to delete post');
  }
};
