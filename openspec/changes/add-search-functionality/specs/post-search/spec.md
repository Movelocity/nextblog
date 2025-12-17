## ADDED Requirements

### Requirement: Auth-Aware Post Search
系统 SHALL 根据用户认证状态自动调整文章搜索范围。

#### Scenario: Unauthenticated user searches posts
- **WHEN** 未认证用户调用 `GET /api/posts/search?keyword=xxx`
- **THEN** 系统仅在 `published = true` 的文章中搜索
- **AND** 返回匹配的已发布文章列表

#### Scenario: Authenticated user searches posts
- **WHEN** 已认证用户（携带有效 JWT Token）调用 `GET /api/posts/search?keyword=xxx`
- **THEN** 系统在所有文章中搜索（包括草稿）
- **AND** 返回所有匹配的文章列表

#### Scenario: Search with pagination
- **WHEN** 用户调用 `GET /api/posts/search?keyword=xxx&page=1&pageSize=10`
- **THEN** 系统返回分页结果
- **AND** 响应包含 `posts`, `total`, `page`, `pageSize`, `totalPages` 字段

