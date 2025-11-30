## ADDED Requirements

### Requirement: 文件ID化存储和元数据管理

系统 SHALL 使用独立文件ID作为物理文件名（无扩展名），将原始文件名、扩展名和MIME类型等元数据存储在数据库中。

#### Scenario: 保存文件时生成ID
- **WHEN** 调用文件存储接口保存新文件
- **AND** 提供文件数据和分类
- **THEN** SHALL 生成唯一文件ID（如 `1638123456789-abc`）
- **AND** 以文件ID作为物理文件名保存（不含扩展名）
- **AND** 在 `file_resources` 表中创建记录，保存原始文件名、扩展名、MIME类型等元数据
- **AND** 返回文件ID给调用者

#### Scenario: 根据文件ID获取文件
- **WHEN** 调用 `Get(fileID)` 方法
- **AND** 文件ID存在于数据库
- **THEN** SHALL 根据ID读取物理文件数据
- **AND** 从数据库获取扩展名和MIME类型
- **AND** 返回文件数据

#### Scenario: 获取不存在的文件ID
- **WHEN** 调用 `Get(fileID)` 方法
- **AND** 文件ID不存在于数据库
- **THEN** SHALL 返回 "file not found" 错误

#### Scenario: 删除文件
- **WHEN** 调用 `Delete(fileID)` 方法
- **AND** 检查文件没有其他关联引用
- **THEN** SHALL 删除物理文件
- **AND** 删除 `file_resources` 表中的记录

#### Scenario: 列出分类下的所有文件
- **WHEN** 调用 `List(category)` 方法
- **AND** category 为 "images"
- **THEN** SHALL 从 `file_resources` 表查询该分类的所有记录
- **AND** 返回文件ID列表及元数据（original_name, extension, size, created_at）

### Requirement: 博客-资产关联管理

系统 SHALL 提供独立的关联表管理博客与文件资源的关系，支持一对多关联和关联类型标识。

#### Scenario: 创建博客-资产关联
- **WHEN** 上传资产到指定博客
- **AND** 文件已保存到 `file_resources`
- **THEN** SHALL 在 `post_asset_relations` 表创建关联记录
- **AND** 记录包含 post_id, file_id, relation_type（如 "attachment"）
- **AND** 支持设置 display_order 排序字段

#### Scenario: 查询博客的所有资产
- **WHEN** 调用获取博客资产列表 API
- **THEN** SHALL 通过 `post_asset_relations` 表关联查询
- **AND** 返回文件资源的完整信息（ID、原始文件名、扩展名、大小等）
- **AND** 按 display_order 排序

#### Scenario: 删除博客资产关联
- **WHEN** 删除博客的某个资产
- **THEN** SHALL 删除 `post_asset_relations` 中的关联记录
- **AND** 检查该文件是否还有其他博客引用
- **AND** 如无其他引用，删除 `file_resources` 记录和物理文件

#### Scenario: 同一文件被多个博客引用
- **WHEN** 一个文件被多个博客关联
- **THEN** SHALL 在 `post_asset_relations` 表中创建多条记录（不同 post_id，相同 file_id）
- **AND** 删除其中一个博客的关联时，不删除物理文件（仍有其他引用）

### Requirement: 旧数据自动迁移

系统 SHALL 在启动时检测并自动迁移带扩展名的旧文件格式，将其转换为ID化存储。

#### Scenario: 检测到带扩展名的旧文件
- **WHEN** 服务启动时执行迁移检查
- **AND** 存储目录中存在带扩展名的文件（如 `avatar.jpg`）
- **THEN** SHALL 识别该文件为旧格式

#### Scenario: 迁移旧文件
- **WHEN** 检测到旧格式文件
- **THEN** SHALL 提取文件扩展名（如 `.jpg`）
- **AND** 生成新的文件ID（如 `1638123456789-abc`）
- **AND** 重命名物理文件：`avatar.jpg` → `1638123456789-abc`
- **AND** 在 `file_resources` 表创建记录（original_name="avatar.jpg", extension=".jpg"）

