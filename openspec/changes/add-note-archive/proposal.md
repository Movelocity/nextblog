# Change: 支持笔记归档功能

## Why
随着笔记数量增长，用户需要一种方式来整理不再活跃但不想删除的笔记。归档功能可以将这些笔记从默认列表中隐藏，同时保留数据，从而提高有效内容的检索效率。

## What Changes
- 在 Note 模型中新增 `IsArchived` 字段
- API 支持按归档状态过滤笔记
- 新增归档/取消归档笔记的 API 端点
- 前端支持归档操作和归档笔记查看
- 默认列表只显示未归档笔记

## Impact
- Affected specs: notes
- Affected code:
  - `server/internal/models/models.go` - Note 模型
  - `server/internal/repository/note_repository.go` - 数据访问层
  - `server/internal/api/note_handler.go` - API 处理器
  - `web/app/common/types.notes.ts` - 类型定义
  - `web/app/services/notes.ts` - 前端服务
  - `web/app/(views)/notes/page.tsx` - 笔记页面
  - `web/app/components/Notes/NoteCard.tsx` - 笔记卡片组件
  - `web/app/components/Notes/NoteSidebar.tsx` - 侧边栏组件
