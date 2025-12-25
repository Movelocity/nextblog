# Toast全局事件系统使用指南

## 概述

Toast系统现在支持两种使用方式：
1. **React Context API**（传统方式）- 需要在组件内使用 `useToast` hook
2. **全局事件系统**（新方式）- 可以在任何地方触发toast，无需依赖React Context

## 使用方式

### 方式一：全局事件系统（推荐）

适用场景：
- 在非React组件中显示toast（如工具函数、API调用等）
- 跨组件通信
- 不想使用Context的场景

```typescript
import { toast } from '@/app/lib/toastEmitter';

// 成功消息
toast.success('操作成功！');

// 错误消息
toast.error('操作失败，请重试');

// 警告消息
toast.warning('这是一个警告');

// 信息消息
toast.info('这是一条信息');

// 自定义类型
toast.show('自定义消息', 'success');
```

#### 在组件中使用

```tsx
'use client';

import { toast } from '@/app/lib/toastEmitter';

export const MyComponent = () => {
  const handleClick = () => {
    toast.success('按钮被点击了！');
  };

  return <button onClick={handleClick}>点击我</button>;
};
```

#### 在API服务中使用

```typescript
// services/api.ts
import { toast } from '@/app/lib/toastEmitter';

export const fetchData = async () => {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      toast.error('获取数据失败');
      throw new Error('Fetch failed');
    }
    const data = await response.json();
    toast.success('数据加载成功');
    return data;
  } catch (error) {
    toast.error('网络错误，请检查连接');
    throw error;
  }
};
```

#### 在工具函数中使用

```typescript
// utils/validation.ts
import { toast } from '@/app/lib/toastEmitter';

export const validateForm = (data: FormData) => {
  if (!data.email) {
    toast.warning('请输入邮箱地址');
    return false;
  }
  if (!data.password) {
    toast.warning('请输入密码');
    return false;
  }
  return true;
};
```

### 方式二：React Context API（传统方式）

适用场景：
- 已有代码使用了 `useToast` hook
- 需要在React组件内部使用

```tsx
'use client';

import { useToast } from '@/app/components/layout/ToastHook';

export const MyComponent = () => {
  const { showToast } = useToast();

  const handleClick = () => {
    showToast('操作成功！', 'success');
  };

  return <button onClick={handleClick}>点击我</button>;
};
```

## 技术实现

### 架构设计

```
全局事件发射器 (toastEmitter.ts)
         ↓
    订阅/发射事件
         ↓
ToastProvider 监听全局事件
         ↓
    更新Toast列表
         ↓
  ToastContainer 渲染Toast
```

### 核心组件

1. **toastEmitter.ts** - 全局事件发射器
   - 使用观察者模式
   - 管理所有订阅者
   - 提供便捷的API方法

2. **ToastHook.tsx** - Toast Provider
   - 在 `useEffect` 中订阅全局事件
   - 同时保持Context API的兼容性
   - 统一管理toast状态

3. **Toast.tsx** - Toast UI组件
   - 自动消失动画
   - 支持4种类型（success/error/warning/info）
   - Portal渲染到body

## 优势

### 全局事件系统的优势

1. **解耦合** - 不需要通过组件树传递Context
2. **灵活性** - 可以在任何地方使用（包括非React代码）
3. **简洁性** - API更简单直观
4. **跨边界** - 可以跨越不同的React树通信

### 实现细节

- **单例模式**：确保全局只有一个事件发射器实例
- **自动清理**：组件卸载时自动取消订阅，防止内存泄漏
- **错误处理**：监听器内部错误不会影响其他监听器
- **类型安全**：完整的TypeScript类型定义

## 最佳实践

1. **优先使用全局事件系统** - 除非你需要在组件内部精确控制
2. **统一错误处理** - 在API调用处统一使用toast.error()
3. **避免过度使用** - 不要对每个操作都显示toast
4. **简洁的消息** - 保持消息简短明了
5. **合适的类型** - 选择正确的toast类型（success/error/warning/info）

## 迁移指南

如果你想从Context API迁移到全局事件系统：

### 迁移前

```tsx
const { showToast } = useToast();
showToast('成功', 'success');
```

### 迁移后

```tsx
import { toast } from '@/app/lib/toastEmitter';
toast.success('成功');
```

两种方式可以共存，不需要一次性迁移全部代码。