#### Scenario: 迁移博客资产文件
- **WHEN** 检测到博客资产目录下的旧格式文件（如 `blog-assets/1234567/diagram.png`）
- **THEN** SHALL 提取 post_id（`1234567`）
- **AND** 重命名文件并创建 `file_resources` 记录
- **AND** 在 `post_asset_relations` 表创建关联记录（post_id=1234567, file_id=新ID）

#### Scenario: 避免重复迁移
- **WHEN** 迁移脚本多次执行
- **AND** 文件已在 `file_resources` 表中有记录
- **THEN** SHALL 跳过该文件，不重复迁移
- **AND** 记录日志表明文件已迁移

#### Scenario: 迁移失败不影响服务启动
- **WHEN** 迁移过程中某个文件处理失败（如权限问题）
- **THEN** SHALL 记录错误日志
- **AND** 继续处理其他文件
- **AND** 服务仍可正常启动（迁移失败不阻塞启动）

### Requirement: 统一文件存储接口

系统 SHALL 提供统一的文件存储抽象接口 `FileStorage`，支持不同类型文件的管理和未来扩展到云存储。

#### Scenario: 保存文件并返回ID
- **WHEN** 调用 `Save(category, data)` 方法
- **AND** category 为 "images"
- **THEN** SHALL 生成唯一文件ID
- **AND** 文件保存到 `{storage_path}/{category}/{fileID}`（无扩展名）
- **AND** 返回文件ID

#### Scenario: 获取已存在的文件
- **WHEN** 调用 `Get(fileID)` 方法
- **AND** 文件ID对应的物理文件存在
- **THEN** SHALL 返回文件的字节数据
- **AND** 不产生错误

#### Scenario: 删除文件
- **WHEN** 调用 `Delete(fileID)` 方法
- **AND** 文件存在
- **THEN** 文件 SHALL 从存储中移除
- **AND** 返回成功状态

#### Scenario: 列出分类下的所有文件ID
- **WHEN** 调用 `List(category)` 方法
- **AND** category 为 "images"
- **THEN** SHALL 返回该分类下所有文件的ID列表

### Requirement: 博客资产管理 API

系统 SHALL 提供按博客（post）分组的资产管理 API，支持资产的上传、列表、获取和删除操作。所有文件以ID存储，API响应时返回完整元数据。

#### Scenario: 列出博客的所有资产
- **WHEN** 发送 GET 请求到 `/api/posts/{postId}/assets`
- **AND** postId 存在且有关联资产
- **THEN** SHALL 返回状态码 200
- **AND** 响应体包含 `{ assets: [...] }` 数组
- **AND** 每个资产包含 fileId, originalName, extension, size, mimeType, createdAt 字段

#### Scenario: 上传博客资产
- **WHEN** 发送 POST 请求到 `/api/posts/{postId}/assets`
- **AND** 请求体为 FormData，包含 file 字段
- **THEN** SHALL 生成文件ID并保存文件到存储（不含扩展名）
- **AND** 在 `file_resources` 表中创建记录（保存扩展名和元数据）
- **AND** 在 `post_asset_relations` 表中创建关联记录
- **AND** 返回状态码 200 及 `{ success: true, fileId: "...", originalName: "..." }`

#### Scenario: 上传资产时 postId 不存在
- **WHEN** 发送 POST 请求到 `/api/posts/{postId}/assets`
- **AND** postId 在数据库中不存在
- **THEN** SHALL 返回状态码 404
- **AND** 错误消息为 "Post not found"

#### Scenario: 获取单个博客资产
- **WHEN** 发送 GET 请求到 `/api/posts/{postId}/assets/{fileId}`
- **AND** 资产存在
- **THEN** SHALL 从 `file_resources` 获取扩展名和 MIME 类型
- **AND** 返回文件二进制数据
- **AND** Content-Type header 根据数据库中的 mimeType 设置
- **AND** Content-Disposition header 包含原始文件名（从数据库获取）
- **AND** Cache-Control header 设置为 "public, max-age=31536000"

