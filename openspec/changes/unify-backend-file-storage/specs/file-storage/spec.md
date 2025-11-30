# 文件存储规格

本规格定义了后端文件存储和管理的核心需求。

## ADDED Requirements

### Requirement: 统一文件命名规则

系统 SHALL 在存储任何类型的文件时使用统一的命名格式：`{timestamp}-{suffix}-{randomid}`（无扩展名）。

**详细说明**：
- `timestamp`: 毫秒级时间戳（`time.Now().UnixMilli()`）
- `suffix`: 文件扩展名（不含点，如 `jpg`, `png`, `pdf`）
- `randomid`: 6 位随机数（`time.Now().Nanosecond()%1000000`）
- 物理文件名不包含扩展名
- 原始文件名和扩展名存储在数据库 `file_resources` 表中

#### Scenario: 上传 JPEG 图片
- **WHEN** 用户上传名为 `avatar.jpg` 的图片文件
- **THEN** 系统生成文件 ID 如 `1638123456789-jpg-123456`
- **AND** 物理文件存储为 `storage/images/1638123456789-jpg-123456`（无 `.jpg` 扩展名）
- **AND** 数据库记录包含 `{id: "1638123456789-jpg-123456", original_name: "avatar.jpg", extension: ".jpg"}`

#### Scenario: 上传博客资产文件
- **WHEN** 用户为博客上传附件 `document.pdf`
- **THEN** 系统生成文件 ID 如 `1638123456800-pdf-456789`
- **AND** 物理文件存储为 `storage/blog-assets/1638123456800-pdf-456789`
- **AND** 数据库记录包含 `{id: "1638123456800-pdf-456789", original_name: "document.pdf", extension: ".pdf"}`

#### Scenario: 生成缩略图
- **WHEN** 系统为图片 `1638123456789-jpg-123456` 生成缩略图
- **THEN** 缩略图 ID 如 `1638123456791-jpg-123460`（独立 ID）
- **AND** 缩略图存储为 `storage/thumbnails/1638123456791-jpg-123460`
- **AND** 数据库记录中 `thumbnail_id` 字段关联到缩略图文件资源

### Requirement: 文件资源数据库管理

系统 SHALL 在数据库 `file_resources` 表中记录所有文件的元数据，并通过该表查询和访问文件。

**详细说明**：
- 所有文件操作必须先查询数据库获取文件资源记录
- 禁止直接拼接文件路径访问文件系统
- 文件删除时同步删除数据库记录和物理文件

#### Scenario: 获取图片文件
- **WHEN** 前端请求 `/api/images/1638123456789-jpg-123456`
- **THEN** 后端查询 `file_resources` 表获取文件记录
- **AND** 使用记录中的 `storage_path` 字段返回文件内容
- **AND** 如果数据库中不存在该记录，返回 404 错误

#### Scenario: 删除博客资产
- **WHEN** 用户删除博客资产 `1638123456800-pdf-456789`
- **THEN** 后端删除 `post_asset_relations` 表中的关联记录
- **AND** 删除 `file_resources` 表中的文件记录
- **AND** 删除物理文件 `storage/blog-assets/1638123456800-pdf-456789`
- **AND** 如果该资产有缩略图，同时删除缩略图记录和文件

#### Scenario: 列出博客资产
- **WHEN** 前端请求 `/api/posts/{postId}/assets`
- **THEN** 后端查询 `post_asset_relations` 表获取关联的文件 ID 列表
- **AND** 联合查询 `file_resources` 表获取文件元数据（原始文件名、大小、MIME 类型）
- **AND** 返回包含完整元数据的资产列表

### Requirement: 数据库迁移支持

系统 SHALL 提供自动迁移工具，将现有的带扩展名文件重命名为无扩展名格式，并更新数据库记录。

**详细说明**：
- 迁移过程必须幂等（可重复执行）
- 支持迁移 `images/`, `thumbnails/`, `blog-assets/` 目录中的文件
- 迁移操作记录到日志文件（`migration-log.json`）
- 提供回滚功能恢复原文件名

