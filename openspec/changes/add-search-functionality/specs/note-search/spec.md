## ADDED Requirements

### Requirement: Note Search API
系统 SHALL 提供笔记搜索 API，支持按关键词搜索笔记内容和标签。

#### Scenario: Search notes by keyword
- **WHEN** 用户调用 `GET /api/notes/search?keyword=xxx`
- **THEN** 系统在笔记的 `content` 和 `tags` 字段中搜索
- **AND** 返回匹配的笔记列表

#### Scenario: Search with pagination
- **WHEN** 用户调用 `GET /api/notes/search?keyword=xxx&page=1&pageSize=20`
- **THEN** 系统返回分页结果
- **AND** 响应包含 `notes` 和 `total` 字段

### Requirement: Auth-Aware Note Search
系统 SHALL 根据用户认证状态自动调整笔记搜索范围。

#### Scenario: Unauthenticated user searches notes
- **WHEN** 未认证用户调用 `GET /api/notes/search?keyword=xxx`
- **THEN** 系统仅在 `isPublic = true` 且 `isArchived = false` 的笔记中搜索
- **AND** 返回匹配的公开笔记列表

#### Scenario: Authenticated user searches notes
- **WHEN** 已认证用户（携带有效 JWT Token）调用 `GET /api/notes/search?keyword=xxx`
- **THEN** 系统在所有笔记中搜索（包括私有和归档笔记）
- **AND** 返回所有匹配的笔记列表

### Requirement: Note Search Response Format
搜索结果响应 SHALL 与现有 `GetNotes` 接口返回格式保持一致。

#### Scenario: Successful search response
- **WHEN** 搜索请求成功
- **THEN** 响应状态码为 200
- **AND** 响应体包含 `{ notes: Note[], total: number }` 结构

#### Scenario: Empty keyword validation
- **WHEN** 用户调用 `GET /api/notes/search` 但未提供 `keyword` 参数
- **THEN** 响应状态码为 400
- **AND** 响应体包含错误信息 `{ error: "keyword is required" }`

