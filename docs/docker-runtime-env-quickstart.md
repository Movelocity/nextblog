# Docker 运行时环境变量注入 - 快速开始

## 📋 问题解决方案总结

本方案解决了在只读文件系统的 Docker 容器中动态注入运行时环境变量的问题。

### 核心原理

1. **tmpfs 挂载**：使用内存文件系统挂载 `/app/public` 目录，允许运行时写入
2. **静态资源备份**：构建时备份 `public` 目录到 `.public-backup`
3. **启动时恢复**：容器启动时从备份恢复静态资源，然后生成 `runtime-env.js`
4. **前端读取**：通过 `window.__RUNTIME_CONFIG__` 访问运行时配置

## 🚀 快速开始

### 1. 创建环境变量文件

创建 `.env` 文件（如果不存在）：

```bash
# .env
NODE_ENV=production
API_BASE_URL=http://localhost:8080/api
RUNTIME_ENV_VARS=API_BASE_URL
```

### 2. 启动容器

```bash
docker-compose up -d
```

### 3. 验证配置

检查生成的配置文件：

```bash
docker exec nextblog-app cat /app/public/runtime-env.js
```

应该看到：

```javascript
window.__RUNTIME_CONFIG__ = {
  "API_BASE_URL": "http://localhost:8080/api"
};
```

### 4. 浏览器验证

访问 `http://localhost:3000`，在浏览器控制台输入：

```javascript
console.log(window.__RUNTIME_CONFIG__);
// 输出: { API_BASE_URL: "http://localhost:8080/api" }
```

## 🔧 完整测试

运行自动化测试脚本：

```bash
./test-runtime-env.sh
```

这个脚本会：
- ✅ 检查配置文件
- ✅ 构建镜像
- ✅ 启动容器
- ✅ 验证 runtime-env.js 生成
- ✅ 检查环境变量注入
- ✅ 验证静态资源恢复
- ✅ 测试 HTTP 访问

## 📁 修改的文件

### 1. `docker-compose.yml`

添加了 tmpfs 挂载：

```yaml
tmpfs:
  - /tmp:mode=1777
  - /app/public:mode=755,uid=1001,gid=1001
  - /app/.next/cache:mode=755,uid=1001,gid=1001
```

### 2. `Dockerfile`

添加了 public 目录备份：

```dockerfile
COPY --from=builder /app/public ./public
# 备份 public 目录用于运行时恢复
COPY --from=builder /app/public ./.public-backup
```

### 3. `entrypoint.sh`

添加了静态资源恢复和配置生成逻辑：

```bash
# 从备份恢复静态资源
if [ -d "/app/.public-backup" ]; then
  cp -r /app/.public-backup/* /app/public/
fi

# 生成 runtime-env.js
cat > /app/public/runtime-env.js << EOF
window.__RUNTIME_CONFIG__ = {
  "API_BASE_URL": "${API_BASE_URL}",
};
EOF
```

### 4. `web/public/runtime-env.js`

添加了占位文件（会在运行时被覆盖）：

```javascript
// 此文件在容器启动时由 entrypoint.sh 生成
window.__RUNTIME_CONFIG__ = {
  API_BASE_URL: "",
};
```

### 5. `web/app/(fullpage)/layout.tsx`

已经正确配置了脚本加载：

```tsx
<Script src="/runtime-env.js" strategy="beforeInteractive" />
```

### 6. `web/app/utils/globals.ts`

已经实现了配置读取逻辑：

```typescript
get API_BASE_URL(): string {
  if (typeof window !== "undefined") {
    return window.__RUNTIME_CONFIG__?.API_BASE_URL || "";
  }
  return process.env.API_BASE_URL || "";
}
```

## 🎯 高级配置

### 注入多个环境变量

```bash
# .env
API_BASE_URL=http://localhost:8080/api
NEXT_PUBLIC_IMG_CDN=https://cdn.example.com
FEATURE_FLAG_NEW_UI=true

RUNTIME_ENV_VARS=API_BASE_URL,NEXT_PUBLIC_IMG_CDN,FEATURE_FLAG_NEW_UI
```

### 自定义键名映射

```bash
# 格式：ENV_NAME:runtimeKey
RUNTIME_ENV_VARS=API_BASE_URL:apiUrl,NEXT_PUBLIC_IMG_CDN:cdnUrl
```

