# Change: 在 posts-view 支持新建文章

## Why

当前全屏文档编辑视图 (`/posts-view`) 左侧侧边栏的「新建」按钮链接到 `/posts/new` 页面，会导致用户离开全屏编辑环境。用户期望在全屏视图内直接创建新文章，保持工作流连贯性。

## What Changes

- 修改 `PostsListSidebar` 组件，将新建按钮从页面跳转改为回调函数
- 修改 `posts-view/page.tsx`，支持「新建文章」模式：
  - 点击新建按钮时，进入纯前端的「新建模式」，不调用 API
  - 清空 `EditPostStore` 状态，右侧编辑器显示空白文章
  - 左侧列表不显示新文章（因为还未创建）
  - 首次保存时调用 `createPost` API 创建文章
  - 创建成功后切换为「编辑模式」，刷新文档列表
- 处理未保存更改的冲突提示（与切换文档逻辑一致）

## Design Notes

采用纯前端状态管理新建文章，避免用户误操作产生大量空白文章：
- `selectedPostId = null` 且 `isCreating = true` 表示新建模式
- 新建模式下 `PostEditor` 使用 `onCreate` 回调而非 `id` 属性
- 这与 `/posts/new` 页面的行为保持一致

## Impact

- Affected specs: `posts-view` (修改现有 capability)
- Affected code:
  - `web/app/components/Posts/PostsListSidebar.tsx` - 新增 `onCreate` 回调属性
  - `web/app/(fullpage)/posts-view/page.tsx` - 实现新建模式状态管理
