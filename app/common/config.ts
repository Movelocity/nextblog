export const POSTS_CONFIG = {
  POSTS_DIR: process.env.POSTS_DIR || 'posts',  // Directory where posts are stored
  MAX_POSTS_PER_PAGE: 10,
};

export const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
export const JWT_EXPIRES_IN = '24h';

export const ADMIN_CREDENTIALS = {
    email: process.env.ADMIN_EMAIL || 'nextblog@example.com',
    password: process.env.ADMIN_PASSWORD || 'nextblog123'
};

export const API_ROUTES = {
    LOGIN: '/api/auth/login',
    POSTS: '/api/posts',
    TAXONOMY: '/api/taxonomy'
};