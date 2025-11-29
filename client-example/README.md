# Next Blog 前端客户端示例

这个目录包含使用 Go 后端 API 的前端客户端示例代码。

## 文件说明

- **api-client.ts** - TypeScript API 客户端库
- **react-hooks-example.tsx** - React Hooks 使用示例

## 使用方法

### 1. 安装到你的 React 项目

将 `api-client.ts` 复制到你的项目中：

```bash
cp client-example/api-client.ts your-react-app/src/services/
```

### 2. 配置 API 基础 URL

在项目根目录创建 `.env` 文件：

```env
# 开发环境
REACT_APP_API_BASE_URL=http://localhost:8080/api

# 生产环境
# REACT_APP_API_BASE_URL=https://your-domain.com/api
```

或者使用 Vite：

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

### 3. 在代码中使用

#### 基础使用

```typescript
import api from './services/api-client';

// 获取文章列表
const posts = await api.posts.getAll(1, 10, true);
console.log(posts);

// 获取文章详情
const post = await api.posts.getById('1738232112422');
console.log(post);

// 创建文章
const newPost = await api.posts.create({
  title: '新文章',
  content: '# 标题\n\n文章内容...',
  published: true,
  categories: ['技术'],
  tags: ['Go', 'React'],
});
```

#### React Hooks 使用

```tsx
import { usePosts, usePost, useCategories } from './hooks/useBlog';

function BlogList() {
  const { data, loading, error } = usePosts(1, 10);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      {data?.posts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.description}</p>
        </article>
      ))}
    </div>
  );
}
```

## API 参考

### Posts API

```typescript
// 获取文章列表
api.posts.getAll(page, pageSize, published)

// 获取文章详情
api.posts.getById(id)

// 创建文章
api.posts.create(data)

// 更新文章
api.posts.update(id, data)

// 删除文章
api.posts.delete(id)

// 搜索文章
api.posts.search(keyword, page, pageSize)

// 按分类获取
api.posts.getByCategory(category, page, pageSize)

// 按标签获取
api.posts.getByTag(tag, page, pageSize)
```

### Notes API

```typescript
// 获取所有笔记
api.notes.getAll()

// 获取指定日期的笔记
api.notes.getByDate(date)

// 创建笔记
api.notes.create(data)

// 更新笔记
api.notes.update(id, data)

// 删除笔记
api.notes.delete(id)
```

### Images API

```typescript
// 上传图片
const result = await api.images.upload(file)

// 获取图片 URL
const url = api.images.getUrl(filename)

// 删除图片
api.images.delete(filename)
```

### Categories & Tags API

```typescript
// 获取分类列表
api.categories.getAll()

// 获取标签列表
api.tags.getAll()
```

## 完整示例项目

创建一个简单的 React 应用：

```bash
# 使用 Create React App
npx create-react-app my-blog --template typescript
cd my-blog

# 或使用 Vite
npm create vite@latest my-blog -- --template react-ts
cd my-blog

# 安装依赖
npm install

# 复制 API 客户端
cp ../client-example/api-client.ts src/services/

# 配置环境变量
echo "REACT_APP_API_BASE_URL=http://localhost:8080/api" > .env

# 启动开发服务器
npm start
```

## TypeScript 类型定义

```typescript
// types/blog.ts

export interface Post {
  id: string;
  title: string;
  description: string;
  content: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  categories: string[];
}

export interface Note {
  id: string;
  date: string;
  data: string;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  name: string;
  count: number;
}

export interface Tag {
  name: string;
  count: number;
}

export interface PostListResponse {
  posts: Post[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Image {
  id: number;
  filename: string;
  path: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

export interface SiteConfig {
  id: number;
  siteName: string;
  siteDescription: string;
  icpInfo: string;
  updatedAt: string;
}
```

## 推荐的 UI 库

1. **Ant Design**
```bash
npm install antd
```

2. **Material-UI**
```bash
npm install @mui/material @emotion/react @emotion/styled
```

3. **Tailwind CSS**
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## Markdown 渲染

推荐使用以下库渲染 Markdown：

1. **react-markdown**
```bash
npm install react-markdown remark-gfm
```

```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function PostContent({ content }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {content}
    </ReactMarkdown>
  );
}
```

2. **@uiw/react-md-editor**（编辑器）
```bash
npm install @uiw/react-md-editor
```

```tsx
import MDEditor from '@uiw/react-md-editor';

function PostEditor() {
  const [content, setContent] = useState('');
  
  return (
    <MDEditor
      value={content}
      onChange={setContent}
    />
  );
}
```

## 错误处理

建议添加全局错误处理：

```typescript
// services/api-client.ts
const request = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    // 记录错误
    console.error('API Error:', error);
    
    // 可以添加全局错误处理，如显示通知
    // toast.error(error.message);
    
    throw error;
  }
};
```

## CORS 配置

如果遇到 CORS 问题，确保后端配置正确：

```env
# server/.env
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

或者在开发时使用代理：

```json
// package.json (Create React App)
{
  "proxy": "http://localhost:8080"
}
```

```typescript
// vite.config.ts (Vite)
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
```

## 下一步

1. 实现完整的 CRUD 界面
2. 添加身份验证
3. 实现 Markdown 编辑器
4. 添加图片上传和管理
5. 实现搜索功能
6. 添加评论功能
7. 优化 SEO
8. 实现暗黑模式

