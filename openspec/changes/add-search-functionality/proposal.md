# Change: 前后端支持搜索 Posts 和 Notes

## Why
目前系统中文章搜索功能只返回已发布内容，笔记完全没有搜索功能。管理员需要能搜索所有内容（包括草稿和私有笔记），而访客只能搜索公开内容。统一的搜索接口可以简化前端实现并提升用户体验。

## What Changes
- **Posts 搜索**：修改现有 `SearchPosts` 接口，根据用户登录状态自动判断搜索范围
  - 未登录：仅搜索已发布文章（`published = true`）
  - 已登录：搜索所有文章（包括草稿）
- **Notes 搜索**：新增 `SearchNotes` 接口，搜索笔记内容和标签
  - 未登录：仅搜索公开笔记（`isPublic = true`）
  - 已登录：搜索所有笔记（包括私有和归档笔记）
- **高级搜索**（仅限已登录用户）：通过 `highlight=true` 参数启用
  - 返回关键词匹配的上下文（`context`）
  - 返回关键词在文档中的偏移位置（`offset`），便于跳转定位
  - 返回文档内匹配次数（`matchCount`）
  - 支持自定义上下文窗口大小（`contextSize` 参数）
- 前端添加对应的搜索服务函数和 UI 组件支持

## Impact
- Affected specs: post-search, note-search, advanced-search (新增能力)
- Affected code:
  - `server/internal/api/post_handler.go` - 修改 SearchPosts，添加高级搜索支持
  - `server/internal/repository/post_repository.go` - 修改 Search 方法，支持上下文提取
  - `server/internal/api/note_handler.go` - 新增 SearchNotes，添加高级搜索支持
  - `server/internal/repository/note_repository.go` - 新增 Search 方法，支持上下文提取
  - `server/internal/api/routes.go` - 添加笔记搜索路由
  - `server/internal/models/search.go` - 新增搜索结果模型（含 matches）
  - `web/app/services/posts.ts` - 搜索服务添加高级搜索参数支持
  - `web/app/services/notes.ts` - 新增搜索函数
  - `web/app/common/types.ts` - 新增搜索相关类型定义
  - `web/app/common/types.notes.ts` - 新增搜索参数类型
