import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { requireServer, getToken } from './config.js';

function buildHeaders(auth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (!token) {
      console.error('Not authenticated. Run: nextblog login');
      process.exit(1);
    }
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function apiFetch(path, { method = 'GET', body, auth = false, query } = {}) {
  const server = requireServer();
  let url = `${server}/api${path}`;
  if (query) {
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(query).filter(([, v]) => v != null && v !== ''))
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
      const data = await res.json();
      msg = data.error || data.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function login(email, password) {
  return apiFetch('/auth/login', { method: 'POST', body: { email, password } });
}

export async function getProfile() {
  return apiFetch('/auth/profile', { auth: true });
}

// ─── Posts ───────────────────────────────────────────────────────────────────

export async function listPosts({ page = 1, limit = 20, published, tag, category } = {}) {
  return apiFetch('/posts', { query: { page, limit, published, tag, category } });
}

export async function getPost(id) {
  return apiFetch(`/posts/${id}`);
}

export async function searchPosts(q, { page = 1, limit = 20 } = {}) {
  return apiFetch('/posts/search', { query: { q, page, limit } });
}

// ─── Notes ───────────────────────────────────────────────────────────────────

export async function listNotes({ page = 1, limit = 20 } = {}) {
  return apiFetch('/notes', { auth: true, query: { page, limit } });
}

export async function getNote(id) {
  return apiFetch(`/notes/detail/${id}`, { auth: true });
}

export async function searchNotes(q, { page = 1, limit = 20 } = {}) {
  return apiFetch('/notes/search', { auth: true, query: { q, page, limit } });
}

// ─── Assets ──────────────────────────────────────────────────────────────────

export async function listAssets({ page = 1, limit = 20 } = {}) {
  return apiFetch('/assets', { auth: true, query: { page, limit } });
}

export async function downloadAsset(fileId, destPath) {
  const server = requireServer();
  const token = getToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${server}/api/assets/${fileId}`, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const out = createWriteStream(destPath);
  await pipeline(res.body, out);
  return res.headers.get('content-type');
}

export async function uploadAsset(formData) {
  const server = requireServer();
  const token = getToken();
  if (!token) {
    console.error('Not authenticated. Run: nextblog login');
    process.exit(1);
  }

  const res = await fetch(`${server}/api/assets`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const d = await res.json(); msg = d.error || d.message || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}
