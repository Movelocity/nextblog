# Change: 为 Go 后端添加缺失的资产管理和文件存储 API

## Why

当前 Go 后端仅实现了基础的图片上传、获取、删除功能，但前端服务层标注了多个未实现的接口功能：

1. **按博客分组的资产管理 API**：`app/services/assets.ts` 中 `listAssets` 功能标注为未实现
2. **缩略图生成和管理**：`app/services/image.ts` 和 `app/services/assets.ts` 中多处标注缩略图功能未实现
3. **图片编辑 API**：`app/services/image.ts` 中整个 `imageEditService` 模块标注为未实现
4. **系统状态 API**：`app/services/system.ts` 中 `getSystemStatus` 标注为未实现

Next.js API 路由（`app/api/*`）中已有完整实现，但 Go 后端缺失这些功能导致前端无法正常使用。需要在 Go 后端实现这些接口，确保前后端功能对齐。

此外，需要设计统一的文件资源存储接口，避免重复代码，提升可维护性。

## What Changes

### 1. 博客资产管理 API
- 实现按 blogId 分组的资产列表查询 `GET /api/posts/:postId/assets`
- 实现按 blogId 上传资产 `POST /api/posts/:postId/assets`
- 实现按 blogId 删除资产 `DELETE /api/posts/:postId/assets/:filename`
- 实现获取单个资产 `GET /api/posts/:postId/assets/:filename`

### 2. 缩略图管理
- 在图片上传时支持自动生成缩略图（可选参数 `generateThumbnail`）
- 实现缩略图获取 API `GET /api/images/:filename/thumbnail` 或 `GET /api/thumbnails/:filename`
- 在图片删除时自动删除对应缩略图
- 使用 Go 图像处理库（如 `imaging` 或 `bimg`）

### 3. 图片编辑 API
- 实现图片编辑任务管理：
  - `GET /api/image-edit` - 获取所有任务列表
  - `GET /api/image-edit/:taskId` - 获取任务状态
  - `POST /api/image-edit` - 创建新编辑任务
  - `PUT /api/image-edit/:taskId` - 停止任务
  - `PATCH /api/image-edit/:taskId` - 重试任务
  - `DELETE /api/image-edit/:taskId` - 删除任务
- 任务状态管理：processing, completed, failed
- 异步任务处理机制

### 4. 系统状态 API
- 实现系统状态查询 `GET /api/system/status`
- 返回信息包括：
  - 系统启动时间和运行时长
  - 内存使用情况（系统和进程）
  - 磁盘使用情况
  - 格式化的可读字符串

### 5. 统一文件存储接口（设计模式）
- **文件ID化存储**：文件存储时使用独立ID作为文件名（无扩展名）
  - 原始文件名、扩展名、MIME类型存储在数据库 `file_resources` 表
  - 示例：物理文件 `1638123456789-abc`，数据库记录扩展名 `.jpg`
- **博客-资产关联表**：新增 `post_asset_relations` 表管理博客与文件的关联
  - 支持一对多关系（一个博客可有多个资产）
  - 支持关联类型：attachment、inline-image、cover
- **数据迁移**：后端启动时自动检查并迁移旧数据
  - 扫描存储目录中带扩展名的旧文件（如 `image.jpg`）
  - 自动重命名为纯ID文件（如 `1638123456789-abc`）
  - 在数据库中创建对应记录并建立关联关系
- 抽象 `FileStorage` 接口，支持：
  - `Save(category, data) -> fileID` - 保存文件，返回ID
  - `Get(fileID)` - 根据ID获取文件
  - `Delete(fileID)` - 根据ID删除文件
  - `List(category, filters)` - 列出分类下的文件ID
- 实现 `LocalFileStorage` 本地文件系统存储
- 预留扩展点支持未来对象存储（OSS、S3）
- 文件分类管理：`images`、`thumbnails`、`blog-assets`、`image-edit-results`

## Impact

- **Affected specs**: 新增 `file-storage` capability
- **Affected code**:
  - **Go Backend**:
    - 新增 `server/internal/api/asset_handler.go` - 博客资产 API
    - 修改 `server/internal/api/image_handler.go` - 添加缩略图支持
    - 新增 `server/internal/api/image_edit_handler.go` - 图片编辑 API
    - 新增 `server/internal/api/system_handler.go` - 系统状态 API
    - 新增 `server/internal/storage/storage.go` - 统一文件存储接口
    - 新增 `server/internal/storage/local.go` - 本地存储实现
    - 新增 `server/internal/models/asset.go` - 资产数据模型
    - 新增 `server/internal/models/image_edit_task.go` - 图片编辑任务模型
    - 修改 `server/internal/api/routes.go` - 注册新路由
    - 修改数据库 schema - 添加 assets 和 image_edit_tasks 表
  - **Frontend**:
    - 修改 `app/services/assets.ts` - 移除"未实现"注释，对接真实 API
    - 修改 `app/services/image.ts` - 启用图片编辑和缩略图功能
    - 修改 `app/services/system.ts` - 启用系统状态查询

- **Breaking Changes**: 无（向后兼容，新增功能）

- **数据库迁移**: 
  - 新增 `file_resources` 表（id, original_name, extension, mime_type, size, category, storage_path, created_at, updated_at）
  - 新增 `post_asset_relations` 表（id, post_id, file_id, relation_type, display_order, created_at）
  - 新增 `image_edit_tasks` 表（id, status, original_image, result_image, prompt, message, created_at, updated_at）
  - 修改 `images` 表：添加 thumbnail_id 外键指向缩略图文件资源

