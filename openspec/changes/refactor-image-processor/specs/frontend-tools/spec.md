## ADDED Requirements

### Requirement: 图片处理器状态管理
图片处理器 SHALL 使用 Zustand store 集中管理所有状态，包括图片数据、编辑参数、裁剪状态和导出设置。

#### Scenario: 图片加载后初始化状态
- **WHEN** 用户上传或粘贴图片
- **THEN** store 应包含原始图片 base64、尺寸信息
- **AND** 自动初始化缩放尺寸为原始尺寸

#### Scenario: 编辑参数实时同步
- **WHEN** 用户调整圆角、边距或背景
- **THEN** store 状态立即更新
- **AND** 触发图片重新处理到 canvas

#### Scenario: 裁剪两阶段管理
- **WHEN** 用户进入裁剪模式
- **THEN** cropEnabled 设为 true，cropDraft 保存当前裁剪参数
- **AND** 用户点击应用后，cropDraft 复制到 cropApplied，cropEnabled 设为 false
- **AND** 用户点击取消后，cropDraft 恢复为 cropApplied（如存在）

### Requirement: 图片处理器组件模块化
图片处理器 UI SHALL 拆分为职责明确的子组件，每个组件负责单一功能区域。

#### Scenario: 图片源输入组件
- **WHEN** 渲染 ImageSourceInput 组件
- **THEN** 显示文件上传按钮、URL 输入框、粘贴提示
- **AND** 处理图片加载后调用 store 的 setImageState 方法

#### Scenario: 图片处理控制组件
- **WHEN** 渲染 ImageProcessControls 组件
- **THEN** 显示裁剪按钮、圆角滑块、边距滑块、背景选择、重置按钮
- **AND** 裁剪模式启用时条件渲染 CropEditor 子组件

#### Scenario: 图片导出控制组件
- **WHEN** 渲染 ImageExportControls 组件
- **THEN** 显示缩放开关、尺寸/比例设置、格式选择、质量滑块、预计大小、下载/复制按钮
- **AND** 调用 canvasUtils 执行导出操作

### Requirement: 图片处理纯函数工具
图片处理器 SHALL 将图片加载、转换、Canvas 渲染逻辑抽离为纯函数，便于测试和复用。

#### Scenario: 图片加载工具
- **WHEN** 调用 fileToBase64(file)
- **THEN** 返回 Promise<string> 包含 base64 图片数据

#### Scenario: Canvas 渲染工具
- **WHEN** 调用 processImageToCanvas(canvas, imageState, params)
- **THEN** 在 canvas 上渲染处理后的图片（应用裁剪、圆角、边距、背景）
- **AND** 返回处理后的 base64

#### Scenario: 导出 Canvas 工具
- **WHEN** 调用 createExportCanvas(sourceCanvas, scaleParams)
- **THEN** 如果 scaleEnabled 为 true，返回缩放后的新 canvas
- **AND** 否则返回原 canvas

#### Scenario: 文件大小计算工具
- **WHEN** 调用 calculateExportSize(canvas, format, quality)
- **THEN** 使用 toBlob 异步计算文件大小
- **AND** 返回格式化的尺寸和大小字符串（如 "1024 × 768 · 125.34 KB"）

### Requirement: 图片处理器主页面组合
图片处理器主页面 SHALL 作为纯组合层，只负责布局和子组件编排，不包含业务逻辑。

#### Scenario: 主页面布局
- **WHEN** 渲染 ImageProcessorPage
- **THEN** 使用 grid 布局，左侧 ImagePreview，右侧控制面板
- **AND** 控制面板按顺序包含 ImageSourceInput、ImageProcessControls、ImageExportControls

#### Scenario: 主页面副作用协调
- **WHEN** 图片状态或编辑参数变化
- **THEN** 主页面的 useEffect 监听 store 变化
- **AND** 调用 canvasUtils 执行图片处理
- **AND** 触发导出大小计算

### Requirement: 图片预览组件 Store 集成
ImagePreview 组件 SHALL 从 store 读取裁剪状态，不再通过 props 传递。

#### Scenario: 裁剪状态同步
- **WHEN** ImagePreview 组件渲染
- **THEN** 使用 useImageProcessorStore 读取 cropEnabled、cropDraft
- **AND** 用户拖动裁剪框时，调用 store.setCropDraft 更新

#### Scenario: 图片显示
- **WHEN** cropEnabled 为 true
- **THEN** 显示原始图片和裁剪覆盖层
- **AND** cropEnabled 为 false 时，显示处理后图片