#### Scenario: 删除博客资产
- **WHEN** 发送 DELETE 请求到 `/api/posts/{postId}/assets/{fileId}`
- **AND** 资产存在
- **THEN** SHALL 删除 `post_asset_relations` 中的关联记录
- **AND** 检查 `file_resources` 是否还有其他关联
- **AND** 如无其他关联，删除物理文件和 `file_resources` 记录
- **AND** 返回状态码 200 及 `{ success: true, message: "Asset deleted successfully" }`

#### Scenario: 删除不存在的资产
- **WHEN** 发送 DELETE 请求到 `/api/posts/{postId}/assets/{fileId}`
- **AND** 资产不存在或不属于该博客
- **THEN** SHALL 返回状态码 404
- **AND** 错误消息为 "Asset not found"

### Requirement: 缩略图自动生成

系统 SHALL 在图片上传时支持自动生成缩略图，缩略图尺寸为 180x180，格式为 JPEG，质量为 80。

#### Scenario: 上传图片并生成缩略图
- **WHEN** 发送 POST 请求到 `/api/images/upload?generateThumbnail=true`
- **AND** 上传的文件为有效图片（JPG, PNG, WebP）
- **THEN** SHALL 保存原始图片到 `{storage_path}/images/{filename}`
- **AND** 生成 180x180 缩略图并保存到 `{storage_path}/thumbnails/{filename}`
- **AND** 在数据库中创建缩略图记录
- **AND** 返回响应包含 `{ filename: "...", url: "...", size: ... }`

#### Scenario: 上传图片但不生成缩略图
- **WHEN** 发送 POST 请求到 `/api/images/upload`（不带 generateThumbnail 参数或为 false）
- **THEN** SHALL 仅保存原始图片
- **AND** 不生成缩略图

#### Scenario: 缩略图生成失败不中断上传
- **WHEN** 上传图片时缩略图生成过程失败（如格式不支持）
- **THEN** SHALL 仍然保存原始图片
- **AND** 记录错误日志
- **AND** 返回成功响应但不包含缩略图信息

#### Scenario: 获取缩略图
- **WHEN** 发送 GET 请求到 `/api/images/{filename}/thumbnail` 或 `/api/thumbnails/{filename}`
- **AND** 缩略图存在
- **THEN** SHALL 返回缩略图二进制数据
- **AND** Content-Type 为 "image/jpeg"

#### Scenario: 获取不存在的缩略图
- **WHEN** 发送 GET 请求到 `/api/thumbnails/{filename}`
- **AND** 缩略图不存在
- **THEN** SHALL 返回状态码 404
- **AND** 错误消息为 "Thumbnail not found"

#### Scenario: 删除图片时同时删除缩略图
- **WHEN** 发送 DELETE 请求到 `/api/images/{filename}`
- **AND** 图片有对应的缩略图
- **THEN** SHALL 删除原始图片
- **AND** 删除对应的缩略图文件
- **AND** 删除数据库中的缩略图记录

### Requirement: 图片编辑任务管理

系统 SHALL 提供异步的图片编辑任务管理功能，支持任务的创建、状态查询、停止、重试和删除。

#### Scenario: 创建图片编辑任务
- **WHEN** 发送 POST 请求到 `/api/image-edit`
- **AND** 请求体包含 `{ orig_img: "image.jpg", prompt: "make it brighter" }`
- **THEN** SHALL 创建新任务，初始状态为 "processing"
- **AND** 启动异步处理 goroutine
- **AND** 返回状态码 200 及 `{ task_id: "xxx" }`

