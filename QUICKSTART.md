# Next Blog 前后端分离项目

## 项目概述

本项目已成功拆分为前后端分离架构：

- **前端**: React (待开发，可基于现有 Next.js 项目改造)
- **后端**: Go (Gin 框架)
- **数据库**: SQLite

## 项目结构

```
nextblog/
├── server/              # Go 后端服务
│   ├── cmd/
│   │   ├── server/     # 主服务器
│   │   └── migrate/    # 数据迁移工具
│   ├── internal/
│   │   ├── api/        # API 处理器
│   │   ├── config/     # 配置管理
│   │   ├── db/         # 数据库
│   │   ├── middleware/ # 中间件
│   │   ├── models/     # 数据模型
│   │   └── repository/ # 数据访问层
│   ├── data/           # SQLite 数据库
│   ├── storage/        # 文件存储
│   └── README.md
└── client/             # React 前端 (待创建)
```

## 后端服务器

### 快速开始

#### 1. 初始化项目

```bash
cd server
chmod +x init.sh
./init.sh
```

#### 2. 数据迁移

将现有 Next.js 项目的数据迁移到 SQLite：

```bash
./bin/migrate -source ../blogs -db ./data/nextblog.db -storage ./storage
```

迁移结果：
- ✓ 13 篇文章
- ✓ 23 条笔记
- ✓ 4 个分类
- ✓ 2 个标签
- ✓ 21 张图片

#### 3. 启动服务器

```bash
./bin/server
```

服务器运行在 `http://localhost:8080`

### 使用 Makefile

```bash
make init       # 初始化项目
make migrate    # 运行数据迁移
make run        # 启动服务器
make dev        # 开发模式（热重载）
make build      # 构建项目
make clean      # 清理构建文件
```

### API 端点

#### 健康检查
```bash
curl http://localhost:8080/api/health
```

#### 文章 API

```bash
# 获取文章列表
curl "http://localhost:8080/api/posts?page=1&pageSize=10&published=true"

# 获取文章详情
curl http://localhost:8080/api/posts/1738232112422

# 创建文章
curl -X POST http://localhost:8080/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "新文章",
    "content": "文章内容",
    "published": true,
    "categories": ["技术"],
    "tags": ["Go", "API"]
  }'

# 更新文章
curl -X PUT http://localhost:8080/api/posts/1738232112422 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "更新后的标题",
    "content": "更新后的内容",
    "published": true
  }'

# 删除文章
curl -X DELETE http://localhost:8080/api/posts/1738232112422

# 搜索文章
curl "http://localhost:8080/api/posts/search?keyword=docker"

# 按分类获取文章
curl "http://localhost:8080/api/posts/category/python"

# 按标签获取文章
curl "http://localhost:8080/api/posts/tag/cv"
```

#### 笔记 API

```bash
# 获取所有笔记
curl http://localhost:8080/api/notes

# 获取指定日期的笔记
curl http://localhost:8080/api/notes/date/2025-11-21

# 获取公开笔记
curl http://localhost:8080/api/notes/public

# 创建笔记
curl -X POST http://localhost:8080/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "data": "笔记内容",
    "isPublic": false,
    "tags": ["标签1"]
  }'

# 更新笔记
curl -X PUT http://localhost:8080/api/notes/20251121215834144402 \
  -H "Content-Type: application/json" \
  -d '{
    "data": "更新后的内容",
    "isPublic": true
  }'

# 删除笔记
curl -X DELETE http://localhost:8080/api/notes/20251121215834144402
```

#### 分类和标签 API

```bash
# 获取所有分类
curl http://localhost:8080/api/categories

# 获取所有标签
curl http://localhost:8080/api/tags
```

#### 图片 API

```bash
# 上传图片
curl -X POST http://localhost:8080/api/images/upload \
  -F "file=@/path/to/image.jpg"

# 获取图片
curl http://localhost:8080/api/images/20251003094120369-105419.png --output image.png

# 获取图片列表
curl http://localhost:8080/api/images

# 删除图片
curl -X DELETE http://localhost:8080/api/images/filename.jpg
```

#### 站点配置 API

```bash
# 获取配置
curl http://localhost:8080/api/config

# 更新配置
curl -X PUT http://localhost:8080/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "siteName": "我的博客",
    "siteDescription": "这是一个技术博客",
    "icpInfo": "ICP备案号"
  }'
```

### Docker 部署

```bash
# 构建镜像
docker build -t nextblog-server:latest ./server

# 运行容器
docker run -d \
  -p 8080:8080 \
  -v $(pwd)/server/data:/app/data \
  -v $(pwd)/server/storage:/app/storage \
  --env-file server/.env \
  --name nextblog-server \
  nextblog-server:latest

# 查看日志
docker logs -f nextblog-server

# 停止容器
docker stop nextblog-server
docker rm nextblog-server
```

