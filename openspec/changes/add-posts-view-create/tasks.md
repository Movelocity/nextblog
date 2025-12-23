## 1. 组件接口更新

- [x] 1.1 为 `PostsListSidebar` 添加 `onCreate` 可选回调属性
- [x] 1.2 修改新建按钮逻辑：若有 `onCreate` 回调则调用回调，否则保持原有链接跳转

## 2. posts-view 页面状态管理

- [x] 2.1 新增 `isCreating` 状态标识是否处于新建模式
- [x] 2.2 实现 `handleCreate` 函数：检查未保存更改、设置新建模式、清空编辑器状态
- [x] 2.3 实现 `handleCreateSubmit` 函数：调用 `createPost` API，成功后切换为编辑模式
- [x] 2.4 新建模式下渲染 `PostEditor` 时传入 `onCreate` 回调而非 `id`

## 3. 文档列表刷新

- [x] 3.1 为 `PostsListSidebar` 添加 `ref` 支持或刷新回调
- [x] 3.2 创建成功后触发文档列表刷新并选中新文章