生成结果：

```javascript
window.__RUNTIME_CONFIG__ = {
  "apiUrl": "http://localhost:8080/api",
  "cdnUrl": "https://cdn.example.com"
};
```

### 在代码中使用

在 `globals.ts` 中添加新的配置项：

```typescript
const globals = {
  get API_BASE_URL(): string {
    if (typeof window !== "undefined") {
      return window.__RUNTIME_CONFIG__?.API_BASE_URL || "";
    }
    return process.env.API_BASE_URL || "";
  },
  
  get IMG_CDN(): string {
    if (typeof window !== "undefined") {
      return window.__RUNTIME_CONFIG__?.NEXT_PUBLIC_IMG_CDN || "";
    }
    return process.env.NEXT_PUBLIC_IMG_CDN || "";
  },
};
```

## 🔒 安全注意事项

### ⚠️ 不要注入敏感信息

`runtime-env.js` 会暴露给前端，**切勿**注入以下内容：

- ❌ API 密钥
- ❌ 数据库密码
- ❌ JWT 密钥
- ❌ 第三方服务的 Secret

### ✅ 可以安全注入的内容

- ✅ 公开 API 端点
- ✅ CDN 地址
- ✅ 功能开关（feature flags）
- ✅ 公开的配置参数

## 🐛 故障排查

### 问题 1: 容器启动失败

```bash
# 查看日志
docker-compose logs -f

# 检查 entrypoint.sh 输出
docker logs nextblog-app 2>&1 | grep "Generating runtime-env.js"
```

### 问题 2: runtime-env.js 为空或不正确

```bash
# 检查文件内容
docker exec nextblog-app cat /app/public/runtime-env.js

# 检查环境变量
docker exec nextblog-app env | grep API_BASE_URL

# 重启容器
docker-compose restart
```

### 问题 3: 静态资源丢失（404 错误）

```bash
# 检查 public 目录内容
docker exec nextblog-app ls -la /app/public/

# 检查备份目录
docker exec nextblog-app ls -la /app/.public-backup/

# 如果备份存在但未恢复，检查 entrypoint.sh 日志
docker logs nextblog-app 2>&1 | grep "Restoring public directory"
```

### 问题 4: 前端获取不到配置

1. 打开浏览器开发者工具 → Network
2. 检查 `runtime-env.js` 是否成功加载（应该是 200 状态）
3. 在 Console 中检查：`console.log(window.__RUNTIME_CONFIG__)`
4. 如果是 `undefined`，检查 Script 标签是否使用了 `beforeInteractive` 策略

### 问题 5: Alpine Linux sed 错误

如果看到 `sed: invalid option` 错误，在 `entrypoint.sh` 中使用备用方案：

```bash
# 替换这行：
sed -i 's/,\([[:space:]]*\)};/\1};/' "${RUNTIME_CONFIG_PATH}"

# 为：
tmp_file=$(mktemp)
sed 's/,\([[:space:]]*\)};/\1};/' "${RUNTIME_CONFIG_PATH}" > "$tmp_file"
mv "$tmp_file" "${RUNTIME_CONFIG_PATH}"
```

## 📚 相关文档

- [完整说明文档](./docker-runtime-env.md)
- [Docker Compose 配置](../docker-compose.yml)
- [Dockerfile 构建配置](../Dockerfile)
- [Entrypoint 脚本](../entrypoint.sh)

## 💡 最佳实践

1. **本地开发**：使用 `.env.local` 文件
2. **生产部署**：通过 CI/CD 或 secrets 管理工具注入环境变量
3. **多环境**：为不同环境准备不同的 `.env` 文件
4. **版本控制**：将 `.env` 加入 `.gitignore`，提交 `.env.example` 作为模板
5. **测试验证**：在部署前运行 `test-runtime-env.sh` 确保配置正确

## 🎉 完成！

现在你的 Docker 容器可以：
- ✅ 在只读文件系统中安全运行
- ✅ 动态注入运行时环境变量
- ✅ 保持所有静态资源可用
- ✅ 无需重新构建即可更改配置

遇到问题？查看[故障排查](#-故障排查)或[完整文档](./docker-runtime-env.md)。

