# JWT 认证系统实现总结

## 更新日期
2025-11-30

## 概述

本次更新在原有 Go 后端基础上实现了完整的 JWT 认证系统，取代了之前基于环境变量的单用户认证方式。新系统支持多用户、角色权限控制和安全的密码管理。

## 主要变更

### 1. 新增文件

#### 后端

1. **`server/internal/models/user.go`**
   - User 模型：用户基础信息
   - UserResponse：安全的用户响应格式
   - LoginRequest/RegisterRequest：请求模型
   - AuthResponse：认证响应
   - JWTClaims：JWT payload 结构

2. **`server/internal/repository/user_repository.go`**
   - 用户数据访问层
   - CRUD 操作
   - 邮箱/用户名唯一性检查
   - 分页查询

3. **`server/internal/service/auth_service.go`**
   - 用户注册逻辑
   - 用户登录验证
   - JWT token 生成和验证
   - 密码加密（bcrypt）

4. **`server/internal/api/auth_handler.go`**
   - 认证相关 API 处理器
   - 注册、登录、检查、个人资料、刷新 token

5. **`server/INSTALL_JWT_DEPS.md`**
   - 依赖安装说明

#### 文档

1. **`docs/jwt-auth-system.md`**
   - 完整的认证系统文档
   - API 接口说明
   - 安全建议
   - 故障排除

2. **`docs/jwt-auth-quickstart.md`**
   - 快速入门指南
   - 示例代码
   - 常见问题解答

### 2. 修改文件

#### 后端

1. **`server/internal/middleware/middleware.go`**
   - 添加 `AuthMiddleware`：强制认证
   - 添加 `OptionalAuth`：可选认证
   - 添加 `RequireRole`：角色权限检查
   - 添加辅助函数：`GetUserID`, `GetUserRole`, `GetUserClaims`

2. **`server/internal/api/routes.go`**
   - 添加认证路由组
   - 保护需要认证的 API
   - 实现基于角色的访问控制
   - 公开读取、认证写入的策略

3. **`server/internal/db/db.go`**
   - 添加 User 模型到 AutoMigrate

#### 前端

1. **`app/services/auth.ts`**
   - 添加 `register` 函数
   - 添加 `checkAuth` 函数
   - 添加 `getUserProfile` 函数
   - 添加 `refreshToken` 函数
   - 添加 `logout` 函数
   - 更新类型定义支持完整用户信息

#### 任务文档

1. **`openspec/changes/add-go-backend-asset-apis/tasks.md`**
   - 更新 7.7：标记认证中间件已完成
   - 添加 7A：JWT 认证系统完整任务列表
   - 更新总结部分

## 技术实现细节

### 1. 密码安全

- 使用 bcrypt 算法（cost=10）
- 密码字段在 JSON 响应中自动隐藏（`json:"-"`）
- 最小密码长度：6 个字符

### 2. JWT Token

- 使用 HS256 签名算法
- 包含用户 ID、用户名、邮箱和角色
- 默认过期时间：24 小时（可配置）
- Token 在 Authorization header 中传输

### 3. 角色系统

支持三种角色：
- **admin**：管理员，拥有所有权限
- **editor**：编辑者（预留）
- **user**：普通用户

第一个注册的用户自动成为管理员。

### 4. API 保护策略

| API 类型 | 访问控制 | 说明 |
|---------|---------|------|
| 文章查看 | 公开 | 无需认证 |
| 文章管理 | 需要认证 | 所有认证用户 |
| 笔记管理 | 需要认证 | 所有认证用户 |
| 图片查看 | 公开 | 无需认证 |
| 图片上传/删除 | 需要认证 | 所有认证用户 |
| 资产管理 | 需要认证 | 所有认证用户 |
| 系统状态 | 仅管理员 | admin 角色 |
| 配置更新 | 仅管理员 | admin 角色 |

## 数据库变更

### 新增表：users

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

## 环境变量

新增配置项：

```env
# JWT 配置
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRY=24h
```

## API 接口

### 新增接口

1. **POST /api/auth/register** - 用户注册
2. **POST /api/auth/login** - 用户登录
3. **GET /api/auth/check** - 检查认证状态（需要认证）
4. **GET /api/auth/profile** - 获取用户信息（需要认证）
5. **POST /api/auth/refresh** - 刷新 token（需要认证）

### 修改接口