## 数据库结构

### Posts (文章)
- id: 文章 ID (时间戳)
- title: 标题
- description: 描述
- content: 内容 (Markdown)
- published: 是否发布
- createdAt: 创建时间
- updatedAt: 更新时间
- tags: 标签数组 (JSON)
- categories: 分类数组 (JSON)

### Notes (笔记)
- id: 笔记 ID (时间戳)
- date: 日期 (YYYY-MM-DD)
- data: 内容
- isPublic: 是否公开
- tags: 标签数组 (JSON)
- createdAt: 创建时间
- updatedAt: 更新时间

### Categories (分类)
- name: 分类名称 (主键)
- count: 文章数量

### Tags (标签)
- name: 标签名称 (主键)
- count: 文章数量

### Images (图片)
- id: 自增 ID
- filename: 文件名
- path: 存储路径
- size: 文件大小
- mimeType: MIME 类型
- createdAt: 上传时间

### SiteConfig (站点配置)
- id: 配置 ID (固定为 1)
- siteName: 站点名称
- siteDescription: 站点描述
- icpInfo: ICP 备案信息
- updatedAt: 更新时间

## 下一步计划

### 前端开发

可以基于以下框架开发 React 前端：

1. **Create React App**
```bash
npx create-react-app client
```

2. **Vite + React**
```bash
npm create vite@latest client -- --template react-ts
```

3. **Next.js (仅作为前端)**
```bash
npx create-next-app@latest client
```

### 前端需要实现的功能

1. **文章管理**
   - 文章列表展示
   - 文章详情页
   - 文章编辑器 (Markdown)
   - 文章搜索
   - 分类/标签筛选

2. **笔记管理**
   - 笔记列表
   - 笔记编辑
   - 按日期组织

3. **图片管理**
   - 图片上传
   - 图片浏览
   - Markdown 编辑器中插入图片

4. **用户界面**
   - 响应式设计
   - 暗黑模式支持
   - Markdown 渲染

### 推荐的前端技术栈

- **UI 框架**: Ant Design / Material-UI / Tailwind CSS
- **状态管理**: Redux Toolkit / Zustand / React Query
- **路由**: React Router
- **Markdown 编辑器**: 
  - react-markdown
  - @uiw/react-md-editor
  - Toast UI Editor
- **HTTP 客户端**: Axios / fetch
- **表单处理**: React Hook Form

### API 客户端示例

```typescript
// services/api.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const postsApi = {
  getAll: (page = 1, pageSize = 10, published = true) =>
    api.get('/posts', { params: { page, pageSize, published } }),
  
  getById: (id: string) =>
    api.get(`/posts/${id}`),
  
  create: (data: PostCreateInput) =>
    api.post('/posts', data),
  
  update: (id: string, data: PostUpdateInput) =>
    api.put(`/posts/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/posts/${id}`),
  
  search: (keyword: string, page = 1, pageSize = 10) =>
    api.get('/posts/search', { params: { keyword, page, pageSize } }),
};

export const notesApi = {
  getAll: () => api.get('/notes'),
  getByDate: (date: string) => api.get(`/notes/date/${date}`),
  create: (data: NoteCreateInput) => api.post('/notes', data),
  update: (id: string, data: NoteUpdateInput) => api.put(`/notes/${id}`, data),
  delete: (id: string) => api.delete(`/notes/${id}`),
};

export const imagesApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/images/upload', formData);
  },
  getUrl: (filename: string) => `${API_BASE_URL}/images/${filename}`,
};
```

## 环境变量配置

### 后端 (server/.env)

```env
PORT=8080
GIN_MODE=debug
DB_PATH=./data/nextblog.db
STORAGE_PATH=./storage
UPLOAD_MAX_SIZE=10485760
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=24h
```

### 前端 (client/.env)

```env
VITE_API_BASE_URL=http://localhost:8080/api
# 或
REACT_APP_API_BASE_URL=http://localhost:8080/api
```

## 开发工作流

1. **后端开发** (已完成 ✓)
   ```bash
   cd server
   make dev  # 热重载模式
   ```

2. **前端开发** (待实现)
   ```bash
   cd client
   npm run dev
   ```

3. **数据迁移** (已完成 ✓)
   ```bash
   cd server
   make migrate
   ```

## 性能优化建议

1. **数据库索引**: 已在 `date`, `published` 等字段添加索引
2. **分页**: 所有列表 API 都支持分页
3. **CORS**: 可配置允许的来源
4. **文件大小限制**: 可配置最大上传大小
5. **缓存**: 可添加 Redis 缓存热点数据

## 安全建议

1. 添加 JWT 身份验证
2. 添加速率限制
3. 输入验证和清理
4. HTTPS 部署
5. 定期备份数据库

## 许可证

MIT

