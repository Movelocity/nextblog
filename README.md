# Blog Management System

A modern blog management system built with Next.js that uses a file-based storage system. Each blog is stored as a separate folder containing an `index.md` for content and an assets directory for related files.

## Project Structure

```
app/
├── (views)/          # Frontend page components
├── api/             # Backend API routes
├── components/      # Reusable React components
├── services/        # Frontend API services
├── common/          # Shared types and configs
├── hooks/          # React hooks
├── lib/            # Core libraries
└── store/          # State management
```

## Current Progress

### ✅ Completed Features

1. **Core Storage System**
   - File-based blog storage with folder per blog
   - Metadata caching for performance
   - Asset management support
   - Full CRUD operations

2. **Type System**
   - Comprehensive TypeScript interfaces
   - Type-safe blog operations
   - Proper error handling

### 🔧 Storage Interface Usage

```typescript
import blogStorage from '@/app/lib/blog-instance';

// Create a new blog
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

// List published blogs only
const publishedBlogs = await blogStorage.listBlogs({ published: true });

// Add an asset (e.g., image)
const assetPath = await blogStorage.addAsset(
  'my-first-blog',
  'image.png',
  imageBuffer
);

// Delete an asset
await blogStorage.deleteAsset('my-first-blog', 'image.png');
```

### 📁 Blog Directory Structure

```
blogs/                  # Root directory for all blogs
├── meta.json          # Metadata cache for all blogs
├── my-first-blog/     # Individual blog folder
│   ├── index.md      # Main content file
│   └── assets/       # Blog assets directory
│       └── image.png # Blog assets
└── another-blog/
    ├── index.md
    └── assets/
```

## 📝 TODO

1. **API Layer**
   - [ ] Update API routes to use the new storage system
   - [ ] Add proper error handling and validation
   - [ ] Implement file upload endpoints for assets

2. **Frontend Updates**
   - [ ] Update components to match new blog structure
   - [ ] Add markdown editor with preview
   - [ ] Add image upload UI
   - [ ] Add tag management UI

3. **Features**
   - [ ] Add search functionality
   - [ ] Add tag filtering
   - [ ] Add blog drafts
   - [ ] Add blog categories
   - [ ] Add blog series support

4. **Improvements**
   - [ ] Add proper logging
   - [ ] Add unit tests
   - [ ] Add blog content validation
   - [ ] Add image optimization
   - [ ] Add backup system

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Set up environment variables:
   ```env
   BLOG_ROOT_DIR=blogs  # Directory where blogs will be stored
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## 📚 Environment Variables

- `BLOG_ROOT_DIR`: Root directory for blog storage (default: 'blogs')

## 🛠️ Tech Stack

- Next.js 14
- TypeScript
- File-based Storage
- Markdown Processing
- Tailwind CSS
