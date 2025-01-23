# Next.js Blog Management System

[![Next.js](https://img.shields.io/badge/Next.js-15.1.5-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

English / [中文](./README.md)

A modern (toy) blog management system built with Next.js, utilizing a file-based storage system. Each blog post is stored in a separate folder containing an `index.md` file for content and an assets directory for related resources.

## Tech Stack

- Next.js 15.1.5 (with App Router)
- React 19
- TypeScript 5
- Tailwind CSS
- File System Storage
- JWT Authentication
- Markdown Support (with math equations and diagrams)
- Zustand State Management

## Project Structure

```
app/
├── (views)/        # Frontend page components
├── api/            # Backend API routes
├── components/     # Reusable React components
├── services/       # Frontend API services
├── common/         # Shared types and configs
├── hooks/          # React Hooks
├── lib/            # Core libraries
└── store/          # State management
```

## Features
- [x] File-based blog storage (Markdown format)
- [x] Metadata caching system (for improved read performance)
- [x] Complete CRUD operations API
- [x] Responsive design (mobile, tablet, desktop)
- [x] Admin login (email + password)
- [x] Light and dark mode support
- [x] Route protection (role-based access control)
- [x] JWT authentication (with refresh tokens)
- [x] Session management (multi-device login support)
- [x] Markdown support (including math equations and diagrams)
- [x] Tag system (with multi-level categories)
- [x] Search functionality (full-text search)
- [x] Draft functionality
- [ ] Resource management (images, videos, documents)
- [ ] Image upload (drag & drop, compression, preview)
- [ ] Statistics dashboard (visits, read time)
- [ ] Markdown editor (with live preview)
- [ ] Custom themes
- [ ] Automatic backup

## Quick Start

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd nextblog
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Configure environment variables:
   Create a `.env.local` file and add:
   ```env
   BLOG_ROOT_DIR=blogs  # Blog storage directory (default: 'blogs')
   JWT_SECRET=your-super-secret-jwt-key  # JWT secret for authentication
   ```

4. Start the development server:
   ```bash
   yarn dev
   ```

5. Access the system:
   ```
   URL: http://localhost:3000/dashboard
   Test Account: nextblog@example.com
   Password: nextblog123
   ```

## Blog Storage Structure
```
blogs/                # Blog root directory
├── meta.json         # Metadata cache
├── my-first-blog/    # Individual blog directory
│   ├── index.md      # Main content
│   └── assets/       # Resources directory
│       └── image.png # Blog resources
└── another-blog/
    ├── index.md
    └── assets/
```

## Code Usage Examples

```typescript
import blogStorage from '@/app/lib/blog-instance';

// Create a blog
const blog = await blogStorage.createBlog({
  id: 'my-first-blog',
  title: 'My First Blog',
  description: 'This is my first blog post',
  content: '# Hello World\n\nThis is my first blog post.',
  published: true,
  tags: ['first', 'hello']
});

// Get a blog
const blog = await blogStorage.getBlog('my-first-blog');

// Update a blog
const updated = await blogStorage.updateBlog('my-first-blog', {
  title: 'Updated Title',
  content: 'Updated content'
});

// Delete a blog
await blogStorage.deleteBlog('my-first-blog');

// List all blogs
const allBlogs = await blogStorage.listBlogs();

// List only published blogs
const publishedBlogs = await blogStorage.listBlogs({ published: true });
```

## Contribution Guide

1. Fork the project
2. Clone your forked project
3. Create a feature branch: `git checkout -b feature/AmazingFeature`
4. Commit your changes: `git commit -m 'Add some AmazingFeature'`
5. Push to the branch: `git push origin feature/AmazingFeature`
6. Submit a Pull Request

## Development Guidelines
1. Use yarn for dependency management
2. Avoid excessive use of third-party libraries, prefer native methods when possible

## License

MIT License - See LICENSE file for details