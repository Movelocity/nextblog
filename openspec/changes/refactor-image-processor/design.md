# 设计文档

## Context
当前图片处理器是一个功能完整的纯前端工具，支持图片上传、裁剪、样式编辑、缩放和多格式导出。但所有代码集中在单一文件，随着功能增长，维护成本急剧上升。需要在不破坏现有功能的前提下进行架构优化。

## Goals / Non-Goals
**Goals:**
- 将 1322 行单文件拆分为职责明确的模块
- 使用 Zustand 集中管理状态，提升可追踪性
- 组件化 UI，每个组件负责单一功能区域
- 抽离纯函数逻辑，便于测试和复用
- 保持现有功能和 UI 完全不变

**Non-Goals:**
- 不添加新功能
- 不改变 UI 布局和样式
- 不影响性能（保持相同或更优）
- 不引入新的外部依赖

## Decisions

### 1. 状态管理：Zustand Store
**决策:** 使用 Zustand 创建 `ImageProcessorStore` 集中管理状态

**理由:**
- 项目已采用 Zustand（参考 `EditPostStore.ts`）
- 轻量级，无需额外依赖
- 支持细粒度订阅，避免不必要的重渲染
- API 简洁，易于维护

**备选方案:**
- Context API：会导致不必要的全局重渲染
- Redux：过于重量级，不适合工具页面

### 2. 组件拆分策略
**决策:** 按功能区域拆分为 4 个子组件 + 工具函数

**组件职责划分:**
```
page.tsx (组合层)
├── ImagePreview (左侧)
└── 右侧控制面板
    ├── ImageSourceInput (图片源)
    ├── ImageProcessControls (编辑控制)
    │   └── CropEditor (裁剪编辑器，条件渲染)
    └── ImageExportControls (导出设置)
```

**理由:**
- 每个组件对应用户界面的独立功能区
- 组件大小适中（预计每个 100-200 行）
- 便于独立开发和测试

### 3. Canvas 处理逻辑
**决策:** 将 Canvas ref 保留在 store 中，渲染逻辑抽离为纯函数

**实现:**
- Store 保存 `canvasRef`（通过回调 ref 更新）
- `processImageToCanvas(canvas, imageState, params)` 纯函数处理渲染
- `createExportCanvas(sourceCanvas, scaleParams)` 处理缩放导出

**理由:**
- Canvas 操作需要访问 DOM 元素，ref 必须存在某处
- 纯函数易于测试和维护
- 分离副作用和业务逻辑

### 4. 副作用处理
**决策:** 保留必要的 useEffect 在主页面，监听 store 变化触发处理

**关键副作用:**
- 图片加载时初始化 scale 尺寸
- 参数变化时重新处理图片到 canvas
- 导出参数变化时计算文件大小

**理由:**
- 保持 React 数据流清晰
- 副作用集中在组合层，便于理解
- 子组件保持纯净，只负责展示和用户交互

### 5. 裁剪状态管理
**决策:** 区分 `cropDraft`（编辑中）和 `cropApplied`（已应用）

**状态设计:**
```typescript
{
  cropEnabled: boolean,       // 是否处于裁剪模式
  cropDraft: CropParams,      // 当前裁剪框参数（编辑中）
  cropApplied: CropParams | null,  // 已应用的裁剪
}
```

**理由:**
- 支持"取消裁剪"恢复到上次应用的状态
- 预览时显示 draft，最终处理使用 applied
- 清晰表达裁剪的两阶段流程（编辑 → 应用）

## Risks / Trade-offs

### 风险：状态同步复杂度
- **风险:** 多个组件同时操作 store，可能出现意外的状态依赖
- **缓解:** 
  - 明确定义每个组件只修改特定的状态片段
  - 使用 TypeScript 严格类型检查
  - 保留必要的 useEffect 在主页面统一协调

### 风险：Canvas ref 管理
- **风险:** ref 在 store 中，组件卸载时可能未清理
- **缓解:**
  - 使用回调 ref 自动跟踪 canvas 挂载/卸载
  - 在工具函数中检查 ref 有效性

### Trade-off：组件粒度
- **取舍:** CropEditor 作为独立组件 vs 内联在 ImageProcessControls
- **选择:** 独立组件
- **理由:** 裁剪编辑器逻辑复杂（比例、尺寸、位置），值得单独拆分；复用可能性（导出缩放也有类似逻辑）

## Migration Plan
1. **阶段 1:** 创建 store 和工具函数（不影响现有代码）
2. **阶段 2:** 逐个创建子组件（与现有代码并存）
3. **阶段 3:** 切换主页面到新架构（一次性替换）
4. **阶段 4:** 测试验证所有功能
5. **回滚方案:** Git revert 恢复到重构前版本

**无数据迁移需求**（纯前端工具，无持久化状态）

## Open Questions
无（架构清晰，现有代码提供完整参考）

