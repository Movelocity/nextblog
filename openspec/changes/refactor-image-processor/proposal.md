# Change: 重构图片处理器组件架构

## Why
当前图片处理器 (`page.tsx`) 包含 1322 行代码，将所有状态管理、图片处理逻辑、UI 渲染混杂在一个文件中，导致：
- 代码审计难度高，难以定位具体功能逻辑
- 状态散乱在组件内，难以追踪数据流
- 缺乏模块化，功能耦合度高，不易扩展和维护
- 测试困难，难以对单一功能进行隔离测试

## What Changes
- 创建 Zustand store (`ImageProcessorStore.ts`) 集中管理图片状态：
  - 原始/处理后的图片数据（base64、尺寸）
  - 画布引用和裁剪状态
  - 编辑参数（裁剪、圆角、边距、背景、缩放）
  - 导出设置（格式、质量、预计大小）
- 拆分独立功能组件：
  - `ImageSourceInput.tsx` - 图片上传、URL 加载、粘贴输入
  - `ImageProcessControls.tsx` - 裁剪、圆角、边距、背景编辑
  - `ImageExportControls.tsx` - 缩放、格式、质量、导出
  - `CropEditor.tsx` - 裁剪参数编辑器（比例、尺寸、位置）
- 抽离纯函数工具库：
  - `imageUtils.ts` - 图片加载、转换、处理逻辑
  - `canvasUtils.ts` - Canvas 渲染逻辑
- 简化主页面 (`page.tsx`) 为纯组合层，只负责布局和组件编排

## Impact
- Affected specs: 新增 `frontend-tools` 能力规范
- Affected code: 
  - `web/app/(views)/tools/image-processor/page.tsx` - 重构为组合层
  - `web/app/(views)/tools/image-processor/ImagePreview.tsx` - 集成 store
  - 新增 `web/app/stores/ImageProcessorStore.ts`
  - 新增 `web/app/(views)/tools/image-processor/components/*`
  - 新增 `web/app/(views)/tools/image-processor/utils/*`
- 不影响现有功能行为，纯架构重构