#### Scenario: 执行文件名迁移
- **WHEN** 管理员运行迁移命令 `./migrate --migrate-files`
- **THEN** 系统扫描 `storage/{images,thumbnails,blog-assets}` 目录
- **AND** 识别所有带扩展名的文件（如 `123456.jpg`）
- **AND** 重命名为 `{timestamp}-{ext}-{random}` 格式（如 `1638123456789-jpg-123456`）
- **AND** 在数据库中创建或更新对应的 `file_resources` 记录
- **AND** 记录所有操作到 `migration-log.json`

#### Scenario: 幂等性检查
- **WHEN** 迁移脚本重复执行
- **THEN** 系统跳过已符合新格式的文件（通过正则匹配 `^\d+-\w+-\d+$`）
- **AND** 仅处理带扩展名的旧文件
- **AND** 不会重复迁移已处理的文件

#### Scenario: 迁移回滚
- **WHEN** 管理员运行回滚命令 `./migrate --rollback-files`
- **THEN** 系统读取 `migration-log.json` 中的操作记录
- **AND** 将新文件名恢复为原文件名（如 `1638123456789-jpg-123456` → `123456.jpg`）
- **AND** 删除迁移过程中创建的数据库记录
- **AND** 验证所有文件已恢复原状

#### Scenario: 迁移验证
- **WHEN** 迁移完成后运行验证命令 `./migrate --validate-migration`
- **THEN** 系统统计迁移前后的文件数量
- **AND** 验证所有文件都有对应的数据库记录
- **AND** 验证所有数据库记录对应的物理文件存在
- **AND** 输出验证报告（成功/失败文件数量）

### Requirement: API 响应格式兼容性

系统 SHALL 保持 API 响应格式不变，确保前端无需修改即可使用新的文件存储机制。

**详细说明**：
- API 响应中必须包含 `id`, `original_name`, `extension`, `mime_type`, `size`, `url` 字段
- `url` 字段使用文件 ID（而非原始文件名）作为路径参数
- 响应中不暴露物理存储路径

#### Scenario: 上传图片成功响应
- **WHEN** 前端上传图片 `avatar.jpg`
- **THEN** 后端返回 JSON 响应：
```json
{
  "id": "1638123456789-jpg-123456",
  "original_name": "avatar.jpg",
  "extension": ".jpg",
  "mime_type": "image/jpeg",
  "size": 102400,
  "url": "/api/images/1638123456789-jpg-123456",
  "thumbnail_url": "/api/images/1638123456789-jpg-123456/thumbnail",
  "created_at": "2025-11-30T12:00:00Z"
}
```
- **AND** 前端可以通过 `url` 字段访问图片（无需知道扩展名）

#### Scenario: 列出博客资产响应
- **WHEN** 前端请求 `/api/posts/1234567890/assets`
- **THEN** 后端返回资产列表（每项包含完整元数据）：
```json
{
  "assets": [
    {
      "id": "1638123456800-pdf-456789",
      "original_name": "document.pdf",
      "extension": ".pdf",
      "mime_type": "application/pdf",
      "size": 512000,
      "url": "/api/posts/1234567890/assets/1638123456800-pdf-456789",
      "created_at": "2025-11-30T12:10:00Z"
    }
  ]
}
```
- **AND** 响应格式与旧版 API 完全一致（前端无感知变更）

### Requirement: 文件访问安全性

系统 SHALL 通过数据库记录验证文件访问权限，防止路径遍历攻击和未授权访问。

**详细说明**：
- 禁止直接使用用户输入拼接文件路径
- 所有文件访问必须先验证数据库记录存在性
- 博客资产访问需验证 `post_asset_relations` 关联关系

#### Scenario: 访问不存在的文件
- **WHEN** 前端请求 `/api/images/nonexistent-file-id`
- **THEN** 后端查询 `file_resources` 表未找到记录
- **AND** 返回 404 错误（不尝试访问文件系统）
- **AND** 记录访问日志（可能的攻击行为）

