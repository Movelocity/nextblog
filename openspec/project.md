# 项目上下文

## 项目目的
NextBlog 是一个现代化、高性能且易于定制的博客管理系统，采用前后端分离架构。

主要目标：
- 提供功能完善的博客文章和笔记管理系统
- 支持 Markdown 富文本编写（含数学公式、图表）
- 提供响应式设计，适配移动端、平板、桌面端
- 支持 Docker 一键部署

## 技术栈

### 后端 (server/)
- **Go** 1.22+ - 主要编程语言
- **Gin** v1.10 - Web 框架
- **GORM** v1.25 - ORM 框架
- **SQLite** - 数据库（零配置）
- **JWT** (golang-jwt/jwt/v5) - 身份认证
- **Imaging** - 图片处理

### 前端 (web/)
- **Next.js** 15.1.9 - React 框架（使用 App Router）
- **React** 19 - UI 库
- **TypeScript** 5 - 类型安全
- **Tailwind CSS** 3 - 样式框架
- **Zustand** 5 - 状态管理
- **CodeMirror** 6 - 代码编辑器
- **react-markdown** - Markdown 渲染
- **KaTeX** - 数学公式渲染
- **Mermaid** - 图表渲染
- **react-icons** - 图标库
- **classnames** - 条件类名

### 其他
- **pnpm** - 前端包管理器
- **Docker** - 容器化部署
- **RESTful API** - API 设计风格

## 项目规范

### 代码风格

#### 前端 (TypeScript/React)
- 使用 **Tailwind CSS** 进行样式设计，CSS 是备选方案
- 使用 **早期返回 (early returns)** 提高代码可读性
- 使用描述性的变量和函数名
- 事件处理函数使用 `handle` 前缀（如 `handleClick`、`handleKeyDown`）
- 使用 `const` 箭头函数定义函数组件和方法
- 使用 `classnames` 库处理条件类名
- **禁止使用 Next.js 中间件**，使用 wrappers 替代
- **只使用 react-icons** 作为图标库
- 所有 API 请求通过 `services/` 目录统一管理，组件不直接执行 fetch
- 新增类或方法必须添加 JSDoc 注释 `/** */`
- 代码中的日志和注释使用**中文**，便于中文团队维护

#### 后端 (Go)
- 遵循 Go 标准代码风格
- 使用 Go modules 管理依赖
- API 处理器添加完整注释
- 分层架构：`api/` (处理器) → `repository/` (数据访问) → `models/` (数据模型)

### 架构模式

#### 目录结构
```
nextblog/
├── server/              # Go 后端
│   ├── cmd/            # 命令行入口
│   │   ├── server/     # 主服务入口
│   │   └── migrate/    # 数据迁移工具
│   ├── internal/       # 内部包
│   │   ├── api/        # API 处理器 (Handlers)
│   │   ├── config/     # 配置管理
│   │   ├── db/         # 数据库连接
│   │   ├── middleware/ # 中间件（CORS, Auth, Logger）
│   │   ├── models/     # 数据模型
│   │   ├── repository/ # 数据访问层
│   │   ├── service/    # 业务服务层
│   │   └── storage/    # 文件存储
│   └── data/           # SQLite 数据库和文件存储
├── web/                # Next.js 前端
│   └── app/
│       ├── (views)/    # 页面组件
│       ├── common/     # 共享类型和配置
│       ├── components/ # 可复用的 React 组件
│       ├── hooks/      # React Hooks
│       ├── services/   # API 客户端服务
│       ├── stores/     # Zustand 状态管理
│       └── utils/      # 工具函数
├── docs/               # 项目文档
└── openspec/           # OpenSpec 规范文件
```

#### API 设计
- RESTful 风格
- 基础路径: `/api`
- 认证: JWT Bearer Token
- 公开路由（读取）和认证路由（写入）分离
- 响应格式: JSON

#### 主要 API 端点
- `GET/POST /api/posts` - 文章列表/创建
- `GET/PUT/DELETE /api/posts/:id` - 文章详情/更新/删除
- `GET/POST /api/notes` - 笔记管理
- `GET /api/categories` - 分类列表
- `GET /api/tags` - 标签列表
- `POST /api/assets` - 资源上传
- `POST /api/auth/login` - 用户登录
- `GET /api/config` - 站点配置

### 测试策略
- API 集成测试: `scripts/test-api-integration.js`
- 确保 Go 后端运行后执行测试
- 暂无前端单元测试（计划中）

### Git 工作流
- 特性分支: `feature/功能描述`
- 提交信息: 简洁描述变更内容
- 提交前确保代码无 lint 错误
- PR 提交到 main 分支

## 领域上下文

### 核心概念
- **Post (文章)**: 博客文章，包含标题、内容、分类、标签、发布状态
- **Note (笔记)**: 轻量级笔记，支持按日期组织
- **Category (分类)**: 文章分类，用于内容组织
- **Tag (标签)**: 文章标签，用于内容发现
- **Asset (资源)**: 图片和文件资源，关联到文章

### 用户角色
- **Admin (管理员)**: 完全权限，可管理所有内容和系统配置
- **Visitor (访客)**: 只读权限，可浏览公开内容

### 数据存储
- 文章和笔记: SQLite 数据库 (`server/data/nextblog.db`)
- 图片和文件: 文件系统 (`server/data/files/`)
- 缩略图缓存: `server/data/thumbnails/`

## 重要约束

### 技术约束
- 前端包管理器**必须使用 pnpm**
- 后端依赖管理使用 Go modules
- 避免过度使用第三方库，尽量使用原生方法
- 默认实现保持简单（<100 行新代码）
- 单文件实现优先，除非确实需要拆分

### 性能约束
- SQLite 适用于中小规模部署
- 大规模部署考虑 Redis 缓存（计划中）
- 图片需要考虑 CDN 支持（计划中）

### 安全约束
- 所有写操作需要 JWT 认证
- 敏感操作需要管理员角色
- 环境变量存储敏感配置

## 外部依赖

### 数据库
- **SQLite**: 嵌入式数据库，无需额外配置
- 数据文件位置: `server/data/nextblog.db`

### 认证
- **JWT**: 无状态认证
- Access Token + Refresh Token 机制
- 支持多设备登录

### 文件存储
- 本地文件系统存储
- 支持图片上传和缩略图生成
- 存储路径可配置

### 开发工具
- **ESLint**: 前端代码检查
- **TypeScript**: 类型检查
- **Go vet**: 后端代码检查

## 环境配置

### 前端环境变量
```env
# Go 后端 API 地址
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
```

### 后端环境变量
```env
# 服务端口
PORT=8080
# 数据库路径
DB_PATH=./data/nextblog.db
# JWT 密钥
JWT_SECRET=your-secret-key
# 存储路径
STORAGE_PATH=./data/files
```

## 开发命令

### 前端
```bash
cd web
pnpm install    # 安装依赖
pnpm dev        # 启动开发服务器 (端口 3001)
pnpm build      # 构建生产版本
pnpm lint       # 代码检查
```

### 后端
```bash
cd server
make run        # 启动开发服务器
make build      # 构建二进制
./bin/server    # 运行编译后的服务
```

### Docker
```bash
docker-compose up -d      # 启动所有服务
docker-compose logs -f    # 查看日志
docker-compose down       # 停止服务
```
