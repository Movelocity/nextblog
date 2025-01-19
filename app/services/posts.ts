import { CreatePostInput, Post, UpdatePostInput } from '../common/config';
import { getAuthToken } from './auth';

const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const getPosts = async (page: number = 1, limit: number = 10): Promise<Post[]> => {
  const response = await fetch(`/api/posts?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch posts');
  }

  return response.json();
};

export const getPost = async (id: string): Promise<Post> => {
  const response = await fetch(`/api/posts/${id}`, {
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
  const response = await fetch(`/api/posts/${id}`, {
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
  const response = await fetch(`/api/posts/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to delete post');
  }
};