#### Scenario: 访问他人博客的资产
- **WHEN** 前端请求 `/api/posts/1234567890/assets/1638123456800-pdf-456789`
- **AND** 数据库中不存在 `post_id=1234567890` 和 `file_id=1638123456800-pdf-456789` 的关联记录
- **THEN** 后端返回 403 或 404 错误（资产不属于该博客）
- **AND** 不返回文件内容

#### Scenario: 路径遍历攻击防护
- **WHEN** 前端尝试访问 `/api/images/../../../etc/passwd`
- **THEN** 后端查询 `file_resources` 表时未找到 `id='../../../etc/passwd'` 的记录
- **AND** 返回 404 错误（不解析路径参数）
- **AND** 记录安全日志

### Requirement: 文件 ID 唯一性保证

系统 SHALL 确保生成的文件 ID 在高并发场景下仍保持唯一性，避免文件覆盖或冲突。

**详细说明**：
- 使用毫秒级时间戳 + 纳秒级随机数生成 ID
- 数据库主键约束防止重复 ID 插入
- 插入失败时自动重试（最多 3 次）

#### Scenario: 并发上传不冲突
- **WHEN** 多个用户同时上传文件（并发请求）
- **THEN** 每个文件生成的 ID 不同（时间戳 + 随机数组合）
- **AND** 所有文件成功保存（无覆盖）
- **AND** 数据库记录互不冲突

#### Scenario: ID 冲突时自动重试
- **WHEN** 生成的文件 ID 与现有记录冲突（极小概率）
- **THEN** 数据库插入失败（主键冲突）
- **AND** 系统自动重新生成新 ID 并重试
- **AND** 最多重试 3 次后返回错误（如仍失败）

#### Scenario: ID 格式验证
- **WHEN** 前端请求文件时传递文件 ID
- **THEN** 后端验证 ID 格式符合 `^\d+-\w+-\d+$` 正则表达式
- **AND** 格式不符时直接返回 400 错误（无需查询数据库）

## Performance Requirements

### Requirement: 文件访问性能

系统 SHALL 保证文件访问性能不因数据库查询而显著下降，确保响应时间在可接受范围内。

**性能指标**：
- 单文件访问响应时间 < 100ms（P95）
- 数据库查询时间 < 10ms（P95）
- 支持并发 100+ 文件访问请求

#### Scenario: 高并发图片访问
- **WHEN** 100 个并发请求访问不同图片
- **THEN** 每个请求的响应时间 < 100ms（P95）
- **AND** 数据库连接池无耗尽
- **AND** 文件系统 I/O 无瓶颈

#### Scenario: 数据库查询优化
- **WHEN** 查询 `file_resources` 表（数据量 > 10000 条记录）
- **THEN** 单次查询时间 < 10ms（使用主键索引）
- **AND** 缓存常用文件记录（如缩略图）
- **AND** 避免全表扫描

## Compatibility Requirements

### Requirement: 前端服务层兼容

系统 SHALL 确保 API 变更不影响前端服务层（`app/services/*`）的调用逻辑。

**详细说明**：
- API URL 路径保持不变
- 请求参数和响应格式保持不变
- 前端无需修改代码即可使用新后端

#### Scenario: 前端图片上传流程
- **WHEN** 前端调用 `app/services/image.ts:uploadImage()` 上传图片
- **THEN** 后端 API 返回的响应格式与旧版一致
- **AND** 前端解析响应中的 `url` 字段显示图片
- **AND** 无需修改前端代码

#### Scenario: 前端博客资产管理
- **WHEN** 前端调用 `app/services/assets.ts:uploadAsset()` 上传博客资产
- **THEN** 后端 API 响应格式与旧版一致
- **AND** 前端可以通过 `url` 字段下载或预览资产
- **AND** 无需修改前端代码

