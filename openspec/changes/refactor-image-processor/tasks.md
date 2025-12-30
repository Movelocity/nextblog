# 实现任务

## 1. 创建状态管理层
- [x] 1.1 创建 `ImageProcessorStore.ts` 定义完整状态接口
- [x] 1.2 实现图片数据状态（原始/处理后图片、尺寸）
- [x] 1.3 实现画布和裁剪状态（cropEnabled、应用的裁剪参数）
- [x] 1.4 实现编辑参数状态（borderRadius、padding、background）
- [x] 1.5 实现缩放和导出状态（scaleEnabled、exportFormat、jpgQuality）
- [x] 1.6 实现状态更新方法（setter 和复合操作）

## 2. 抽离工具函数
- [x] 2.1 创建 `utils/imageUtils.ts` 包含：
  - [x] fileToBase64、loadImageFromBase64
  - [x] 图片处理参数签名生成
- [x] 2.2 创建 `utils/canvasUtils.ts` 包含：
  - [x] processImageToCanvas（渲染逻辑）
  - [x] createExportCanvas（缩放导出）
  - [x] calculateExportSize（文件大小估算）

## 3. 拆分 UI 组件
- [x] 3.1 创建 `components/ImageSourceInput.tsx`：
  - [x] 文件上传按钮和处理
  - [x] URL 输入和加载
  - [x] 粘贴事件监听
  - [x] 图片信息展示
- [x] 3.2 创建 `components/CropEditor.tsx`：
  - [x] 比例预设按钮网格
  - [x] 尺寸预设按钮
  - [x] 自定义宽高输入
  - [x] X/Y 偏移滑块
  - [x] 应用/取消按钮
- [x] 3.3 创建 `components/ImageProcessControls.tsx`：
  - [x] 裁剪控制（开始裁剪/调整裁剪）
  - [x] 圆角滑块
  - [x] 边距滑块
  - [x] 背景选择（透明/白色/自定义）
  - [x] 重置按钮
- [x] 3.4 创建 `components/ImageExportControls.tsx`：
  - [x] 缩放启用开关
  - [x] 比例/尺寸预设（复用 CropEditor 逻辑）
  - [x] 缩放百分比滑块
  - [x] 格式选择（PNG/JPG/WebP/ICO）
  - [x] JPG 质量滑块
  - [x] 预计大小显示
  - [x] 下载/复制按钮

## 4. 重构主页面
- [x] 4.1 修改 `page.tsx` 为纯组合层（移除所有状态和逻辑）
- [x] 4.2 使用 `useImageProcessorStore` 钩子
- [x] 4.3 编排子组件布局（左侧预览、右侧控制面板）
- [x] 4.4 保持现有 UI 结构和样式

## 5. 集成和测试
- [x] 5.1 更新 `ImagePreview.tsx` 从 store 读取裁剪状态
- [x] 5.2 确保所有功能正常（上传、裁剪、编辑、导出）
- [x] 5.3 验证状态同步和数据流
- [x] 5.4 检查无 lint 错误
- [x] 5.5 清理未使用的代码和导入
