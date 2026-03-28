import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { requireServer, getToken } from './config.js';

export interface User {
  username: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user?: User;
}

export interface Post {
  id: string;
  title: string;
  description?: string;
  content?: string;
  published: boolean;
  tags?: string[];
  categories?: string[];
  updatedAt: string;
  createdAt: string;
}

export interface Note {
  id: string;
  data: string;
  isPublic: boolean;
  isArchived: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  originalName?: string;
  filename?: string;
  mimeType?: string;
  size?: number;
}

export interface PaginatedResponse<T> {
  total?: number;
  page?: number;
  limit?: number;
  [key: string]: T[] | number | undefined;
}

interface FetchOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  query?: Record<string, string | number | boolean | undefined>;
}

function buildHeaders(auth = false): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (!token) {
      console.error('Not authenticated. Run: nblog login');
      process.exit(1);
    }
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function apiFetch<T>(path: string, { method = 'GET', body, auth = false, query }: FetchOptions = {}): Promise<T> {
  const server = requireServer();
  let url = `${server}/api${path}`;
  if (query) {
    const params = new URLSearchParams(
      Object.fromEntries(
        Object.entries(query)
          .filter(([, v]) => v != null && v !== '')
          .map(([k, v]) => [k, String(v)])
      )
    );
    if (params.size) url += `?${params}`;
  }

  const res = await fetch(url, {
    method,
    headers: buildHeaders(auth),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json() as { error?: string; message?: string };
      msg = data.error ?? data.message ?? msg;
    } catch { /* ignore */ }
    throw new Error(msg);
  }

  return res.json() as Promise<T>;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<LoginResponse> {
  return apiFetch('/auth/login', { method: 'POST', body: { email, password } });
}

export async function getProfile(): Promise<User> {
  return apiFetch('/auth/profile', { auth: true });
}

// ─── Posts ───────────────────────────────────────────────────────────────────

export interface ListPostsParams {
  page?: number;
  limit?: number;
  published?: boolean;
  tag?: string;
  category?: string;
}

export async function listPosts(params: ListPostsParams = {}): Promise<PaginatedResponse<Post> & { posts?: Post[] }> {
  return apiFetch('/posts', { query: params as Record<string, string | number | boolean | undefined> });
}

export async function getPost(id: string): Promise<Post> {
  return apiFetch(`/posts/${id}`);
}

export async function searchPosts(q: string, { page = 1, limit = 20 } = {}): Promise<PaginatedResponse<Post> & { posts?: Post[] }> {
  return apiFetch('/posts/search', { query: { q, page, limit } });
}

// ─── Notes ───────────────────────────────────────────────────────────────────

export async function listNotes({ page = 1, limit = 20 } = {}): Promise<PaginatedResponse<Note> & { notes?: Note[] }> {
  return apiFetch('/notes', { auth: true, query: { page, limit } });
}

export async function getNote(id: string): Promise<Note> {
  return apiFetch(`/notes/detail/${id}`, { auth: true });
}

export async function searchNotes(q: string, { page = 1, limit = 20 } = {}): Promise<PaginatedResponse<Note> & { notes?: Note[] }> {
  return apiFetch('/notes/search', { auth: true, query: { q, page, limit } });
}

// ─── Assets ──────────────────────────────────────────────────────────────────

export async function listAssets({ page = 1, limit = 20 } = {}): Promise<PaginatedResponse<Asset> & { assets?: Asset[] }> {
  return apiFetch('/assets', { auth: true, query: { page, limit } });
}

export async function downloadAsset(fileId: string, destPath: string): Promise<string | null> {
  const server = requireServer();
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${server}/api/assets/${fileId}`, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const out = createWriteStream(destPath);
  await pipeline(res.body as NodeJS.ReadableStream, out);
  return res.headers.get('content-type');
}

export async function uploadAsset(formData: FormData): Promise<{ id?: string; fileId?: string; [key: string]: unknown }> {
  const server = requireServer();
  const token = getToken();
  if (!token) {
    console.error('Not authenticated. Run: nblog login');
    process.exit(1);
  }

  const res = await fetch(`${server}/api/assets`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token as string}` },
    body: formData,
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const d = await res.json() as { error?: string; message?: string }; msg = d.error ?? d.message ?? msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return res.json() as Promise<{ id?: string; fileId?: string }>;
}
