# Tasks: 笔记归档功能

## 1. 后端实现

- [x] 1.1 在 Note 模型中添加 `IsArchived` 字段（默认 false）
- [x] 1.2 更新 NoteRepository 的 `GetWithPagination` 方法，支持 `isArchived` 过滤
- [x] 1.3 更新 NoteRepository 的 `GetStatsByMonth` 方法，排除已归档笔记
- [x] 1.4 新增 `SetArchiveStatus` repository 方法
- [x] 1.5 更新 NoteHandler 的 `GetNotes`，添加 `isArchived` 查询参数
- [x] 1.6 新增 `ArchiveNote` handler，处理 `PUT /api/notes/:id/archive`
- [x] 1.7 注册新路由

## 2. 前端实现

- [x] 2.1 更新 `types.notes.ts`，添加 `isArchived` 字段
- [x] 2.2 更新 `notes.ts` 服务，添加 `archiveNote` 函数
- [x] 2.3 更新 `GetNotesParams`，支持 `isArchived` 过滤
- [x] 2.4 在 `NoteCard` 组件添加归档/取消归档按钮
- [x] 2.5 在 `NoteSidebar` 添加归档过滤切换
- [x] 2.6 更新 `NotesPage`，支持归档状态过滤

## 3. 数据库迁移

- [x] 3.1 GORM AutoMigrate 自动处理（无需额外脚本）

## 4. 验证

- [ ] 4.1 测试归档/取消归档功能
- [ ] 4.2 测试列表过滤功能
- [ ] 4.3 确认统计数据正确排除已归档笔记
