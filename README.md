# Next.js 博客管理系统

[![Next.js](https://img.shields.io/badge/Next.js-15.1.5-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

中文 / [English](./README.en.md)

一个现代化、高性能且易于定制的博客管理系统，基于 Next.js 构建。采用基于文件系统的存储方案，让内容管理和迁移更加简单直观。无需数据库，每篇博客都以独立文件夹形式存储，支持 Markdown 富文本编写，完美集成数学公式与图表展示。

### 为什么选择这个博客系统？

- 🚀 **零数据库依赖**：基于文件系统存储，部署简单，迁移方便
- 📝 **强大的 Markdown 支持**：支持数学公式、图表等高级特性
- 🎨 **深色模式**：内置亮暗主题切换，提供舒适的阅读体验
- 🔍 **全文搜索**：快速定位任何内容
- 📱 **响应式设计**：完美适配移动端、平板、桌面端
- 🔐 **安全可靠**：JWT 认证 + 多设备会话管理
- 🎯 **高性能**：通过缓存文章信息，即使使用文件系统存储博客内容，也能保持快速的访问速度

## 技术栈

- Next.js 15.1.5（使用 App Router）
- React 19
- TypeScript 5
- Tailwind CSS
- 文件系统存储
- JWT 认证
- Markdown 支持（支持数学公式、图表等）
- Zustand 状态管理

## 项目结构

```
app/
├── (views)/        # 前端页面组件
├── api/            # 后端 API 路由
├── components/     # 可复用的 React 组件
├── services/       # 前端 API 服务
├── common/         # 共享类型和配置
├── hooks/          # React Hooks
├── lib/            # 核心库
└── store/          # 状态管理
```

## 功能清单
- [x] 基于文件系统的博客存储（支持 Markdown 格式）
- [x] 元数据缓存系统（提升读取性能）
- [x] 完整的 CRUD 操作 API
- [x] 响应式设计（支持移动端、平板、桌面端）
- [x] 管理员登录（支持邮箱+密码）
- [x] 亮、暗色模式支持
- [x] 路由保护（基于角色的访问控制）
- [x] JWT 认证（支持刷新令牌）
- [x] 会话管理（支持多设备登录）
- [x] Markdown 支持（包含数学公式、图表）
- [x] 标签系统（支持多级分类）
- [x] 搜索功能（支持全文搜索）
- [x] 草稿功能
- [x] 资源文件管理（支持图片、视频、文档等）
- [x] 图片上传（支持拖拽、压缩、预览）
- [ ] 统计面板（访问量、阅读时长）
- [ ] Markdown 编辑器（支持实时预览）
- [ ] 自定义主题
- [ ] 自动备份功能

## 快速开始

1. 克隆仓库：
   ```bash
   git clone https://github.com/Movelocity/nextblog.git
   cd nextblog
   ```

2. 安装依赖：
   ```bash
   yarn install
   ```

3. 配置环境变量：
  创建 `.env.local` 文件并添加以下内容：
   ```env
   BLOG_ROOT_DIR=blogs  # 博客存储目录（默认：'blogs'）
   JWT_SECRET=your-super-secret-jwt-key  # JWT 密钥 用于用户认证
   ADMIN_EMAIL=nextblog@example.com  # 管理员邮箱, 请修改为你的邮箱
   ADMIN_PASSWORD=nextblog123  # 管理员密码, 自行修改
   ```

4. 启动开发服务器：
   ```bash
   yarn dev
   ```

5. 访问系统：
   ```
   地址：http://localhost:3000/dashboard
   测试账号：nextblog@example.com
   密码：nextblog123
   ```

## 博客存储目录结构
```
blogs/                # 博客根目录
├── meta.json         # 元数据缓存
├── my-first-blog/    # 单个博客目录
│   ├── index.md      # 主要内容
│   └── assets/       # 资源目录
│       └── image.png # 博客资源
└── another-blog/
    ├── index.md
    └── assets/
```

## 源码使用示例

```typescript
import blogStorage from '@/app/lib/blog-instance';

// 创建博客
const blog = await blogStorage.createBlog({
  id: 'my-first-blog',
  title: '我的第一篇博客',
  description: '这是我的第一篇博客文章',
  content: '# 你好世界\n\n这是我的第一篇博客文章。',
  published: true,
  tags: ['首篇', '你好']
});

// 获取博客
const blog = await blogStorage.getBlog('my-first-blog');

// 更新博客
const updated = await blogStorage.updateBlog('my-first-blog', {
  title: '更新后的标题',
  content: '更新后的内容'
});

// 删除博客
await blogStorage.deleteBlog('my-first-blog');

// 列出所有博客
const allBlogs = await blogStorage.listBlogs();

// 只列出已发布的博客
const publishedBlogs = await blogStorage.listBlogs({ published: true });
```

## 贡献指南

1. Fork 项目
2. git clone 你 Fork 出的新项目
3. 创建特性分支：`git checkout -b feature/AmazingFeature`
4. 提交更改：`git commit -m 'Add some AmazingFeature'`
5. 推送分支：`git push origin feature/AmazingFeature`
6. 提交 Pull Request

## 开发规范
1. 使用 yarn 管理依赖
2. 避免过度使用第三方库，尽量使用原生方法

## 许可证

MIT License - 详见 LICENSE 文件
