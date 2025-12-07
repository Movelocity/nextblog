# API 迁移指南 - 从 Next.js 后端到 Go 后端

## 概述

本文档说明如何将前端从 Next.js API 路由切换到 Go 后端 API。

## 迁移摘要

### 已完成的工作

✅ **基础配置**
- 创建环境变量配置系统（`NEXT_PUBLIC_API_BASE_URL`）
- 更新 `utils.ts` 支持动态 API 基础 URL
- 提供自动路径构建和 API 适配

✅ **服务层更新**
- `posts.ts` - 文章管理服务
- `notes.ts` - 笔记管理服务
- `system.ts` - 系统配置服务
- `assets.ts` - 资产管理服务
- `image.ts` - 图片管理服务

✅ **响应格式适配**
- 自动转换 Go 后端响应格式到前端期望格式
- 保持前端组件代码不变

## 快速开始

### 1. 创建环境变量配置

在项目根目录创建 `.env.local` 文件：

```bash
cat > .env.local << 'EOF'
# Go 后端 API 地址
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
EOF
```

### 2. 启动 Go 后端

```bash
cd server
./bin/server
# 或
make run
```

后端将运行在 `http://localhost:8080`

### 3. 启动 Next.js 前端

```bash
# 确保已创建 .env.local
pnpm dev
```

前端将运行在 `http://localhost:3000`

### 4. 验证集成

访问 `http://localhost:3000`，前端应该自动从 Go 后端获取数据。

## API 映射对照表

### Posts（文章）

| 功能 | Next.js API | Go 后端 API | 状态 |
|------|-------------|-------------|------|
| 获取列表 | `GET /api/posts` | `GET /api/posts` | ✅ |
| 获取详情 | `GET /api/posts?id={id}` | `GET /api/posts/:id` | ✅ |
| 创建文章 | `POST /api/posts` | `POST /api/posts` | ✅ |
| 更新文章 | `PUT /api/posts?id={id}` | `PUT /api/posts/:id` | ✅ |
| 删除文章 | `DELETE /api/posts?id={id}` | `DELETE /api/posts/:id` | ✅ |
| 搜索文章 | - | `GET /api/posts/search?keyword={q}` | ✅ |
| 按分类 | - | `GET /api/posts/category/:category` | ✅ |
| 按标签 | - | `GET /api/posts/tag/:tag` | ✅ |

**响应格式变化：**
```typescript
// Next.js
{ blogs_info: BlogMeta[], total: number }

// Go 后端
{ posts: Post[], total: number, page: number, pageSize: number, totalPages: number }

// 适配层自动转换为 Next.js 格式
```

### Notes（笔记）

| 功能 | Next.js API | Go 后端 API | 状态 |
|------|-------------|-------------|------|
| 获取列表 | `GET /api/notes` | `GET /api/notes` | ✅ |
| 获取详情 | `GET /api/notes?id={id}` | `GET /api/notes/detail/:id` | ✅ |
| 按日期获取 | - | `GET /api/notes/date/:date` | ✅ |
| 公开笔记 | - | `GET /api/notes/public` | ✅ |
| 创建笔记 | `POST /api/notes` | `POST /api/notes` | ✅ |
| 更新笔记 | `PUT /api/notes` | `PUT /api/notes/:id` | ✅ |
| 删除笔记 | `DELETE /api/notes?id={id}` | `DELETE /api/notes/:id` | ✅ |

### Categories & Tags（分类和标签）

| 功能 | Next.js API | Go 后端 API | 状态 |
|------|-------------|-------------|------|
| 获取分类 | `GET /api/taxonomy` | `GET /api/categories` | ✅ |
| 获取标签 | `GET /api/taxonomy` | `GET /api/tags` | ✅ |
| 分类详情 | - | `GET /api/categories/:name` | ✅ |
| 标签详情 | - | `GET /api/tags/:name` | ✅ |

**响应格式变化：**
```typescript
// Next.js
{ categories: string[], tags: string[] }

// Go 后端
// Categories: [{ name: string, count: number }]
// Tags: [{ name: string, count: number }]

// 适配层自动提取 name 字段
```

### Images（图片）

| 功能 | Next.js API | Go 后端 API | 状态 |
|------|-------------|-------------|------|
| 上传图片 | `POST /api/asset/image` | `POST /api/images/upload` | ✅ |
| 获取图片 | `GET /api/asset/image/:id` | `GET /api/images/:filename` | ✅ |
| 删除图片 | `DELETE /api/asset/image/:id` | `DELETE /api/images/:filename` | ✅ |
| 图片列表 | - | `GET /api/images` | ✅ |
| 缩略图 | `GET /api/asset/thumbnail/:id` | - | ⚠️ 暂不支持 |

### System（系统配置）

| 功能 | Next.js API | Go 后端 API | 状态 |
|------|-------------|-------------|------|
| 获取配置 | `GET /api/system/site-config` | `GET /api/config` | ✅ |
| 更新配置 | `POST /api/system/site-config` | `PUT /api/config` | ✅ |
| 健康检查 | - | `GET /api/health` | ✅ |
| 系统状态 | `GET /api/system` | - | ⚠️ 暂不支持 |

### Assets（资产管理）

| 功能 | Next.js API | Go 后端 API | 状态 |
|------|-------------|-------------|------|
| 上传资产 | `POST /api/asset` | `POST /api/images/upload` | ✅ |
| 删除资产 | `DELETE /api/asset` | `DELETE /api/images/:filename` | ✅ |
| 资产列表 | `GET /api/asset?blogId={id}` | - | ⚠️ 暂不支持 |

