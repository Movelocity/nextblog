## ADDED Requirements

### Requirement: Advanced Search with Context Highlighting
系统 SHALL 提供高级搜索模式，返回关键词匹配的上下文信息，便于前端高亮展示和跳转定位。

#### Scenario: Enable advanced search with highlight parameter
- **WHEN** 已认证用户调用搜索接口并携带 `highlight=true` 参数
- **THEN** 响应中每条结果额外包含 `matches` 数组
- **AND** `matches` 数组包含所有匹配项的上下文信息

#### Scenario: Match context structure
- **WHEN** 高级搜索返回匹配结果
- **THEN** 每个 `match` 对象 SHALL 包含以下字段：
  - `field`: 匹配字段名（如 "title", "content", "description"）
  - `context`: 关键词所在的上下文文本（前后各约 50 字符）
  - `offset`: 关键词在原文中的字符偏移位置（用于跳转定位）
- **AND** 结果对象包含 `matchCount` 字段表示该文档中的总匹配次数

#### Scenario: Advanced search response format for posts
- **WHEN** 对 Posts 启用高级搜索
- **THEN** 响应格式为：
```json
{
  "posts": [{
    "id": "...",
    "title": "...",
    "matchCount": 3,
    "matches": [
      { "field": "title", "context": "...关键词...", "offset": 12 },
      { "field": "content", "context": "...关键词...", "offset": 256 }
    ]
  }],
  "total": 10,
  "page": 1,
  "pageSize": 10,
  "totalPages": 1
}
```

#### Scenario: Advanced search response format for notes
- **WHEN** 对 Notes 启用高级搜索
- **THEN** 响应格式为：
```json
{
  "notes": [{
    "id": "...",
    "content": "...",
    "matchCount": 2,
    "matches": [
      { "field": "content", "context": "...关键词...", "offset": 100 }
    ]
  }],
  "total": 5
}
```

### Requirement: Advanced Search Authentication Restriction
高级搜索功能 SHALL 仅对已认证用户可用，以避免额外计算开销。

#### Scenario: Unauthenticated user requests advanced search
- **WHEN** 未认证用户调用 `GET /api/posts/search?keyword=xxx&highlight=true`
- **THEN** 系统忽略 `highlight` 参数
- **AND** 返回普通搜索结果（不包含 matches 信息）

#### Scenario: Authenticated user requests advanced search
- **WHEN** 已认证用户调用 `GET /api/posts/search?keyword=xxx&highlight=true`
- **THEN** 系统返回包含上下文匹配信息的高级搜索结果

### Requirement: Context Window Configuration
上下文窗口 SHALL 提供合理的默认值，并可通过参数自定义。

#### Scenario: Default context window
- **WHEN** 用户未指定 `contextSize` 参数
- **THEN** 系统使用默认值 50 字符（关键词前后各 50 字符）

#### Scenario: Custom context window
- **WHEN** 已认证用户调用搜索接口并携带 `contextSize=100` 参数
- **THEN** 系统返回关键词前后各 100 字符的上下文

