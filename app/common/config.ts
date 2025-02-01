export const BLOG_CONFIG = {
  ROOT_DIR: process.env.BLOG_ROOT_DIR || 'blogs',  // Root directory for all blogs
  META_FILE: 'meta.json',  // File to store metadata for all blogs
  CONTENT_FILE: 'index.md',  // Main content file for each blog
  ASSETS_DIR: 'assets',  // Directory for blog assets (images, etc.)
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
    CHECK_AUTH: '/api/auth/check',
    POSTS: '/api/posts',
    TAXONOMY: '/api/taxonomy',
    ASSET: '/api/asset'
} as const;