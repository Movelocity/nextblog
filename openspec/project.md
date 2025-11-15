# Project Context

## Purpose
这是一个现代化、高性能且易于定制的博客管理系统，基于 Next.js 构建。采用基于文件系统的存储方案，让内容管理和迁移更加简单直观。

**核心目标：**
- 提供零数据库依赖的博客管理解决方案
- 支持强大的 Markdown 富文本编写（数学公式、图表、代码高亮）
- 提供完整的博客 CRUD 操作和资源管理
- 提供现代化的 UI/UX 体验（响应式设计、深色模式）
- 通过元数据缓存机制保证高性能访问
- 提供安全的后台管理系统（JWT 认证 + 会话管理）

## Tech Stack

### 核心框架
- **Next.js 15.1.5** - 使用 App Router 架构，支持服务端渲染和 API 路由
- **React 19** - 最新的 React 版本，用于构建 UI 组件
- **TypeScript 5** - 提供类型安全和更好的开发体验

### 样式和 UI
- **Tailwind CSS 3.4** - 实用优先的 CSS 框架
- **@tailwindcss/typography** - 为 Markdown 内容提供优雅的排版样式
- **classnames** - 条件类名组合工具
- **react-icons** - 统一的图标库

### Markdown 和内容处理
- **react-markdown** - React Markdown 渲染器
- **remark-gfm** - GitHub 风格 Markdown 支持
- **remark-math** - 数学公式支持
- **remark-breaks** - 换行符处理
- **rehype-katex** - KaTeX 数学公式渲染
- **rehype-highlight** - 代码高亮
- **mermaid** - 图表和流程图支持
- **yaml** - YAML 配置文件解析

### 状态管理和数据处理
- **zustand** - 轻量级状态管理库
- **lodash** - 实用函数库
- **use-debounce** - 防抖钩子

### 认证和安全
- **jsonwebtoken** - JWT 令牌生成和验证
- 自定义 JWT 认证系统，支持刷新令牌和多设备会话管理

### UI 组件库
- **@radix-ui/react-popover** - 无障碍的弹出层组件

### 图像处理
- **sharp** - 高性能图像处理库（缩略图生成、压缩）

### 开发工具
- **ESLint** - 代码规范检查
- **code-inspector-plugin** - 代码检查插件
- **PostCSS** - CSS 处理工具

### 存储方案
- **文件系统存储** - 无需数据库，所有博客内容和资源存储在文件系统中
- **元数据缓存** - 通过 `meta.json` 缓存博客元数据，提升性能

## Project Conventions

### Code Style

#### 命名规范
- **组件名称**：使用 PascalCase，例如 `PostsList`, `NoteEditor`
- **文件名称**：组件文件使用 PascalCase（`PostsList.tsx`），工具函数使用 camelCase（`utils.ts`）
- **变量和函数**：使用 camelCase，例如 `blogStorage`, `handleClick`
- **常量**：使用 UPPER_SNAKE_CASE，例如 `JWT_SECRET`, `BLOG_ROOT_DIR`
- **类型和接口**：使用 PascalCase，例如 `BlogMeta`, `CreatePostInput`
- **事件处理函数**：使用 "handle" 前缀，例如 `handleClick`, `handleKeyDown`, `handleSubmit`

#### React 编码规范
- **优先使用 const 定义组件**：`const ComponentName = () => { ... }`，而不是 function 声明
- **提前返回（Early Returns）**：尽可能使用提前返回模式提高代码可读性
- **Tailwind 优先**：始终使用 Tailwind 类名进行样式设置，CSS 作为备选方案
- **条件类名**：使用 `classnames` 库处理条件类名
- **图标统一使用 react-icons**：不使用其他图标库
- **类型定义**：尽可能为函数和组件定义明确的类型
- **注释规范**：使用 JSDoc 格式 `/** */` 为类和方法添加文档注释
- **保留有用的注释**：不要删除描述参数和方法的有用注释

#### API 和服务层规范
- **禁止组件直接 fetch**：所有 API 调用必须在 `app/services/` 目录中实现
- **服务层职责**：为组件提供简单易用的 API 调用函数
- **错误处理**：服务层需要统一处理错误并返回友好的错误信息

#### 中间件规范
- **禁止使用 Next.js middleware**：使用 wrapper 函数代替

### Architecture Patterns

