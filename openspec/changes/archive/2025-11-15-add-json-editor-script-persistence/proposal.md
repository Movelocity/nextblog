# Change: JSON 编辑器用户脚本持久化和管理

## Why
当前 JSON 编辑器的用户脚本仅保存在 localStorage 中,存在以下问题:
1. 无法跨设备同步脚本
2. 脚本管理功能有限,无法集中管理和共享
3. 编辑框(blocks)状态保存在 localStorage,容量限制,且清理不便

通过将用户脚本保存到后端文件系统,并增强编辑框的 IndexedDB 存储支持,可以提供更好的脚本管理体验和本地状态管理能力。

## What Changes
- 新增后端 RESTful API 用于管理用户脚本(创建、读取、更新、删除)
- 写入操作需要 JWT 认证,读取操作无需认证(脚本默认公开可读)
- 管理员可以通过 API 编辑和更新指定脚本
- 前端编辑框(blocks)状态从 localStorage 迁移到 IndexedDB 存储
- 提供一键清除本地编辑框状态的功能
- 用户脚本仅通过后端 API 获取，不再存储到本地

## Impact
- 受影响的规范: `json-editor`
- 受影响的代码:
  - 新增: `app/api/json-editor/scripts/route.ts` - RESTful API 路由
  - 新增: `app/api/json-editor/scripts/[id]/route.ts` - 单个脚本管理
  - 修改: `app/(views)/tools/json/page.tsx` - 集成 API 调用和 IndexedDB 存储
  - 修改: `app/components/JsonEditor/types.ts` - 增强类型定义
  - 新增: `app/services/jsonEditor.ts` - 服务层 API 封装
  - 新增: `app/utils/indexedDBHelper.ts` - IndexedDB 存储工具