所有涉及数据修改的接口现在都需要认证：
- POST /api/posts
- PUT /api/posts/:id
- DELETE /api/posts/:id
- POST /api/notes
- PUT /api/notes/:id
- DELETE /api/notes/:id
- POST /api/images/upload
- DELETE /api/images/:filename
- POST /api/posts/:postId/assets
- DELETE /api/posts/:postId/assets/:fileId
- POST /api/image-edit
- PUT /api/image-edit
- PATCH /api/image-edit
- DELETE /api/image-edit

管理员专属接口：
- GET /api/system/status
- PUT /api/config

## 前端集成

### 使用示例

```typescript
import { 
  register, 
  login, 
  isAuthenticated,
  getUserProfile,
  logout 
} from '@/app/services/auth';

// 注册
const response = await register({
  username: 'john',
  email: 'john@example.com',
  password: 'password123'
});

// 登录
const { token, user } = await login({
  email: 'john@example.com',
  password: 'password123'
});

// 检查认证
const authenticated = await isAuthenticated();

// 获取用户信息
const userInfo = await getUserProfile();

// 登出
logout();
```

## 依赖

### 新增 Go 依赖

需要手动安装：

```bash
cd server
go get github.com/golang-jwt/jwt/v5
go mod tidy
```

### 现有依赖（已安装）

- `golang.org/x/crypto` - bcrypt 密码加密
- `github.com/gin-gonic/gin` - Web 框架
- `gorm.io/gorm` - ORM

## 安全考虑

### 已实现

1. ✅ 密码使用 bcrypt 加密
2. ✅ JWT token 签名验证
3. ✅ Token 过期机制
4. ✅ 密码不在响应中暴露
5. ✅ 基于角色的访问控制

### 建议后续实现

1. ⏳ 登录尝试次数限制
2. ⏳ IP 黑名单
3. ⏳ Token 黑名单（用于登出）
4. ⏳ 邮箱验证
5. ⏳ 密码重置功能
6. ⏳ 双因素认证（2FA）
7. ⏳ 审计日志

## 迁移指南

### 从旧系统迁移

1. 确保安装了 JWT 依赖
2. 配置环境变量（JWT_SECRET, JWT_EXPIRY）
3. 启动新版本后端（自动创建 users 表）
4. 使用原管理员邮箱注册第一个用户（自动成为管理员）
5. 更新前端代码使用新的认证 API

### 兼容性

- ✅ 数据库向后兼容（只是新增表）
- ✅ 公开 API 保持兼容（无需认证的接口）
- ⚠️ 写入 API 需要更新客户端代码（添加认证）

## 测试清单

### 后端测试

- [ ] 用户注册（成功、邮箱重复、用户名重复）
- [ ] 用户登录（成功、密码错误、用户不存在）
- [ ] Token 验证（有效、过期、无效）
- [ ] 角色权限（管理员、普通用户）
- [ ] 受保护的 API（有 token、无 token、token 过期）

### 前端测试

- [ ] 注册流程
- [ ] 登录流程
- [ ] Token 存储和读取
- [ ] 自动添加 Authorization header
- [ ] 登出流程
- [ ] 受保护页面的重定向

### 集成测试

- [ ] 完整的用户注册-登录-使用流程
- [ ] 多用户并发访问
- [ ] Token 刷新机制
- [ ] 权限验证（不同角色）

## 已知问题

1. **依赖安装**：需要手动运行 `go get github.com/golang-jwt/jwt/v5`
2. **前端路由保护**：需要创建认证 Hook 和登录页面
3. **Token 刷新**：前端需要实现自动刷新逻辑
4. **用户管理界面**：管理员暂无界面管理其他用户

## 下一步计划

1. 实现登录/注册前端页面
2. 添加用户管理界面（管理员）
3. 实现密码重置功能
4. 添加邮箱验证
5. 实现审计日志
6. 添加单元测试
7. 性能优化和安全加固

## 相关文档

- [JWT 认证系统完整文档](./docs/jwt-auth-system.md)
- [快速入门指南](./docs/jwt-auth-quickstart.md)
- [依赖安装说明](./server/INSTALL_JWT_DEPS.md)
- [原任务清单](./openspec/changes/add-go-backend-asset-apis/tasks.md)

## 贡献者

- 初始实现：AI Assistant
- 日期：2025-11-30

## 更新日志

### 2025-11-30
- ✅ 实现完整的 JWT 认证系统
- ✅ 添加多用户支持
- ✅ 实现角色权限控制
- ✅ 保护所有敏感 API
- ✅ 更新前端服务层
- ✅ 编写完整文档