#### 目录结构
```
app/
├── (views)/              # 前端页面路由（使用 App Router）
│   ├── page.tsx          # 首页
│   ├── dashboard/        # 仪表板
│   ├── posts/            # 博客列表和详情
│   ├── notes/            # 笔记系统
│   ├── categories/       # 分类浏览
│   └── tools/            # 工具页面
├── api/                  # 后端 API 路由
│   ├── posts/            # 博客相关 API
│   ├── notes/            # 笔记相关 API
│   ├── auth/             # 认证相关 API
│   ├── asset/            # 资源管理 API
│   ├── taxonomy/         # 分类标签 API
│   └── system/           # 系统信息 API
├── components/           # 可复用的 React 组件
│   ├── Posts/            # 博客相关组件
│   ├── Notes/            # 笔记相关组件
│   ├── Auth/             # 认证相关组件
│   ├── Editor/           # Markdown 编辑器
│   ├── Asset/            # 资源管理组件
│   ├── layout/           # 布局组件
│   ├── part/             # 通用部件
│   └── ui/               # 基础 UI 组件
├── services/             # 前端 API 服务层
│   ├── posts.ts          # 博客 API 调用
│   ├── notes.ts          # 笔记 API 调用
│   ├── auth.ts           # 认证 API 调用
│   ├── assets.ts         # 资源 API 调用
│   └── utils.ts          # 服务工具函数
├── lib/                  # 核心库和业务逻辑
│   ├── blog/             # 博客管理核心逻辑
│   │   ├── BlogManager.ts      # 博客管理器
│   │   ├── MetadataCache.ts    # 元数据缓存
│   │   └── FileOperations.ts   # 文件操作
│   ├── BlogStorage.ts    # 博客存储接口
│   ├── ImageStorage.ts   # 图像存储管理
│   ├── auth.ts           # 认证逻辑
│   ├── jwt.ts            # JWT 工具
│   └── cache/            # 缓存管理
├── hooks/                # 自定义 React Hooks
│   ├── useAuth.ts        # 认证钩子
│   ├── useIsMobile.ts    # 移动端检测
│   └── useScrollDirection.ts  # 滚动方向检测
├── stores/               # Zustand 状态管理
│   └── EditPostStore.ts  # 博客编辑状态
├── common/               # 共享类型和配置
│   ├── types.ts          # 博客相关类型定义
│   ├── types.notes.ts    # 笔记相关类型定义
│   ├── globals.ts        # 全局配置
│   ├── tools.config.ts   # 工具配置
│   └── utils.ts          # 通用工具函数
└── utils/                # 工具函数
    └── jsonTools.ts      # JSON 处理工具
```

#### 博客存储结构
```
blogs/                    # 博客根目录（可通过环境变量配置）
├── meta.json             # 元数据缓存文件
├── {timestamp}/          # 单个博客目录（使用时间戳作为 ID）
│   ├── config.yaml       # 博客配置（标题、描述、标签等）
│   ├── index.md          # 博客主要内容（Markdown 格式）
│   └── assets/           # 博客资源目录
│       └── *.png|jpg     # 图片等资源文件
├── images/               # 全局图片存储
│   └── *.png|jpg         # 上传的图片（带时间戳命名）
├── thumbnails/           # 缩略图缓存
└── notes/                # 笔记存储
    ├── index.json        # 笔记索引
    └── YYYY-MM-DD.json   # 每日笔记
```

#### 设计模式

##### 1. 单例模式（Singleton）
- `BlogStorage.getInstance()` - 博客存储单例
- `BlogManager.getInstance()` - 博客管理器单例
- `ImageStorage.getInstance()` - 图像存储单例

##### 2. 分层架构（Layered Architecture）
```
View Layer (Components) 
    ↓
Service Layer (services/) 
    ↓
Business Logic Layer (lib/) 
    ↓
File System Storage
```

##### 3. 缓存模式（Cache Pattern）
- 元数据缓存：`meta.json` 缓存所有博客的元数据
- 缩略图缓存：自动生成和缓存图片缩略图
- 按需加载：博客内容仅在需要时从文件系统读取

##### 4. API 路由模式
- RESTful API 设计
- 统一的错误处理和响应格式
- JWT 中间件保护敏感 API

### Testing Strategy
当前项目暂未实施自动化测试策略。

**未来计划：**
- 单元测试：使用 Jest + React Testing Library
- E2E 测试：使用 Playwright 或 Cypress
- API 测试：使用手动测试或 Postman

### Git Workflow

**分支策略：**
- `main` - 主分支，保持稳定可部署状态
- `feature/*` - 功能分支
- `fix/*` - 修复分支

**提交规范：**
建议使用语义化提交信息：
- `feat:` - 新功能
- `fix:` - 修复 bug
- `docs:` - 文档更新
- `style:` - 代码格式调整
- `refactor:` - 重构
- `test:` - 测试相关
- `chore:` - 构建或辅助工具变动

## Domain Context

### 博客管理系统核心概念

#### 1. 博客（Blog/Post）
- **唯一标识**：使用时间戳作为博客 ID（例如 `1738036546744`）
- **元数据**：标题、描述、创建时间、更新时间、发布状态、标签、分类
- **内容**：Markdown 格式，支持 GFM、数学公式、代码高亮、图表
- **资源**：每个博客可以有独立的 assets 目录存储相关文件

#### 2. 分类和标签系统（Taxonomy）
- **Categories（分类）**：支持多级分类，使用 `/` 分隔（例如 `技术/前端/React`）
- **Tags（标签）**：扁平化标签系统，用于更细粒度的内容分类
- **全局索引**：`meta.json` 中维护所有分类和标签的索引

