# Notes Archive Capability

## ADDED Requirements

### Requirement: Note Archive Status
笔记 SHALL 支持归档状态，用于标记不再活跃但需要保留的笔记。

#### Scenario: 笔记默认未归档
- **WHEN** 创建新笔记
- **THEN** 笔记的 `isArchived` 字段应为 `false`

#### Scenario: 笔记模型包含归档字段
- **GIVEN** Note 数据模型
- **THEN** 应包含 `isArchived` 布尔字段
- **AND** 该字段默认值为 `false`

### Requirement: Archive Note API
系统 SHALL 提供 API 端点用于归档和取消归档笔记。

#### Scenario: 归档笔记成功
- **GIVEN** 用户已认证
- **AND** 存在 ID 为 `{id}` 的未归档笔记
- **WHEN** 发送 `PUT /api/notes/{id}/archive` 请求，body 为 `{"isArchived": true}`
- **THEN** 返回状态码 200
- **AND** 笔记的 `isArchived` 字段更新为 `true`

#### Scenario: 取消归档笔记成功
- **GIVEN** 用户已认证
- **AND** 存在 ID 为 `{id}` 的已归档笔记
- **WHEN** 发送 `PUT /api/notes/{id}/archive` 请求，body 为 `{"isArchived": false}`
- **THEN** 返回状态码 200
- **AND** 笔记的 `isArchived` 字段更新为 `false`

#### Scenario: 未认证用户无法归档
- **GIVEN** 用户未认证
- **WHEN** 发送 `PUT /api/notes/{id}/archive` 请求
- **THEN** 返回状态码 401

### Requirement: Filter Notes by Archive Status
笔记列表 API SHALL 支持按归档状态过滤。

#### Scenario: 默认返回未归档笔记
- **WHEN** 发送 `GET /api/notes` 请求（不带 `isArchived` 参数）
- **THEN** 仅返回 `isArchived = false` 的笔记

#### Scenario: 查看已归档笔记
- **GIVEN** 用户已认证
- **WHEN** 发送 `GET /api/notes?isArchived=true` 请求
- **THEN** 仅返回 `isArchived = true` 的笔记

#### Scenario: 查看所有笔记
- **GIVEN** 用户已认证
- **WHEN** 发送 `GET /api/notes?isArchived=all` 请求
- **THEN** 返回所有笔记（无论归档状态）

### Requirement: Archive Exclusion in Statistics
统计数据 SHALL 排除已归档的笔记。

#### Scenario: 月度统计排除已归档笔记
- **GIVEN** 存在已归档笔记
- **WHEN** 请求 `GET /api/notes/stats?year=2024&month=12`
- **THEN** 返回的统计数据不包含已归档笔记的计数

## ADDED Frontend Requirements

### Requirement: Archive UI Controls
前端 SHALL 提供归档操作的用户界面。

#### Scenario: NoteCard 显示归档按钮
- **GIVEN** 用户已认证
- **AND** 查看未归档笔记
- **WHEN** 点击笔记卡片的菜单
- **THEN** 显示"归档"选项

#### Scenario: NoteCard 显示取消归档按钮
- **GIVEN** 用户已认证
- **AND** 查看已归档笔记
- **WHEN** 点击笔记卡片的菜单
- **THEN** 显示"取消归档"选项

#### Scenario: 归档成功后笔记从列表移除
- **GIVEN** 用户在查看未归档笔记列表
- **WHEN** 用户归档一条笔记
- **THEN** 该笔记从当前列表中移除
- **AND** 显示操作成功提示

### Requirement: Archive Filter in Sidebar
侧边栏 SHALL 提供归档状态过滤选项。

#### Scenario: 切换查看已归档笔记
- **GIVEN** 用户已认证
- **AND** 侧边栏可见
- **WHEN** 点击"查看已归档"按钮
- **THEN** 笔记列表切换为显示已归档笔记

#### Scenario: 未认证用户无法查看归档选项
- **GIVEN** 用户未认证
- **THEN** 侧边栏不显示归档过滤选项
