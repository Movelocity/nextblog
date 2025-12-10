# Next.js 博客管理系统

[![Next.js](https://img.shields.io/badge/Next.js-15.1.5-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Go](https://img.shields.io/badge/Go-1.22+-00ADD8?logo=go)](https://golang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

中文 / [English](./README.en.md)

一个现代化、高性能且易于定制的博客管理系统，采用前后端分离架构。

- **前端**: Next.js + React + TypeScript
- **后端**: Go + Gin + SQLite

支持 Markdown 富文本编写，完美集成数学公式与图表展示。

## 🎉 重大更新

**v2.0.0 - 前后端分离架构** (2025-11-29)

本项目已从 Next.js 全栈应用迁移到前后端分离架构：

- ✅ **后端**: Go (Gin 框架) + SQLite
- ✅ **前端**: Next.js React
- ✅ **API**: RESTful 接口
- ✅ **数据**: 从文件系统迁移到 SQLite

**快速开始**: 查看 [QUICKSTART_API.md](./QUICKSTART_API.md)

### 为什么选择这个博客系统？

- 🚀 **高性能后端**：Go 原生性能 + SQLite 零配置
- 📝 **强大的 Markdown 支持**：支持数学公式、图表等高级特性
- 🎨 **深色模式**：内置亮暗主题切换，提供舒适的阅读体验
- 🔍 **全文搜索**：快速定位任何内容
- 📱 **响应式设计**：完美适配移动端、平板、桌面端
- 🔐 **安全可靠**：JWT 认证 + 多设备会话管理
- 🎯 **前后端分离**：独立部署，灵活扩展
- 🐳 **Docker 支持**：一键部署

## 技术栈

### 后端
- Go 1.22+
- Gin Web Framework
- GORM ORM
- SQLite Database

### 前端
- Next.js 15.1.5（使用 App Router）
- React 19
- TypeScript 5
- Tailwind CSS
- Zustand 状态管理

### 其他
- JWT 认证
- Markdown 支持（支持数学公式、图表等）
- RESTful API
- Docker 支持

## 项目结构

```
nextblog/
├── server/              # Go 后端
│   ├── cmd/            # 命令行入口
│   ├── internal/       # 内部包
│   │   ├── api/       # API 处理器
│   │   ├── models/    # 数据模型
│   │   ├── repository/ # 数据访问层
│   │   └── middleware/ # 中间件
│   ├── data/          # SQLite 数据库
│   └── storage/       # 文件存储
├── app/               # Next.js 前端
│   ├── (views)/      # 前端页面组件
│   ├── components/   # 可复用的 React 组件
│   ├── services/     # API 客户端服务
│   ├── common/       # 共享类型和配置
│   ├── hooks/        # React Hooks
│   └── stores/       # 状态管理
├── scripts/          # 工具脚本
├── .env.local        # 前端环境变量（需创建）
└── docs/             # 文档
```

## 功能清单

### 核心功能
- [x] RESTful API（Go 后端）
- [x] SQLite 数据库存储
- [x] 前后端分离架构
- [x] 博客 CRUD 操作
- [x] 笔记管理
- [x] 响应式设计（支持移动端、平板、桌面端）
- [x] 管理员登录（支持邮箱+密码）
- [x] 亮、暗色模式支持
- [x] 路由保护（基于角色的访问控制）
- [x] JWT 认证（支持刷新令牌）
- [x] 会话管理（支持多设备登录）
- [x] Markdown 支持（包含数学公式、图表）
- [x] 标签和分类系统
- [x] 搜索功能（支持全文搜索）
- [x] 草稿功能
- [x] 图片上传和管理
- [x] Docker 部署支持

### 计划中
- [ ] 图片缩略图自动生成
- [ ] AI 图片编辑功能
- [ ] 系统状态监控面板
- [ ] Redis 缓存集成
- [ ] 评论系统
- [ ] 统计面板（访问量、阅读时长）
- [ ] 自定义主题
- [ ] 自动备份功能

## 快速开始

### 前置要求

- Node.js 18+
- pnpm（推荐）或 npm
- Go 1.22+（如果要运行后端）

### 方法 1: 使用 Go 后端（推荐）

**步骤 1**: 克隆仓库
```bash
git clone https://github.com/Movelocity/nextblog.git
cd nextblog
```

**步骤 2**: 启动 Go 后端
```bash
cd server
./bin/server
# 或者使用 make run
```

后端将运行在 `http://localhost:8080`

**步骤 3**: 配置前端环境变量

创建 `.env.local` 文件：
```bash
cd ..  # 回到项目根目录
cat > .env.local << 'EOF'
# Go 后端 API 地址
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
EOF
```

**步骤 4**: 安装依赖并启动前端
```bash
pnpm install
pnpm dev
```

**步骤 5**: 访问系统
```
地址：http://localhost:3000
```

**详细文档**: 查看 [QUICKSTART_API.md](./QUICKSTART_API.md)

### 方法 2: 仅使用 Next.js（传统模式）

如果不想使用 Go 后端，可以使用 Next.js 自带的 API 路由：

1. **不要创建** `.env.local` 文件
2. 按照原有方式配置环境变量（见下方）
3. 运行 `pnpm dev`

**环境变量配置**（仅 Next.js 模式）：
```env
API_BASE_URL
```

### Docker 部署

```bash
# 构建和启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 数据存储

### Go 后端模式（推荐）

- 文章和笔记存储在 SQLite 数据库（`server/data/nextblog.db`）
- 图片存储在文件系统（`server/storage/images/`）
- 支持完整的 CRUD 操作
- 支持分页、搜索、筛选

### Next.js 模式（传统）

```
blogs/                # 博客根目录
├── meta.json         # 元数据缓存
├── site-config.json  # 站点配置
├── my-first-blog/    # 单个博客目录
│   ├── index.md      # 主要内容
│   └── assets/       # 资源目录
│       └── image.png # 博客资源
└── another-blog/
    ├── index.md
    └── assets/
```

## API 文档

### 后端 API 端点

查看完整的 API 文档：[API_MIGRATION.md](./API_MIGRATION.md)

**主要端点**:
- `GET /api/health` - 健康检查
- `GET /api/posts` - 获取文章列表
- `GET /api/posts/:id` - 获取文章详情
- `POST /api/posts` - 创建文章
- `PUT /api/posts/:id` - 更新文章
- `DELETE /api/posts/:id` - 删除文章
- `GET /api/notes` - 获取笔记列表
- `GET /api/categories` - 获取分类
- `GET /api/tags` - 获取标签
- `POST /api/images/upload` - 上传图片
- `GET /api/config` - 获取站点配置

## 使用示例

### 前端 API 调用

```typescript
import { getPosts, getPost, createPost } from '@/app/services/posts';

// 获取文章列表
const posts = await getPosts({ page: 1, limit: 10 });

// 获取单篇文章
const post = await getPost('post-id');

// 创建新文章
const newPost = await createPost({
  title: '我的第一篇博客',
  content: '# 你好世界\n\n这是我的第一篇博客文章。',
  published: true,
  categories: ['技术'],
  tags: ['首篇']
});
```

### Go 后端 API 测试

```bash
# 健康检查
curl http://localhost:8080/api/health

# 获取文章列表
curl http://localhost:8080/api/posts?page=1&pageSize=10

# 获取文章详情
curl http://localhost:8080/api/posts/1737467244252

# 创建文章（需要认证）
curl -X POST http://localhost:8080/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "新文章",
    "content": "# 内容",
    "published": true,
    "categories": ["技术"],
    "tags": ["Go"]
  }'
```

## 文档

- 📚 [快速开始指南](./QUICKSTART_API.md) - 3 步启动项目
- 🔄 [API 迁移指南](./API_MIGRATION.md) - 详细的 API 映射和差异说明
- 🌍 [环境变量配置](./ENV_SETUP.md) - 环境变量详细说明
- 📝 [迁移总结](./MIGRATION_SUMMARY.md) - 前后端分离迁移记录
- 🏗️ [项目架构](./PROJECT_SUMMARY.md) - 整体架构说明
- 🐳 [Docker 部署](./docs/docker.md) - Docker 部署指南

## 测试

### 运行 API 集成测试

```bash
# 确保 Go 后端运行在 localhost:8080
node scripts/test-api-integration.js
```

这将测试所有主要 API 端点并显示详细结果。

## 贡献指南

1. Fork 项目
2. git clone 你 Fork 出的新项目
3. 创建特性分支：`git checkout -b feature/AmazingFeature`
4. 提交更改：`git commit -m 'Add some AmazingFeature'`
5. 推送分支：`git push origin feature/AmazingFeature`
6. 提交 Pull Request

## 开发规范

1. 使用 pnpm 管理前端依赖
2. 使用 Go modules 管理后端依赖
3. 避免过度使用第三方库，尽量使用原生方法
4. 遵循 RESTful API 设计原则
5. 前端组件使用 TypeScript 类型
6. 后端接口添加完整注释

## 性能优化

- 🚀 Go 原生性能，比 Node.js 快 3-5 倍
- 💾 SQLite 零配置，查询性能优秀
- 📦 前端构建优化，使用 Next.js App Router
- 🗄️ 计划添加 Redis 缓存层
- 🖼️ 计划添加图片 CDN 支持

## 路线图

### v2.1.0（计划中）
- [ ] 图片缩略图自动生成
- [ ] 系统状态监控 API
- [ ] Redis 缓存集成

### v2.2.0（计划中）
- [ ] AI 图片编辑功能
- [ ] 评论系统
- [ ] 全文搜索优化（Elasticsearch）

### v3.0.0（未来）
- [ ] 多用户支持
- [ ] 权限管理系统
- [ ] 实时通知（WebSocket）
- [ ] 插件系统

## 许可证

MIT License - 详见 LICENSE 文件