#### Scenario: 查询所有任务
- **WHEN** 发送 GET 请求到 `/api/image-edit`（不带 task_id 参数）
- **THEN** SHALL 返回所有任务的列表
- **AND** 每个任务包含 id, status, original_image, result_image, prompt, created_at, updated_at

#### Scenario: 查询单个任务状态
- **WHEN** 发送 GET 请求到 `/api/image-edit?task_id={taskId}`
- **AND** 任务存在
- **THEN** SHALL 返回任务详情
- **AND** status 为 "processing", "completed", 或 "failed"

#### Scenario: 任务处理完成
- **WHEN** 异步任务成功完成图片编辑
- **THEN** SHALL 更新任务状态为 "completed"
- **AND** 设置 result_image 字段为结果图片文件名
- **AND** 更新 updated_at 时间戳

#### Scenario: 任务处理失败
- **WHEN** 异步任务处理过程中发生错误
- **THEN** SHALL 更新任务状态为 "failed"
- **AND** 设置 message 字段为错误描述
- **AND** 更新 updated_at 时间戳

#### Scenario: 停止正在运行的任务
- **WHEN** 发送 PUT 请求到 `/api/image-edit?task_id={taskId}`
- **AND** 任务状态为 "processing"
- **THEN** SHALL 中止任务执行
- **AND** 更新状态为 "failed"
- **AND** 设置 message 为 "Task stopped by user"
- **AND** 返回 `{ message: "Task stopped" }`

#### Scenario: 重试失败的任务
- **WHEN** 发送 PATCH 请求到 `/api/image-edit?task_id={taskId}`
- **AND** 请求体可选包含 `{ prompt: "new prompt" }`
- **AND** 任务状态为 "failed"
- **THEN** SHALL 重置任务状态为 "processing"
- **AND** 如果提供了新 prompt，更新 prompt 字段
- **AND** 重新启动任务处理
- **AND** 返回 `{ message: "Task retried" }`

#### Scenario: 删除任务
- **WHEN** 发送 DELETE 请求到 `/api/image-edit?task_id={taskId}`
- **THEN** SHALL 停止任务（如果正在运行）
- **AND** 从存储中删除任务记录
- **AND** 返回 `{ message: "Task stopped" }`

#### Scenario: 任务自动过期清理
- **WHEN** 任务创建时间超过 24 小时
- **AND** 任务状态为 "completed" 或 "failed"
- **THEN** SHALL 自动从存储中删除任务记录

#### Scenario: 任务并发限制
- **WHEN** 尝试创建新任务
- **AND** 当前有 1 个任务正在处理
- **THEN** SHALL 将新任务加入队列或返回错误
- **AND** 错误消息为 "Maximum concurrent tasks reached"

### Requirement: 系统状态监控 API

系统 SHALL 提供系统状态监控 API，返回服务器的启动时间、运行时长、内存使用和磁盘使用情况。

#### Scenario: 查询系统状态（需要认证）
- **WHEN** 发送 GET 请求到 `/api/system/status`
- **AND** 请求包含有效的认证 token
- **THEN** SHALL 返回状态码 200
- **AND** 响应包含 boot_time, boot_time_formatted, uptime_seconds 字段
- **AND** 响应包含 memory.system（total, used, free, usage_percent, 格式化字符串）
- **AND** 响应包含 memory.process（rss, heap_total, heap_used, 格式化字符串）
- **AND** 响应包含 disk 对象（各挂载点的使用百分比）

#### Scenario: 未认证访问系统状态
- **WHEN** 发送 GET 请求到 `/api/system/status`
- **AND** 请求不包含认证 token 或 token 无效
- **THEN** SHALL 返回状态码 401
- **AND** 错误消息为 "Unauthorized"

#### Scenario: 格式化内存大小
- **WHEN** 系统返回内存信息
- **THEN** 原始字节数 SHALL 转换为可读格式（如 "16.00 GB", "512.00 MB"）
- **AND** 百分比 SHALL 格式化为两位小数（如 "50.25%"）

