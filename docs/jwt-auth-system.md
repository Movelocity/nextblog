# JWT 认证系统实现文档

## 概述

本项目已实现完整的基于 JWT (JSON Web Token) 的认证系统，支持多用户、角色权限控制和安全的密码管理。

## 功能特性

### 1. 多用户支持
- 用户可以通过注册接口创建账号
- 支持用户名和邮箱的唯一性验证
- 第一个注册的用户自动成为管理员

### 2. 安全性
- 使用 bcrypt 算法加密密码（cost=10）
- JWT token 签名验证
- 密码不会在 API 响应中暴露
- Token 过期机制（默认24小时，可配置）

### 3. 角色权限控制 (RBAC)
支持三种角色：
- **admin**: 管理员，拥有所有权限
- **editor**: 编辑者，可以管理内容
- **user**: 普通用户，基本权限

### 4. API 保护策略

#### 公开访问（无需认证）
- 文章列表和详情
- 分类和标签列表
- 公开笔记
- 图片查看
- 站点配置查看

#### 需要认证
- 文章创建、更新、删除
- 笔记管理
- 图片上传和删除
- 资产管理
- 个人资料查看

#### 仅管理员
- 系统状态查看
- 站点配置更新

## API 接口

### 认证相关接口

#### 1. 用户注册
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "john",
  "email": "john@example.com",
  "password": "password123"
}
```

响应：
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john",
    "email": "john@example.com",
    "role": "user",
    "active": true,
    "createdAt": "2025-11-30T12:00:00Z",
    "updatedAt": "2025-11-30T12:00:00Z"
  }
}
```

#### 2. 用户登录
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

响应：同注册接口

#### 3. 检查认证状态
```
GET /api/auth/check
Authorization: Bearer <token>
```

响应：
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "username": "john",
    "email": "john@example.com",
    "role": "user",
    "active": true
  }
}
```

#### 4. 获取用户信息
```
GET /api/auth/profile
Authorization: Bearer <token>
```

#### 5. 刷新 Token
```
POST /api/auth/refresh
Authorization: Bearer <token>
```

响应：
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 使用说明

### 后端配置

在 `.env` 文件中配置：

```env
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRY=24h
```

### 前端集成

#### 1. 注册用户
```typescript
import { register, setAuthToken } from '@/app/services/auth';

const handleRegister = async () => {
  try {
    const response = await register({
      username: 'john',
      email: 'john@example.com',
      password: 'password123'
    });
    
    // 保存 token
    setAuthToken(response.token);
    
    // 使用用户信息
    console.log(response.user);
  } catch (error) {
    console.error('注册失败:', error);
  }
};
```

#### 2. 用户登录
```typescript
import { login, setAuthToken } from '@/app/services/auth';

const handleLogin = async () => {
  try {
    const response = await login({
      email: 'john@example.com',
      password: 'password123'
    });
    
    setAuthToken(response.token);
    console.log(response.user);
  } catch (error) {
    console.error('登录失败:', error);
  }
};
```

#### 3. 检查认证状态
```typescript
import { isAuthenticated } from '@/app/services/auth';

const checkAuth = async () => {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    // 重定向到登录页
  }
};
```

#### 4. 使用认证 API
服务层会自动在请求头中添加 Authorization token：

```typescript
import { createPost } from '@/app/services/posts';

// 自动包含认证 token
const post = await createPost({
  title: 'My Post',
  content: '...'
});
```

## 数据模型

### User 模型

```go
type User struct {
    ID        uint      `json:"id"`
    Username  string    `json:"username"`
    Email     string    `json:"email"`
    Password  string    `json:"-"`  // 不会在响应中暴露
    Role      string    `json:"role"`  // admin, editor, user
    Active    bool      `json:"active"`
    CreatedAt time.Time `json:"createdAt"`
    UpdatedAt time.Time `json:"updatedAt"`
}
```

### JWT Claims

```go
type JWTClaims struct {
    UserID   uint   `json:"userId"`
    Username string `json:"username"`
    Email    string `json:"email"`
    Role     string `json:"role"`
}
```

## 中间件使用

### 1. 强制认证
```go
// 所有请求必须认证
router.GET("/protected", middleware.AuthMiddleware(db.DB), handler)
```

### 2. 可选认证
```go
// 认证是可选的，但如果提供了 token 会解析用户信息
router.GET("/optional", middleware.OptionalAuth(db.DB), handler)
```

### 3. 角色权限检查
```go
// 只有管理员可以访问
router.GET("/admin", 
    middleware.AuthMiddleware(db.DB), 
    middleware.RequireRole("admin"), 
    handler)

