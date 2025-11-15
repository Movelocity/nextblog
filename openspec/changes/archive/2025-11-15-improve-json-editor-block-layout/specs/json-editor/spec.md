## MODIFIED Requirements

### Requirement: Multi-Box Editor Management
系统 SHALL 提供多编辑框管理界面，支持创建、删除和管理编辑框，最多允许 3 个编辑框同时存在。

#### Scenario: Add new editor box (within limit)
- **WHEN** 用户点击"添加编辑框"按钮
- **AND** 当前编辑框数量少于 3 个
- **THEN** 创建一个新的空编辑框并添加到编辑框列表
- **AND** 新编辑框被分配唯一 ID 和默认 label
- **AND** 新编辑框立即显示在界面上

#### Scenario: Block adding when limit reached
- **WHEN** 用户点击"添加编辑框"按钮
- **AND** 当前已有 3 个编辑框
- **THEN** 显示提示信息"最多只能创建 3 个编辑框"
- **AND** 不创建新的编辑框
- **AND** "添加编辑框"按钮变为禁用状态

#### Scenario: Remove editor box
- **WHEN** 用户删除一个编辑框
- **THEN** 编辑框从列表中移除
- **AND** 其他编辑框的布局自动调整
- **AND** 如果内容非空，显示确认对话框

#### Scenario: Persist box state
- **WHEN** 用户修改编辑框内容
- **THEN** 状态在 1 秒防抖后自动保存到 IndexedDB
- **AND** 保存内容包括：所有编辑框数据（最多 3 个）
- **AND** 下次加载时完整恢复状态

#### Scenario: Load existing boxes beyond limit
- **WHEN** 用户加载包含超过 3 个编辑框的旧数据
- **THEN** 只加载前 3 个编辑框
- **AND** 显示提示"已有 X 个编辑框未显示，建议删除多余的编辑框" in a non-verbal way
- **AND** 用户可以手动删除当前编辑框来查看其他编辑框

---

## MODIFIED Requirements

### Requirement: Responsive Layout
系统 SHALL 根据屏幕尺寸和编辑框数量自动调整布局，确保在不同设备上保持可用性。

#### Scenario: Desktop layout with 1 box
- **WHEN** 视口宽度大于 1024px
- **AND** 只有 1 个编辑框
- **THEN** 编辑框占据 100% 宽度
- **AND** 垂直拖动调整高度功能可用

#### Scenario: Desktop layout with 2 boxes
- **WHEN** 视口宽度大于 1024px
- **AND** 有 2 个编辑框
- **THEN** 两个编辑框并排显示，各占约 50% 宽度
- **AND** 编辑框之间保持 16px 间距
- **AND** 每个编辑框可独立调整高度

#### Scenario: Desktop layout with 3 boxes
- **WHEN** 视口宽度大于 1024px
- **AND** 有 3 个编辑框
- **THEN** 三个编辑框并排显示，各占约 33% 宽度
- **AND** 编辑框之间保持 16px 间距
- **AND** 每个编辑框可独立调整高度

#### Scenario: Tablet auto-fold (2 boxes)
- **WHEN** 视口宽度在 640px 到 1024px 之间
- **AND** 有 2 个或更少的编辑框
- **THEN** 编辑框并排显示（2 列布局）
- **AND** 每个编辑框宽度自动调整

#### Scenario: Tablet auto-fold (3 boxes)
- **WHEN** 视口宽度在 640px 到 1024px 之间
- **AND** 有 3 个编辑框
- **THEN** 前 2 个编辑框显示在第一行（各占 50% 宽度）
- **AND** 第 3 个编辑框显示在第二行（占 100% 宽度）
- **AND** 行之间保持 16px 间距

#### Scenario: Mobile single column
- **WHEN** 视口宽度小于 640px
- **THEN** 所有编辑框垂直堆叠显示（单列）
- **AND** 每个编辑框占 100% 宽度
- **AND** 编辑框之间保持 16px 间距
- **AND** 垂直拖动调整高度功能可用

#### Scenario: Dynamic window resize
- **WHEN** 用户调整浏览器窗口大小导致跨越断点
- **THEN** 布局自动重新计算和调整
- **AND** 编辑框的内容和状态不受影响
- **AND** 布局转换流畅自然（使用 CSS transition）
