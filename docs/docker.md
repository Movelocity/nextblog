# Docker 镜像发布指南

本指南介绍如何使用 Git 标签创建新的 Docker 镜像版本，并查找已构建的镜像。

## 创建新版本

### 1. 确保代码已准备就绪
```bash
# 确保在主分支且代码是最新的
git checkout main
git pull origin main

# 检查状态以确保一切干净
git status
```

### 2. 创建并推送新标签
```bash
# 创建新标签（将 X.Y.Z 替换为你的版本号）
git tag vX.Y.Z

# 将标签推送到 GitHub
git push origin vX.Y.Z
```

示例：
```bash
git tag v1.0.0
git push origin v1.0.0
```

## 标签如何触发构建

1. 当你推送以 'v' 开头的标签时，它会自动触发 `.github/workflows/docker-publish.yml` 中定义的 GitHub Action 工作流。
2. 工作流将：
   - 使用 Dockerfile 构建 Docker 镜像。
   - 为镜像打上多个版本标签：
     * 完整版本（如 `v1.0.0`）。
     * 主.次版本（如 `1.0`）。
     * 提交 SHA。
     * `latest` 标签（仅在默认分支上）。
   - 将镜像推送到 GitHub Container Registry (ghcr.io)。

## 查找已构建的镜像

### 1. 通过 GitHub 界面
1. 进入你的 GitHub 仓库。
2. 点击 "Packages" 选项卡。
3. 找到名为 `ghcr.io/[username]/nextblog` 的容器镜像。
4. 点击包以查看所有可用标签。

### 2. 通过命令行
```bash
# 拉取特定版本
docker pull ghcr.io/[username]/nextblog:v1.0.0

# 或拉取最新版本
docker pull ghcr.io/[username]/nextblog:latest
```

### 3. 监控构建进度
1. 进入你的 GitHub 仓库。
2. 点击 "Actions" 选项卡。
3. 查找由标签推送触发的工作流运行。
4. 点击工作流以查看详细的构建日志。

## 使用已构建的镜像

```bash
# 运行容器（将 [username] 替换为你的 GitHub 用户名）
docker run -p 3000:3000 ghcr.io/[username]/nextblog:v1.0.0
```

### 配置环境变量

可以通过以下方式在启动容器时配置环境变量：

1. 使用 `-e` 参数设置单个环境变量：
```bash
docker run -p 3000:3000 -e JWT_SECRET=your-secret-key ghcr.io/[username]/nextblog:v1.0.0
```

2. 使用 `--env-file` 参数从文件加载多个环境变量（推荐）：
```bash
docker run -p 3000:3000 --env-file .env ghcr.io/[username]/nextblog:v1.0.0
```

3. 查看 `.env.example` 文件了解需要配置的环境变量：
```bash
BLOG_ROOT_DIR=blogs  # 博客存储目录（默认：'blogs'）
JWT_SECRET=your-super-secret-jwt-key  # JWT 密钥 用于用户认证
ADMIN_EMAIL=nextblog@example.com  # 管理员邮箱, 请修改为你的邮箱
ADMIN_PASSWORD=nextblog123  # 管理员密码, 自行修改
```

4. 配置备案信息（可选）：
编辑 `blogs/site-config.json` 文件：
```json
{
  "icpInfo": "粤ICP备xxx号-1",
  "siteName": "Next Blog",
  "siteDescription": "A modern blog management system"
}
```

注意：
- 确保 `.env` 文件中的敏感信息（如密码、密钥）不被提交到版本控制
- 生产环境建议使用更安全的方式管理密钥，如Docker secrets或Kubernetes secrets
- `site-config.json` 可以在运行时修改，无需重新构建镜像

## 版本标签格式

我们使用语义化版本（MAJOR.MINOR.PATCH）：
- MAJOR 版本用于不兼容的 API 更改。
- MINOR 版本用于向后兼容的新功能。
- PATCH 版本用于向后兼容的 bug 修复。

示例版本：
- v1.0.0 - 初始版本。
- v1.0.1 - Bug 修复。
- v1.1.0 - 新功能。
- v2.0.0 - 重大变更。

## 博客文件路径映射

当直接使用 `docker run` 命令部署时，可以通过 `-v` 参数将宿主机的博客存储目录映射到容器内。例如：

```bash
docker run -p 3000:3000 -v /path/on/host/blogs:/app/blogs ghcr.io/[username]/nextblog:v1.0.0
```

说明：
- `/path/on/host/blogs` 是宿主机上的绝对路径，用于存储博客数据。
- `/app/blogs` 是容器内的路径，对应环境变量 `BLOG_ROOT_DIR=blogs`。

确保宿主机的目录有适当的读写权限。

## 故障排除

如果构建失败：
1. 检查 Actions 选项卡中的错误消息。
2. 确保 GitHub Container Registry 已在仓库设置中启用。
3. 验证你是否有正确的权限。
4. 检查 Dockerfile 是否可以在本地构建：
   ```bash
   docker build -t nextblog:test .
   ``` 