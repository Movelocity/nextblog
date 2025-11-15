# 实现任务

## 1. 后端 API 实现
- [x] 1.1 创建 `app/api/json-editor/scripts/route.ts` - 实现 GET (列表)、POST (创建) 接口
- [x] 1.2 创建 `app/api/json-editor/scripts/[id]/route.ts` - 实现 GET (单个)、PUT (更新)、DELETE (删除) 接口
- [x] 1.3 定义脚本存储文件结构 (`blogs/json-editor-scripts/index.json` 和各脚本文件)
- [x] 1.4 实现读写权限控制:GET 公开,POST/PUT/DELETE 需要 JWT 认证
- [x] 1.5 添加脚本元数据:id、名称、描述、代码、创建/更新时间。不需要额外的作者信息，这是一个单用户博客系统。

## 2. 前端服务层封装
- [x] 2.1 创建 `app/services/jsonEditor.ts` - 封装脚本 CRUD 操作
- [x] 2.2 实现 `fetchScripts()` - 从后端获取脚本列表
- [x] 2.3 实现 `createScript(script)` - 创建新脚本(需认证)
- [x] 2.4 实现 `updateScript(id, script)` - 更新脚本(需认证)
- [x] 2.5 实现 `deleteScript(id)` - 删除脚本(需认证)
- [x] 2.6 添加错误处理和友好提示

## 3. IndexedDB 存储工具
- [x] 3.1 创建 `app/utils/indexedDBHelper.ts` - 封装 IndexedDB 操作
- [x] 3.2 实现 `saveBoxes(boxes)` - 保存编辑框状态，内容和尺寸等
- [x] 3.3 实现 `loadBoxes()` - 加载编辑框状态
- [x] 3.4 实现 `clearBoxes()` - 清除编辑框状态
- [x] 3.5 添加 localStorage 迁移逻辑(首次自动迁移)

## 4. 前端页面集成
- [x] 4.1 修改 `app/(views)/tools/json/page.tsx` - 集成脚本 API 服务
- [x] 4.2 启动时从后端加载脚本列表,合并 localStorage 脚本
- [x] 4.3 添加脚本同步功能:保存脚本时调用 API(需认证)
- [x] 4.4 添加"清除本地编辑框"按钮(调用 `clearBoxes()`)
- [x] 4.5 编辑框状态切换为 IndexedDB 存储
- [x] 5.6 脚本只能来自远端

## 5. 类型定义更新
- [x] 5.1 修改 `app/components/JsonEditor/types.ts` - 增强 `CustomScript` 类型
- [x] 5.2 添加 `createdAt`、`updatedAt`、`author` 等元数据字段

## 6. 测试和验证
- [x] 6.1 测试未登录用户:可读取脚本,无法创建/编辑/删除
- [x] 6.2 测试登录用户:可创建、编辑、删除脚本
- [x] 6.3 测试 IndexedDB 存储:编辑框状态持久化和恢复
- [x] 6.4 测试一键清除功能:清除本地编辑框状态
- [x] 6.5 测试 localStorage 迁移:首次访问自动迁移
- [x] 6.6 测试脚本执行:确保新存储方式不影响脚本运行

