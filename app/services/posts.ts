import { API_ROUTES } from '../common/config';
import { CreatePostInput, Post, UpdatePostInput } from "../common/types"
import { getAuthToken } from './auth';

const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/**
 * Fetches a list of posts from the API.
 *
 * @param {number} [page=1] - The page number to retrieve. Defaults to 1.
 * @param {number} [limit=10] - The number of posts to retrieve per page. Defaults to 10.
 * @param {boolean} [getAll] - If false, fetch only published posts. If true, include draft posts.
 * @returns {Promise<Post[]>} A promise that resolves to an array of Post objects.
 * @throws {Error} Throws an error if the fetch operation fails or if the response is not ok.
 *
 * @example
 * // Fetch the first page of posts with a limit of 5
 * const posts = await getPosts(1, 5);
 *
 * @example
 * // Fetch draft posts
 * const draftPosts = await getPosts(1, 10, true);
 */
export const getPosts = async (page: number = 1, limit: number = 10, getAll?: boolean): Promise<Post[]> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    getAll: getAll ? 'true' : 'false',
  });

  const response = await fetch(`${API_ROUTES.POSTS}?${params.toString()}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch posts');
  }

  const data = await response.json();
  return data.posts;
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