#### Scenario: 获取进程内存信息
- **WHEN** 查询系统状态
- **THEN** memory.process SHALL 包含当前 Go 进程的内存使用
- **AND** rss 表示驻留集大小（实际物理内存使用）
- **AND** heap_total 和 heap_used 表示堆内存信息

### Requirement: 数据模型和数据库 Schema

系统 SHALL 在数据库中维护文件资源、博客-资产关联和图片编辑任务的持久化记录。

#### Scenario: file_resources 表结构
- **WHEN** 执行数据库迁移
- **THEN** SHALL 创建 `file_resources` 表，包含以下字段：
  - id (VARCHAR PRIMARY KEY) - 文件ID（与物理文件名一致，不含扩展名）
  - original_name (VARCHAR NOT NULL) - 原始文件名（含扩展名）
  - extension (VARCHAR NOT NULL) - 文件扩展名（含点，如 ".jpg"）
  - mime_type (VARCHAR NOT NULL) - MIME类型
  - size (BIGINT NOT NULL) - 文件大小（字节）
  - category (VARCHAR, INDEX) - 文件分类：image/thumbnail/asset/edit-result
  - storage_path (VARCHAR NOT NULL) - 存储路径
  - created_at (TIMESTAMP, INDEX)
  - updated_at (TIMESTAMP)

#### Scenario: post_asset_relations 表结构
- **WHEN** 执行数据库迁移
- **THEN** SHALL 创建 `post_asset_relations` 表，包含以下字段：
  - id (PRIMARY KEY, AUTO_INCREMENT)
  - post_id (VARCHAR, INDEX, NOT NULL) - 博客ID
  - file_id (VARCHAR, INDEX, NOT NULL) - 文件资源ID（外键 -> file_resources.id）
  - relation_type (VARCHAR DEFAULT 'attachment') - 关联类型：attachment/inline-image/cover
  - display_order (INT DEFAULT 0) - 显示顺序
  - created_at (TIMESTAMP)

#### Scenario: images 表添加缩略图字段
- **WHEN** 执行数据库迁移
- **THEN** SHALL 在 `images` 表添加字段：
  - thumbnail_id (VARCHAR, NULLABLE) - 缩略图文件ID（外键 -> file_resources.id）

#### Scenario: image_edit_tasks 表结构
- **WHEN** 执行数据库迁移
- **THEN** SHALL 创建 `image_edit_tasks` 表，包含以下字段：
  - id (VARCHAR, PRIMARY KEY)
  - status (VARCHAR, INDEX)
  - original_image (VARCHAR) - 原图文件ID
  - result_image (VARCHAR, NULLABLE) - 结果图文件ID
  - prompt (TEXT)
  - message (TEXT, NULLABLE)
  - created_at (BIGINT, INDEX)
  - updated_at (BIGINT)

### Requirement: 错误处理和安全性

系统 SHALL 对所有文件操作进行安全验证，防止路径遍历攻击和非法文件访问。

#### Scenario: 防止路径遍历攻击
- **WHEN** 文件名包含 ".." 或 "/"
- **THEN** SHALL 返回状态码 400
- **AND** 错误消息为 "Invalid filename"

#### Scenario: 文件类型验证
- **WHEN** 上传文件到图片 API
- **AND** 文件扩展名不在允许列表中（.jpg, .jpeg, .png, .gif, .webp）
- **THEN** SHALL 返回状态码 400
- **AND** 错误消息为 "Invalid file type"

#### Scenario: 文件大小限制
- **WHEN** 上传文件大小超过配置的最大值（如 10MB）
- **THEN** SHALL 返回状态码 400
- **AND** 错误消息为 "File size exceeds limit"

#### Scenario: 资产访问权限控制
- **WHEN** 尝试访问不属于指定 postId 的资产
- **THEN** SHALL 返回状态码 403
- **AND** 错误消息为 "Forbidden: Asset does not belong to this post"