### Image Edit（图片编辑）

| 功能 | Next.js API | Go 后端 API | 状态 |
|------|-------------|-------------|------|
| 所有功能 | `GET/POST/PUT/DELETE /api/image-edit` | - | ⚠️ 暂不支持 |

## 功能差异说明

### ✅ 完全支持的功能

1. **文章管理（Posts）**
   - CRUD 操作
   - 搜索、分类、标签筛选
   - 分页

2. **笔记管理（Notes）**
   - CRUD 操作
   - 按日期查询
   - 公开/私有笔记

3. **分类和标签**
   - 列表查询
   - 详情查询

4. **图片管理**
   - 上传、删除
   - 图片列表

5. **站点配置**
   - 读取和更新

### ⚠️ 部分支持的功能

1. **图片缩略图**
   - Go 后端暂未实现缩略图生成
   - 前端自动回退到使用原图

2. **按博客分组的资产管理**
   - Go 后端使用全局图片管理
   - 不支持按博客 ID 分组

### ❌ 暂不支持的功能

1. **系统状态监控**
   - `getSystemStatus()` 暂不可用
   - 可使用 `getHealth()` 作为替代

2. **图片编辑（AI 功能）**
   - 完整的图片编辑工作流暂不可用
   - 需要后续在 Go 后端实现

## 开发者注意事项

### 1. 环境变量

确保在所有环境中正确配置 `NEXT_PUBLIC_API_BASE_URL`：

- **开发环境**: `http://localhost:8080/api`
- **生产环境**: `https://your-domain.com/api`
- **Docker**: `http://nextblog-server:8080/api`

### 2. CORS 配置

Go 后端需要允许来自前端的跨域请求。检查 `server/internal/middleware/cors.go`：

```go
allowedOrigins := []string{
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    // 添加生产环境域名
}
```

### 3. 认证令牌

服务层自动添加 Authorization 头：

```typescript
// 自动从 cookie 或 localStorage 读取
Authorization: Bearer <token>
```

### 4. 错误处理

Go 后端的错误响应格式：

```json
{
  "error": "Error message"
}
```

前端 `utils.ts` 自动解析并抛出 `ApiError`。

### 5. 响应格式适配

所有服务层都包含响应格式适配逻辑，确保：

- 前端组件代码无需修改
- 类型安全
- 向后兼容

## 测试建议

### 1. 基础功能测试

```bash
# 测试文章列表
curl http://localhost:8080/api/posts

# 测试健康检查
curl http://localhost:8080/api/health

# 测试配置
curl http://localhost:8080/api/config
```

### 2. 前端集成测试

1. 访问首页，检查文章列表是否正常加载
2. 创建/编辑/删除文章
3. 上传图片
4. 修改站点配置
5. 创建和管理笔记

### 3. 网络请求检查

打开浏览器开发者工具 → Network 标签：

- 确认所有请求指向 `http://localhost:8080/api`
- 检查响应状态码（应为 200/201）
- 检查 CORS 头部

## 回退到 Next.js API

如果需要回退到使用 Next.js 自己的 API 路由：

1. 删除或重命名 `.env.local`
2. 重启 Next.js 开发服务器

前端会自动使用相对路径 `/api`，调用 Next.js API 路由。

## 故障排除

### 问题 1: 请求超时

**原因**: Go 后端未启动或端口不正确

**解决方案**:
```bash
# 检查后端是否运行
curl http://localhost:8080/api/health

# 启动后端
cd server && ./bin/server
```

### 问题 2: CORS 错误

**原因**: 后端未允许前端域名

**解决方案**:
检查 `server/internal/middleware/cors.go` 并添加前端域名。

### 问题 3: 环境变量不生效

**原因**: Next.js 未重启

**解决方案**:
修改 `.env.local` 后必须重启 Next.js：
```bash
# Ctrl+C 停止
pnpm dev
```

### 问题 4: 图片无法显示

**原因**: 图片 URL 路径问题

**解决方案**:
确保 `NEXT_PUBLIC_API_BASE_URL` 是完整的 URL（包含 `http://` 或 `https://`）。

## 性能优化建议

1. **使用 CDN**
   - 将图片存储迁移到 CDN
   - 在 `imageAssetService.getImageUrl()` 中配置 CDN 域名

2. **启用缓存**
   - Go 后端添加 Redis 缓存
   - 前端使用 SWR 或 React Query

3. **压缩响应**
   - Go 后端启用 Gzip

4. **连接池**
   - 配置数据库连接池
   - 调整 HTTP 客户端超时设置

## 下一步计划

1. **实现图片编辑 API**
   - 在 Go 后端实现 AI 图片编辑功能
   - 更新前端 `imageEditService`

2. **实现系统监控 API**
   - 添加系统状态监控端点
   - 更新前端 `getSystemStatus()`

3. **实现缩略图生成**
   - Go 后端添加图片处理库
   - 自动生成和管理缩略图

4. **添加认证和授权**
   - JWT 认证
   - 基于角色的权限控制

## 相关文档

- [ENV_SETUP.md](./ENV_SETUP.md) - 环境变量配置详细说明
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - 项目迁移总结
- [server/README.md](./server/README.md) - Go 后端文档
- [QUICKSTART.md](./QUICKSTART.md) - 快速开始指南

