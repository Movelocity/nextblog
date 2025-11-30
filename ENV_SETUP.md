# 环境变量配置说明

## 概述

本项目已从 Next.js 全栈应用迁移到前后端分离架构。前端（Next.js）现在需要通过环境变量配置后端 API 地址。

## 配置步骤

### 1. 创建 .env.local 文件

在项目根目录创建 `.env.local` 文件（此文件不会被 git 跟踪）：

```bash
# 在项目根目录执行
cat > .env.local << 'EOF'
# Next.js 前端环境变量配置

# Go 后端 API 基础 URL
# 开发环境使用本地后端
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api

# 如果部署到生产环境，修改为：
# NEXT_PUBLIC_API_BASE_URL=https://your-domain.com/api
EOF
```

### 2. 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NEXT_PUBLIC_API_BASE_URL` | Go 后端 API 基础 URL | `http://localhost:8080/api` |

**注意：** 
- 使用 `NEXT_PUBLIC_` 前缀的环境变量会被嵌入到客户端代码中
- 修改环境变量后需要重启 Next.js 开发服务器

### 3. 不同环境的配置

#### 开发环境
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
```

#### 生产环境
```env
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api
```

#### Docker 部署
如果前后端都在 Docker 容器中，可以使用容器名称：
```env
NEXT_PUBLIC_API_BASE_URL=http://nextblog-server:8080/api
```

## 启动顺序

1. **启动 Go 后端**
   ```bash
   cd server
   ./bin/server
   # 或
   make run
   ```
   后端将运行在 `http://localhost:8080`

2. **启动 Next.js 前端**
   ```bash
   # 确保已创建 .env.local 文件
   pnpm dev
   # 或
   npm run dev
   ```
   前端将运行在 `http://localhost:3000`

## 验证配置

1. 访问 `http://localhost:3000`
2. 打开浏览器开发者工具的 Network 标签
3. 检查 API 请求是否指向 `http://localhost:8080/api`

## 故障排除

### 问题：前端显示 "Failed to fetch"

**解决方案：**
1. 确认 Go 后端正在运行：
   ```bash
   curl http://localhost:8080/api/health
   ```
2. 检查 CORS 配置（后端应该允许来自 `http://localhost:3000` 的请求）
3. 检查 `.env.local` 文件中的 URL 是否正确

### 问题：环境变量不生效

**解决方案：**
1. 确认文件名为 `.env.local`（注意前面的点）
2. 确认变量名有 `NEXT_PUBLIC_` 前缀
3. 重启 Next.js 开发服务器（`Ctrl+C` 然后重新运行 `pnpm dev`）

### 问题：CORS 错误

**解决方案：**
检查 Go 后端的 CORS 配置，确保允许前端域名：
```go
// server/internal/middleware/cors.go
allowedOrigins := []string{
    "http://localhost:3000",
    "http://127.0.0.1:3000",
}
```

## 相关文档

- [QUICKSTART.md](./QUICKSTART.md) - 快速开始指南
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - 项目架构说明
- [server/README.md](./server/README.md) - Go 后端文档