// 管理员或编辑者可以访问
router.GET("/content", 
    middleware.AuthMiddleware(db.DB), 
    middleware.RequireRole("admin", "editor"), 
    handler)
```

## 安全建议

1. **生产环境配置**
   - 更改默认的 JWT_SECRET
   - 使用强随机字符串（至少 32 字符）
   - 定期轮换密钥

2. **Token 管理**
   - 在客户端安全存储 token（不要存储在 URL 中）
   - 使用 HTTPS 传输
   - 实现 token 刷新机制
   - 考虑实现 token 黑名单（用于登出）

3. **密码策略**
   - 强制最小长度（当前为6个字符）
   - 考虑添加密码复杂度要求
   - 实现密码重置功能

4. **速率限制**
   - 添加登录尝试次数限制
   - 实现 IP 黑名单
   - 使用 CAPTCHA 防止暴力破解

## 测试

### 手动测试流程

1. **注册第一个用户（自动成为管理员）**
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

2. **登录获取 token**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

3. **使用 token 访问受保护的 API**
```bash
TOKEN="your-token-here"

curl -X GET http://localhost:8080/api/system/status \
  -H "Authorization: Bearer $TOKEN"
```

4. **检查认证状态**
```bash
curl -X GET http://localhost:8080/api/auth/check \
  -H "Authorization: Bearer $TOKEN"
```

## 迁移指南

### 从旧系统迁移

如果您之前使用的是环境变量配置的单一管理员账号：

1. 启动新版本后端
2. 使用原来的管理员邮箱和密码注册第一个用户
3. 该用户将自动成为管理员
4. 更新前端代码使用新的认证 API

### 数据库迁移

新版本会自动创建 `users` 表，无需手动操作。

## 故障排除

### Token 无效
- 检查 JWT_SECRET 是否正确配置
- 确认 token 未过期
- 验证 token 格式（Bearer <token>）

### 权限不足
- 检查用户角色
- 确认 API 路由的权限要求
- 查看后端日志

### 注册失败
- 检查邮箱/用户名是否已存在
- 验证密码长度（最小6个字符）
- 检查网络连接和后端服务状态

## 后续改进建议

1. 实现邮箱验证
2. 添加密码重置功能
3. 实现双因素认证（2FA）
4. 添加用户管理界面（管理员功能）
5. 实现 OAuth 集成（GitHub, Google 等）
6. 添加会话管理（查看活跃会话）
7. 实现审计日志

## 相关文件

### 后端
- `server/internal/models/user.go` - 用户模型
- `server/internal/repository/user_repository.go` - 用户数据访问
- `server/internal/service/auth_service.go` - 认证服务
- `server/internal/middleware/middleware.go` - 认证中间件
- `server/internal/api/auth_handler.go` - 认证 API 处理器
- `server/internal/api/routes.go` - 路由配置

### 前端
- `app/services/auth.ts` - 认证服务层
- `app/lib/jwt.ts` - JWT 工具（可能需要更新或废弃）
- `app/lib/auth.ts` - 认证工具（可能需要更新或废弃）

## 依赖

### 后端
- `github.com/golang-jwt/jwt/v5` - JWT 实现
- `golang.org/x/crypto/bcrypt` - 密码加密
- `github.com/gin-gonic/gin` - Web 框架
- `gorm.io/gorm` - ORM

### 前端
无需额外依赖，使用现有的服务层架构。

