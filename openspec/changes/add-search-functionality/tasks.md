## 1. 后端 - 搜索模型定义
- [x] 1.1 在 `models/` 中新增搜索结果类型 `SearchMatch` 和带高亮的响应类型

## 2. 后端 - Posts 搜索改进
- [x] 2.1 修改 `PostRepository.Search` 方法，添加 `published` 参数支持
- [x] 2.2 添加 `PostRepository.SearchWithContent` 方法，提取关键词上下文
- [x] 2.3 修改 `PostHandler.SearchPosts`，根据登录状态决定搜索范围
- [x] 2.4 在 `PostHandler.SearchPosts` 中添加 `highlight` 参数处理逻辑

## 3. 后端 - Notes 搜索功能
- [x] 3.1 在 `NoteRepository` 中添加 `Search` 方法
- [x] 3.2 在 `NoteHandler` 中添加 `SearchNotes` 处理器（含高级搜索支持）
- [x] 3.3 在 `routes.go` 中注册笔记搜索路由

## 4. 后端 - 上下文提取工具
- [x] 4.1 实现关键词上下文提取函数（支持 contextSize 参数）
- [x] 4.2 实现匹配偏移量计算函数

## 5. 前端 - 类型定义
- [x] 5.1 在 `types.ts` 中添加 `SearchMatch` 和高级搜索响应类型
- [x] 5.2 在 `types.notes.ts` 中添加笔记搜索参数和响应类型

## 6. 前端 - 搜索服务
- [x] 6.1 修改 `posts.ts` 中的 `searchPosts` 函数，添加 `searchPostsAdvanced` 函数
- [x] 6.2 在 `notes.ts` 中添加 `searchNotes` 和 `searchNotesAdvanced` 函数

## 7. 验证
- [ ] 7.1 测试未登录用户搜索 posts（应只返回已发布，无 matches）
- [ ] 7.2 测试已登录用户普通搜索 posts（应返回所有匹配结果，无 matches）
- [ ] 7.3 测试已登录用户高级搜索 posts（应返回带 context 和 offset 的结果）
- [ ] 7.4 测试未登录用户搜索 notes（应只返回公开笔记，忽略 highlight）
- [ ] 7.5 测试已登录用户高级搜索 notes（应返回带 matches 的结果）
- [ ] 7.6 测试自定义 contextSize 参数
