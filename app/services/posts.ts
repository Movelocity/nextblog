import { CreatePostInput, Post, UpdatePostInput } from '../common/config';
import { getAuthToken } from './auth';

const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const getPosts = async (page: number = 1, limit: number = 10, published?: boolean): Promise<Post[]> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  
  if (published !== undefined) {
    params.append('published', published.toString());
  }

  const response = await fetch(`/api/posts?${params.toString()}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch posts');
  }

  const data = await response.json();
  return data.posts;
};

export const getPost = async (id: string): Promise<Post> => {
  const response = await fetch(`/api/posts?id=${id}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch post');
  }

  return response.json();
};

export const createPost = async (input: CreatePostInput): Promise<Post> => {
  const response = await fetch('/api/posts', {
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
  const response = await fetch(`/api/posts?id=${id}`, {
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
  const response = await fetch(`/api/posts?id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to delete post');
  }
};
