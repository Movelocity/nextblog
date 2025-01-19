import { CreatePostInput, Post, UpdatePostInput } from '../common/config';

export async function getPosts(page = 1, limit = 10) {
  const response = await fetch(`/api/posts?page=${page}&limit=${limit}`);
  return response.json();
}

export async function getPost(id: string) {
  const response = await fetch(`/api/posts?id=${id}`);
  return response.json();
}

export async function createPost(post: CreatePostInput) {
  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(post),
  });
  return response.json();
}

export async function updatePost(id: string, post: UpdatePostInput) {
  const response = await fetch(`/api/posts?id=${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(post),
  });
  return response.json();
}

export async function deletePost(id: string) {
  const response = await fetch(`/api/posts?id=${id}`, {
    method: 'DELETE',
  });
  return response.json();
}
