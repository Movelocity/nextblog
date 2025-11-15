# Change: 增强 JSON 编辑器用户体验

## Why
当前 JSON 编辑器存在以下 UX 问题影响中国用户的使用体验：
1. 编辑框只能垂直调整大小，无法横向调整以适应不同的工作流程
2. 通知消息采用占位的 banner 样式，会导致页面内容抖动，影响编辑体验
3. 界面语言为英文，而项目当前仅有中国用户
4. 用户脚本只能通过全局模态框创建和执行，缺少快速选择和应用的方式

## What Changes
- 添加编辑框的水平调整大小功能，允许用户拖动右侧边缘调整宽度
- 将通知系统从占位 banner 改为使用项目现有的 Toast 组件（固定定位，不占用文档流）
- 将所有界面文本本地化为中文（按钮标签、提示信息、占位符等）
- 在每个编辑框底部添加用户脚本下拉选择器，用户可以快速选择并执行已保存的自定义脚本

## Impact
- Affected specs: `json-editor`
- Affected code:
  - `app/(views)/tools/json/page.tsx` - 主页面组件，需要替换通知系统和本地化文本
  - `app/components/JsonEditor/EditorBox.tsx` - 编辑框组件，需要添加水平调整大小和脚本选择器
  - `app/components/JsonEditor/types.ts` - 可能需要更新类型定义

