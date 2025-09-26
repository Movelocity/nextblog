# API客户端使用指南

## 概述

我们实现了一个通用的baseFetch函数和HTTP客户端，提供统一的API请求管理和自动认证处理。

## 核心特性

- ✅ 统一的HTTP方法：GET、POST、PUT、DELETE
- ✅ 自动认证管理：优先使用cookie中的`auth-token`，回退到localStorage
- ✅ 统一的错误处理：ApiError类提供详细的错误信息
- ✅ 请求超时控制：默认30秒超时，可自定义
- ✅ 自动参数处理：支持查询参数和请求体
- ✅ FormData支持：自动处理文件上传
- ✅ TypeScript支持：完整的类型定义

## 基础用法

### 导入

```typescript
import { get, post, put, del, httpClient, baseFetch } from '@/app/services/utils';
```

### GET请求

```typescript
// 简单GET请求
const data = await get<ResponseType>('/api/posts');

// 带查询参数的GET请求
const posts = await get<PostsResponse>('/api/posts', {
  params: {
    page: 1,
    limit: 10,
    categories: ['tech', 'blog']
  }
});
```

### POST请求

```typescript
// JSON数据
const newPost = await post<PostResponse>('/api/posts', {
  title: 'New Post',
  content: 'Post content'
});

// FormData (文件上传)
const formData = new FormData();
formData.append('file', file);
const uploadResult = await post<UploadResponse>('/api/upload', formData);
```

### PUT请求

```typescript
const updatedPost = await put<PostResponse>('/api/posts', 
  { title: 'Updated Title' },
  { params: { id: '123' } }
);
```

### DELETE请求

```typescript
await del('/api/posts', { params: { id: '123' } });
```

### 使用httpClient对象

```typescript
const client = httpClient;

const data = await client.get<ResponseType>('/api/data');
const result = await client.post<ResultType>('/api/create', payload);
const updated = await client.put<UpdateType>('/api/update', data);
await client.delete('/api/delete', { params: { id } });
```

## 高级用法

### 自定义超时

```typescript
const data = await get('/api/slow-endpoint', {
  timeout: 60000 // 60秒超时
});
```

### 自定义headers

```typescript
const data = await post('/api/endpoint', payload, {
  headers: {
    'Custom-Header': 'value'
  }
});
```

### 使用baseFetch进行完全自定义

```typescript
const response = await baseFetch<CustomResponse>('/api/custom', {
  method: 'PATCH',
  body: { data: 'custom' },
  params: { filter: 'active' },
  timeout: 45000,
  headers: {
    'Accept': 'application/vnd.api+json'
  }
});
```

## 认证处理

客户端会自动处理认证：

1. **优先使用cookie**: 检查`auth-token` cookie
2. **回退到localStorage**: 兼容旧版本的`authToken`
3. **自动添加Authorization header**: `Bearer ${token}`

### 认证相关函数

```typescript
import { getAuthToken, setAuthToken, removeAuthToken } from '@/app/services/auth';

// 获取当前token
const token = getAuthToken();

// 设置token (会存储到localStorage)
setAuthToken('your-jwt-token');

// 清除token (清除localStorage和cookie)
removeAuthToken();
```

## 错误处理

```typescript
import { ApiError } from '@/app/services/utils';

try {
  const data = await get('/api/endpoint');
} catch (error) {
  if (error instanceof ApiError) {
    console.log('Status:', error.status);
    console.log('Message:', error.message);
    console.log('Response:', error.response);
  } else {
    console.log('Network or other error:', error.message);
  }
}
```

## 服务文件重构

所有现有的服务文件都已更新使用新的客户端：

- `auth.ts` - 认证服务
- `posts.ts` - 博客文章服务  
- `assets.ts` - 资源管理服务
- `image.ts` - 图片编辑服务

### 使用示例

```typescript
import { login, isAuthenticated } from '@/app/services/auth';
import { getPosts, createPost } from '@/app/services/posts';
import { assetService } from '@/app/services/assets';

// 登录
const loginResult = await login({ email, password });

// 检查认证状态
const isLoggedIn = await isAuthenticated();

// 获取文章列表
const { blogs_info, total } = await getPosts({
  query: 'search term',
  page: 1,
  limit: 10
});

// 上传资源
const uploadResult = await assetService.uploadAsset(blogId, file);
```

## 迁移指南

### 从旧版本迁移

如果你的代码中有直接使用`fetch`的地方，可以按以下方式迁移：

**旧代码:**
```typescript
const response = await fetch('/api/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(data)
});
const result = await response.json();
```

**新代码:**
```typescript
const result = await post<ResultType>('/api/posts', data);
```

### 类型安全

确保为所有API调用提供正确的TypeScript类型：

```typescript
interface PostResponse {
  id: string;
  title: string;
  content: string;
}

const post = await get<PostResponse>('/api/posts/123');
// post 现在有完整的类型支持
console.log(post.title); // ✅ 类型安全
```

## 最佳实践

1. **总是指定响应类型**: 使用泛型参数提供类型安全
2. **使用params选项**: 而不是手动构建查询字符串
3. **适当的错误处理**: 使用try-catch和ApiError类型检查
4. **合理的超时设置**: 根据API响应时间调整timeout
5. **复用服务函数**: 优先使用现有的服务函数而不是直接调用HTTP方法
