# Change: 新增全屏文档编辑视图

## Why

现有的文档编辑页面 (`/posts/[id]/edit`) 使用带侧边栏的 `(views)` 布局，侧边栏占用空间且与编辑功能无关。用户需要一个专注的全屏编辑界面，左侧显示文档列表便于快速切换文档，右侧为编辑区域，无系统导航干扰。

## What Changes

- 新增 `(fullpage)` 布局路由，无系统侧边栏，全屏展示
- 在 `web/app/(fullpage)/posts-view/page.tsx` 实现新版文档编辑视图
- 左侧区域：
  - 标题搜索过滤框
  - 可滚动的文档标题列表
  - 点击文档项可切换到对应文档编辑
- 右侧区域：
  - 复用现有 `PostEditor` 组件进行文档编辑
- 支持亮暗主题切换（通过 CSS 变量，参考 `globals.css`）

## Impact

- Affected specs: `posts-view` (新增 capability)
- Affected code:
  - `web/app/(fullpage)/layout.tsx` - 新建全屏布局
  - `web/app/(fullpage)/posts-view/page.tsx` - 新建文档编辑视图页面
  - `web/app/components/` - 可能新增侧边栏组件用于文档列表

