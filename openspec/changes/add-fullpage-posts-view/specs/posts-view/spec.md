## ADDED Requirements

### Requirement: Fullpage Layout
系统 SHALL 提供一个全屏布局路由 `(fullpage)`，该布局不包含系统侧边栏导航，用于需要最大化工作区域的功能页面。

#### Scenario: 访问全屏布局页面
- **WHEN** 用户访问 `(fullpage)` 路由组下的页面
- **THEN** 页面以全屏方式展示，无系统侧边栏导航
- **AND** Toast 提示和登录弹窗功能正常可用

### Requirement: Posts View Page
系统 SHALL 在 `/posts-view` 路径提供文档编辑视图页面，该页面采用左右分栏布局。

#### Scenario: 显示文档编辑视图
- **WHEN** 用户访问 `/posts-view` 页面
- **THEN** 页面左侧显示文档列表侧边栏
- **AND** 页面右侧显示文档编辑区域

### Requirement: Document List Sidebar
文档列表侧边栏 SHALL 显示可搜索、可滚动的文档标题列表。

#### Scenario: 搜索过滤文档
- **WHEN** 用户在搜索框输入关键词
- **THEN** 文档列表实时过滤，仅显示标题匹配关键词的文档

#### Scenario: 滚动浏览文档列表
- **WHEN** 文档数量超出侧边栏可视区域
- **THEN** 用户可以滚动浏览完整的文档列表

#### Scenario: 选中文档
- **WHEN** 用户点击文档列表中的某个文档项
- **THEN** 该文档项高亮显示为选中状态
- **AND** 右侧编辑区域加载该文档内容

### Requirement: Document Editor Integration
右侧编辑区域 SHALL 复用现有 `PostEditor` 组件，根据选中文档加载和编辑内容。

#### Scenario: 加载选中文档
- **WHEN** 用户在左侧列表选中一篇文档
- **THEN** 右侧编辑区域加载该文档的标题、内容、分类、标签等信息

#### Scenario: 无文档选中时的空状态
- **WHEN** 未选中任何文档
- **THEN** 右侧编辑区域显示空状态提示

### Requirement: Theme Support
文档编辑视图页面 SHALL 支持亮色和暗色主题，通过 CSS 变量实现主题切换。

#### Scenario: 切换主题
- **WHEN** 用户点击主题切换按钮
- **THEN** 页面在亮色和暗色主题之间切换
- **AND** 主题设置持久化保存到本地存储