#### 3. 笔记系统（Notes）
- **日期索引**：笔记按日期组织（`YYYY-MM-DD.json`）
- **内容结构**：JSON 格式，包含标题、内容、标签、时间戳
- **独立存储**：与博客系统分离，存储在 `blogs/notes/` 目录

#### 4. 资源管理（Assets）
- **博客资源**：存储在各博客的 `assets/` 目录中
- **全局图片**：存储在 `blogs/images/` 目录，使用时间戳命名
- **缩略图**：自动生成并缓存在 `blogs/thumbnails/` 目录
- **图片处理**：使用 Sharp 进行压缩、裁剪、格式转换

#### 5. 认证系统（Authentication）
- **JWT 认证**：使用 access token（短期）和 refresh token（长期）
- **会话管理**：支持多设备登录，每个设备维护独立会话
- **Cookie 存储**：token 存储在 httpOnly cookie 中，提高安全性
- **权限控制**：保护后台管理和编辑功能

#### 6. Markdown 渲染
- **语法支持**：
  - GitHub Flavored Markdown (GFM)
  - 数学公式（KaTeX）
  - 代码高亮（highlight.js）
  - Mermaid 图表
  - 表格、任务列表、删除线等
- **自定义组件**：可以扩展自定义 Markdown 组件

### 业务规则

1. **博客 ID 生成**：使用 `Date.now()` 生成时间戳作为唯一 ID
2. **文件命名规范**：图片使用 `YYYYMMDDHHmmssSSS-{random}.ext` 格式
3. **元数据缓存更新**：任何博客 CRUD 操作都会更新 `meta.json`
4. **发布状态**：未发布的博客（`published: false`）仅管理员可见
5. **资源清理**：删除博客时自动删除其 assets 目录
6. **图片优化**：上传图片自动生成缩略图（300x300）

## Important Constraints

### 技术约束
1. **无数据库依赖**：必须使用文件系统存储，不能引入 PostgreSQL、MySQL 等数据库
2. **Node.js 环境**：需要 Node.js 运行时支持文件系统操作
3. **文件系统权限**：需要对博客存储目录有读写权限
4. **Next.js App Router**：必须使用 App Router 架构，不使用 Pages Router

### 性能约束
1. **元数据缓存**：必须通过 `meta.json` 缓存元数据，避免频繁文件系统扫描
2. **按需加载**：博客内容应按需加载，列表页面只加载元数据
3. **图片优化**：上传的图片应进行压缩和缩略图生成

### 依赖管理约束
1. **使用 pnpm**：必须使用 pnpm 作为包管理器，不使用 npm 或 yarn
2. **避免过度依赖**：尽量使用原生方法和已有依赖，避免引入不必要的第三方库
3. **版本锁定**：重要依赖应锁定版本，避免自动升级导致的兼容性问题

### 安全约束
1. **环境变量**：敏感信息（JWT_SECRET、管理员密码）必须通过环境变量配置
2. **JWT 过期**：Access token 短期（1小时），Refresh token 长期（7天）
3. **httpOnly Cookie**：认证 token 必须使用 httpOnly cookie 存储
4. **路径遍历防护**：必须验证和清理用户输入的文件路径

### 部署约束
1. **Docker 支持**：提供 Dockerfile 和 docker-compose.yml
2. **环境配置**：必须通过 `.env.local` 配置环境变量
3. **端口配置**：默认使用 3001 端口（可配置）

## External Dependencies

### 开发环境
- **Node.js**：v20+ 推荐
- **pnpm**：包管理器

### 运行时依赖
- **文件系统**：需要可读写的文件系统（Docker 需要挂载 volume）
- **环境变量**：
  - `BLOG_ROOT_DIR` - 博客存储目录（默认：`blogs`）
  - `JWT_SECRET` - JWT 密钥
  - `ADMIN_EMAIL` - 管理员邮箱
  - `ADMIN_PASSWORD` - 管理员密码

### 外部服务
当前无外部服务依赖。

**未来可能集成：**
- 对象存储（OSS、S3）用于图片存储
- CDN 用于静态资源加速
- 搜索引擎（Elasticsearch）用于全文搜索
- 评论系统（第三方服务）
- 统计分析（Google Analytics）

### NPM 包依赖
详见 `package.json`。

**核心依赖分类：**
- UI 框架：Next.js, React, Tailwind CSS
- Markdown 渲染：react-markdown, remark-*, rehype-*
- 数学和图表：katex, mermaid
- 状态管理：zustand
- 认证：jsonwebtoken
- 图像处理：sharp
- 工具库：lodash, classnames, yaml

### 开发工具依赖
- **ESLint**：代码规范检查
- **TypeScript**：类型检查
- **PostCSS**：CSS 处理
- **Tailwind CSS**：样式构建
