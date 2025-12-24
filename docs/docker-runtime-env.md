# Docker 运行时环境变量注入

## 问题背景

在使用只读文件系统（`read_only: true`）的 Docker 容器中，需要在运行时将环境变量注入到前端可访问的 JavaScript 文件中。这样可以避免在构建时硬编码配置，实现真正的运行时配置。

## 解决方案

### 1. tmpfs 挂载

在 `docker-compose.yml` 中添加 `tmpfs` 挂载，允许特定目录可写：

```yaml
tmpfs:
  - /tmp:mode=1777
  - /app/public:mode=755,uid=1001,gid=1001  # 允许写入 runtime-env.js
  - /app/.next/cache:mode=755,uid=1001,gid=1001  # Next.js 缓存目录
```

**优势**：
- 保持根文件系统只读，提高安全性
- tmpfs 是内存文件系统，读写速度快
- 容器重启时自动清理，不会残留旧配置

**静态资源处理**：
- Dockerfile 在构建时将 `public` 目录备份到 `.public-backup`
- entrypoint.sh 启动时从备份恢复所有静态资源（SVG、favicon 等）
- 然后生成新的 `runtime-env.js` 文件
- 这样既保证了静态资源可用，又允许运行时配置注入

### 2. entrypoint.sh 动态生成

启动脚本 `entrypoint.sh` 会在容器启动时自动生成 `runtime-env.js`：

```javascript
window.__RUNTIME_CONFIG__ = {
  API_BASE_URL: "http://your-api-url:8080/api",
};
```

### 3. 前端读取配置

在 `web/app/utils/globals.ts` 中：

```typescript
get API_BASE_URL(): string {
  if (typeof window !== "undefined") {
    return window.__RUNTIME_CONFIG__?.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
  }
  return process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
}
```

## 使用方法

### 1. 配置环境变量

在 `.env` 文件中设置：

```bash
API_BASE_URL=http://localhost:8080/api
# 可选：指定要注入的环境变量（默认为 API_BASE_URL）
RUNTIME_ENV_VARS=API_BASE_URL
```

### 2. 支持多个环境变量

如果需要注入多个环境变量，使用逗号分隔：

```bash
RUNTIME_ENV_VARS=API_BASE_URL,NEXT_PUBLIC_IMG_CDN,ANOTHER_VAR
```

### 3. 自定义运行时键名

支持映射环境变量到不同的运行时键名：

```bash
# 格式：ENV_NAME:runtimeKey
RUNTIME_ENV_VARS=API_BASE_URL:apiBaseUrl,NEXT_PUBLIC_IMG_CDN:imgCdn
```

这样生成的配置会是：

```javascript
window.__RUNTIME_CONFIG__ = {
  apiBaseUrl: "http://localhost:8080/api",
  imgCdn: "https://cdn.example.com",
};
```

## 安全考虑

1. **只读根文件系统**：除了 tmpfs 挂载的目录外，其他目录都是只读的
2. **最小权限原则**：tmpfs 只挂载必要的目录（`/tmp`, `/app/public`, `/app/.next/cache`）
3. **非 root 用户**：容器以 `1001:1001` 用户运行
4. **敏感信息**：不要在 `RUNTIME_ENV_VARS` 中包含敏感信息（如密钥、密码），这些值会暴露给前端

## 验证

### 1. 检查生成的文件

启动容器后，查看生成的配置：

```bash
docker exec nextblog-app cat /app/public/runtime-env.js
```

应该看到：

```javascript
window.__RUNTIME_CONFIG__ = {
  "API_BASE_URL": "http://localhost:8080/api"
};
```

### 2. 浏览器检查

在浏览器控制台中：

```javascript
console.log(window.__RUNTIME_CONFIG__);
// 输出: { API_BASE_URL: "http://localhost:8080/api" }
```

## 故障排查

### 问题：无法写入 runtime-env.js

**症状**：
```
/entrypoint.sh: line X: cannot create /app/public/runtime-env.js: Read-only file system
```

**解决**：
- 确保 docker-compose.yml 中有正确的 tmpfs 配置
- 检查 tmpfs 的 uid/gid 是否与容器用户匹配

### 问题：前端获取不到配置

**检查清单**：
1. 确保 `runtime-env.js` 在 `<Script>` 标签中以 `beforeInteractive` 策略加载
2. 检查浏览器 Network 面板，确认 `runtime-env.js` 成功加载
3. 在控制台检查 `window.__RUNTIME_CONFIG__` 是否存在

### 问题：Alpine Linux 的 sed 不支持 -i

**症状**：
```
sed: invalid option -- i
```

**解决**：
entrypoint.sh 已经使用了 Alpine 兼容的 sed 语法。如果仍有问题，可以使用备用方案：

```bash
# 创建临时文件
tmp_file=$(mktemp)
sed 's/,\([[:space:]]*\)};/\1};/' "${RUNTIME_CONFIG_PATH}" > "$tmp_file"
mv "$tmp_file" "${RUNTIME_CONFIG_PATH}"
```

## 最佳实践

1. **开发环境**：使用 `.env.local` 设置环境变量
2. **生产环境**：通过 Docker secrets 或环境变量管理工具注入
3. **CI/CD**：在部署流水线中设置环境变量
4. **版本控制**：不要提交 `.env` 文件到版本控制系统

## 参考

- [Next.js Runtime Configuration](https://nextjs.org/docs/api-reference/next.config.js/runtime-configuration)
- [Docker tmpfs mounts](https://docs.docker.com/storage/tmpfs/)
- [Docker read-only root filesystem](https://docs.docker.com/engine/security/rootless/)

