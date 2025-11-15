# Spec Delta for json-editor

## MODIFIED Requirements

### Requirement: Responsive Layout
系统 SHALL 根据屏幕尺寸和编辑框数量自动调整布局，确保在不同设备上保持可用性。页面 SHALL 固定为屏幕高度，不产生页面级滚动。

#### Scenario: Full-screen fixed layout
- **WHEN** 用户打开 JSON 编辑器页面
- **THEN** 页面容器固定为屏幕高度 (h-screen)
- **AND** 页面整体不产生滚动 (overflow-hidden)
- **AND** Header 和工具栏固定在顶部
- **AND** 编辑框区域占据剩余的垂直空间
- **AND** 滚动仅在单个编辑框内部发生

#### Scenario: Desktop layout with 1 box
- **WHEN** 视口宽度大于 1024px
- **AND** 只有 1 个编辑框
- **THEN** 编辑框占据 100% 宽度
- **AND** 编辑框高度填满剩余垂直空间
- **AND** 垂直拖动调整高度功能可用

#### Scenario: Desktop layout with 2 boxes
- **WHEN** 视口宽度大于 1024px
- **AND** 有 2 个编辑框
- **THEN** 两个编辑框并排显示，各占约 50% 宽度
- **AND** 编辑框之间保持 16px 间距
- **AND** 每个编辑框高度填满剩余垂直空间
- **AND** 每个编辑框可独立调整高度

#### Scenario: Desktop layout with 3 boxes
- **WHEN** 视口宽度大于 1024px
- **AND** 有 3 个编辑框
- **THEN** 三个编辑框并排显示，各占约 33% 宽度
- **AND** 编辑框之间保持 16px 间距
- **AND** 每个编辑框高度填满剩余垂直空间
- **AND** 每个编辑框可独立调整高度

#### Scenario: Tablet auto-fold (2 boxes)
- **WHEN** 视口宽度在 640px 到 1024px 之间
- **AND** 有 2 个或更少的编辑框
- **THEN** 编辑框并排显示（2 列布局）
- **AND** 每个编辑框宽度自动调整
- **AND** 每个编辑框高度填满剩余垂直空间

#### Scenario: Tablet auto-fold (3 boxes)
- **WHEN** 视口宽度在 640px 到 1024px 之间
- **AND** 有 3 个编辑框
- **THEN** 前 2 个编辑框显示在第一行（各占 50% 宽度）
- **AND** 第 3 个编辑框显示在第二行（占 100% 宽度）
- **AND** 行之间保持 16px 间距
- **AND** 编辑框区域支持垂直滚动以显示所有编辑框

#### Scenario: Mobile single column
- **WHEN** 视口宽度小于 640px
- **THEN** 所有编辑框垂直堆叠显示（单列）
- **AND** 每个编辑框占 100% 宽度
- **AND** 编辑框之间保持 16px 间距
- **AND** 编辑框区域支持垂直滚动以显示所有编辑框
- **AND** 垂直拖动调整高度功能可用

#### Scenario: Dynamic window resize
- **WHEN** 用户调整浏览器窗口大小导致跨越断点
- **THEN** 布局自动重新计算和调整
- **AND** 编辑框的内容和状态不受影响
- **AND** 布局转换流畅自然（使用 CSS transition）
- **AND** 编辑框高度自动适应新的可用空间

