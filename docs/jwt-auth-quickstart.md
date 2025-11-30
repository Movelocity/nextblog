# JWT 认证系统快速入门

## 1. 安装依赖

首先需要安装 Go JWT 库：

```bash
cd server
go get github.com/golang-jwt/jwt/v5
go mod tidy
```

## 2. 配置环境变量

在项目根目录创建或更新 `.env` 文件：

```env
# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRY=24h

# 数据库
DB_PATH=./data/nextblog.db

# 服务器
PORT=8080
GIN_MODE=debug

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

⚠️ **重要**：在生产环境中，请使用强随机字符串作为 JWT_SECRET！

## 3. 启动后端服务

```bash
cd server
make run
# 或
go run cmd/server/main.go
```

## 4. 注册第一个用户（管理员）

使用 curl 或任何 HTTP 客户端：

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "admin123456"
  }'
```

响应示例：
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwiZXhwIjoxNzAxNDM2ODAwLCJpYXQiOjE3MDEzNTA0MDAsInJvbGUiOiJhZG1pbiIsInVzZXJJZCI6MSwidXNlcm5hbWUiOiJhZG1pbiJ9.abc123...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "active": true,
    "createdAt": "2025-11-30T12:00:00Z",
    "updatedAt": "2025-11-30T12:00:00Z"
  }
}
```

**注意**：第一个注册的用户会自动成为管理员！

## 5. 测试认证

### 5.1 登录

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123456"
  }'
```

### 5.2 检查认证状态

```bash
# 保存 token 到变量
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:8080/api/auth/check \
  -H "Authorization: Bearer $TOKEN"
```

### 5.3 获取用户信息

```bash
curl -X GET http://localhost:8080/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

### 5.4 访问受保护的 API

```bash
# 查看系统状态（仅管理员）
curl -X GET http://localhost:8080/api/system/status \
  -H "Authorization: Bearer $TOKEN"

# 创建文章
curl -X POST http://localhost:8080/api/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "我的第一篇文章",
    "content": "这是文章内容",
    "published": true
  }'
```

## 6. 前端集成

### 6.1 启动前端开发服务器

```bash
npm run dev
# 或
pnpm dev
```

### 6.2 使用认证服务

在您的 React 组件中：

```typescript
import { 
  register, 
  login, 
  logout,
  isAuthenticated,
  setAuthToken 
} from '@/app/services/auth';

// 注册
const handleRegister = async () => {
  try {
    const response = await register({
      username: 'john',
      email: 'john@example.com',
      password: 'password123'
    });
    
    setAuthToken(response.token);
    console.log('用户信息:', response.user);
    // 跳转到首页或仪表板
  } catch (error) {
    console.error('注册失败:', error);
  }
};

// 登录
const handleLogin = async () => {
  try {
    const response = await login({
      email: 'john@example.com',
      password: 'password123'
    });
    
    setAuthToken(response.token);
    console.log('登录成功:', response.user);
  } catch (error) {
    console.error('登录失败:', error);
  }
};

// 检查认证状态
const checkAuth = async () => {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    // 跳转到登录页
    window.location.href = '/login';
  }
};

// 登出
const handleLogout = () => {
  logout();
  window.location.href = '/';
};
```

## 7. 创建登录页面示例

创建 `app/(views)/login/page.tsx`：

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, setAuthToken } from '@/app/services/auth';

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login({ email, password });
      setAuthToken(response.token);
      router.push('/dashboard');
    } catch (err) {
      setError('登录失败，请检查邮箱和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">登录</h1>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block mb-2">邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-2">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? '登录中...' : '登录'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
```

## 8. 保护路由

创建一个认证 Hook `app/hooks/useRequireAuth.ts`：

```typescript
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/app/services/auth';

export const useRequireAuth = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const auth = await isAuthenticated();
      setAuthenticated(auth);
      
      if (!auth) {
        router.push('/login');
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  return { loading, authenticated };
};
```

在需要保护的页面中使用：

```typescript
'use client';

import { useRequireAuth } from '@/app/hooks/useRequireAuth';

const DashboardPage = () => {
  const { loading } = useRequireAuth();

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <h1>仪表板</h1>
      {/* 受保护的内容 */}
    </div>
  );
};

export default DashboardPage;
```

## 9. 常见问题

### Q: Token 过期后怎么办？

A: 可以使用刷新 token 接口：

```typescript
import { refreshToken, setAuthToken } from '@/app/services/auth';

const handleRefresh = async () => {
  try {
    const response = await refreshToken();
    setAuthToken(response.token);
  } catch (error) {
    // Token 无法刷新，需要重新登录
    window.location.href = '/login';
  }
};
```

### Q: 如何实现自动刷新 token？

A: 可以在响应拦截器中处理：

```typescript
// app/services/utils.ts 中添加
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token 过期，尝试刷新
      try {
        const { token } = await refreshToken();
        setAuthToken(token);
        // 重试原请求
        error.config.headers.Authorization = `Bearer ${token}`;
        return axios(error.config);
      } catch (refreshError) {
        // 刷新失败，跳转到登录
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

### Q: 如何检查用户角色？

A: 在前端保存用户信息：

```typescript
import { checkAuth } from '@/app/services/auth';

const response = await checkAuth();
if (response.valid && response.user) {
  const isAdmin = response.user.role === 'admin';
  // 根据角色显示不同内容
}
```

## 10. 下一步

- 实现注册页面
- 添加密码重置功能
- 实现用户管理界面（管理员）
- 添加个人资料编辑功能
- 实现邮箱验证

## 11. 完整示例项目结构

```
nextblog/
├── server/
│   ├── internal/
│   │   ├── models/
│   │   │   └── user.go
│   │   ├── repository/
│   │   │   └── user_repository.go
│   │   ├── service/
│   │   │   └── auth_service.go
│   │   ├── middleware/
│   │   │   └── middleware.go
│   │   └── api/
│   │       ├── auth_handler.go
│   │       └── routes.go
│   └── cmd/
│       └── server/
│           └── main.go
└── app/
    ├── services/
    │   └── auth.ts
    ├── hooks/
    │   └── useRequireAuth.ts
    └── (views)/
        ├── login/
        │   └── page.tsx
        └── dashboard/
            └── page.tsx
```

## 12. 相关文档

- [完整 JWT 认证系统文档](./jwt-auth-system.md)
- [API 接口文档](./QUICKSTART_API.md)
- [部署指南](./docker.md)

