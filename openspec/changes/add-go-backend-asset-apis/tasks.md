# 实施任务清单

## 1. 准备工作
- [ ] 1.1 安装 Go 图像处理库 `imaging` (`go get github.com/disintegration/imaging`)
- [ ] 1.2 安装系统信息库 `gopsutil` (`go get github.com/shirou/gopsutil/v3`)
- [ ] 1.3 创建数据库迁移文件结构

## 2. 统一文件存储接口和数据模型
- [ ] 2.1 创建 `server/internal/models/file_resource.go` 文件资源数据模型
  - 字段：id, original_name, extension, mime_type, size, category, storage_path, created_at, updated_at
- [ ] 2.2 创建 `server/internal/models/post_asset_relation.go` 博客-资产关联模型
  - 字段：id, post_id, file_id, relation_type, display_order, created_at
- [ ] 2.3 创建数据库迁移：`file_resources` 表和 `post_asset_relations` 表
- [ ] 2.4 创建 `server/internal/storage/storage.go` 定义 `FileStorage` 接口
  - `Save(category string, data []byte) (fileID string, error)`
  - `Get(fileID string) ([]byte, error)`
  - `Delete(fileID string) error`
  - `List(category string) ([]string, error)`
  - `Exists(fileID string) (bool, error)`
- [ ] 2.5 实现 `server/internal/storage/local.go` 本地文件存储（文件名为纯ID，无扩展名）
- [ ] 2.6 创建 `server/internal/repository/file_resource_repository.go` 文件资源数据访问层
  - `CreateFileResource(resource *FileResource) error`
  - `GetFileResource(fileID string) (*FileResource, error)`
  - `DeleteFileResource(fileID string) error`
  - `ListFileResources(category string, filters map[string]interface{}) ([]*FileResource, error)`
- [ ] 2.7 创建 `server/internal/repository/post_asset_repository.go` 博客-资产关联数据访问层
  - `CreateRelation(relation *PostAssetRelation) error`
  - `GetRelationsByPostID(postID string) ([]*PostAssetRelation, error)`
  - `DeleteRelation(postID, fileID string) error`
- [ ] 2.8 编写单元测试
- [ ] 2.9 在 `config` 中添加存储配置项（基础路径、分类目录）

## 3. 数据迁移功能
- [ ] 3.1 创建 `server/internal/migration/file_migration.go` 数据迁移服务
- [ ] 3.2 实现旧文件扫描逻辑：
  - 扫描 `storage/images/` 中带扩展名的文件
  - 扫描 `storage/blog-assets/{postId}/` 中的旧格式文件
- [ ] 3.3 实现文件重命名逻辑：
  - 提取扩展名（如 `.jpg`）
  - 生成新ID（如 `timestamp-random`）
  - 重命名文件为纯ID（无扩展名）
- [ ] 3.4 实现数据库记录创建：
  - 在 `file_resources` 表中创建记录（保存扩展名和元数据）
  - 在 `post_asset_relations` 表中创建关联关系（如果是博客资产）
- [ ] 3.5 实现幂等性检查：
  - 检查文件是否已迁移（通过数据库查询）
  - 避免重复迁移
- [ ] 3.6 在服务启动时调用迁移检查（`main.go` 或初始化函数）
- [ ] 3.7 编写迁移功能的单元测试和集成测试
- [ ] 3.8 添加迁移日志和错误处理

## 4. 博客资产管理 API
- [ ] 4.1 创建数据库迁移：确保 `file_resources` 和 `post_asset_relations` 表已创建
- [ ] 4.2 创建 `server/internal/api/asset_handler.go` 实现以下接口：
  - `GET /api/posts/:postId/assets` - 列出博客资产（通过关联表查询）
  - `POST /api/posts/:postId/assets` - 上传博客资产
    - 保存文件到存储（使用 FileStorage.Save，返回fileID）
    - 在 file_resources 表创建记录（保存扩展名等元数据）
    - 在 post_asset_relations 表创建关联
  - `GET /api/posts/:postId/assets/:fileId` - 获取单个资产（根据ID获取，返回时添加扩展名）
  - `DELETE /api/posts/:postId/assets/:fileId` - 删除资产
    - 删除关联关系
    - 检查文件是否还有其他关联，如无则删除文件和记录
- [ ] 4.3 在 `routes.go` 中注册资产路由
- [ ] 4.4 编写 Handler 单元测试

## 5. 缩略图生成和管理
- [ ] 5.1 修改 `images` 表添加 thumbnail_id 字段（外键指向 file_resources）
- [ ] 5.2 创建 `server/internal/service/thumbnail_service.go` 缩略图服务
  - `GenerateThumbnail(originalData []byte) (thumbnailData []byte, error)`
  - `CreateThumbnailForImage(imageID string) (thumbnailID string, error)`
- [ ] 5.3 修改 `image_handler.go` 的 `UploadImage` 方法：
  - 保存原图到 FileStorage（返回 imageID）
  - 在 file_resources 表创建原图记录
  - 如果 generateThumbnail=true：
    - 生成缩略图数据
    - 保存缩略图到 FileStorage（返回 thumbnailID）
    - 在 file_resources 表创建缩略图记录
    - 更新 images 表的 thumbnail_id 字段
- [ ] 5.4 新增 `GET /api/images/:fileId/thumbnail` 获取缩略图
  - 根据 imageID 查询 images 表获取 thumbnail_id
  - 根据 thumbnail_id 从 FileStorage 获取缩略图数据
  - 从 file_resources 获取扩展名，设置正确的 Content-Type
- [ ] 5.5 修改 `DeleteImage` 方法：
  - 查询并删除关联的缩略图文件和记录
  - 删除原图文件和记录
- [ ] 5.6 编写缩略图生成单元测试

## 6. 图片编辑任务管理 API
- [ ] 5.1 创建 `server/internal/models/image_edit_task.go` 任务数据模型
- [ ] 5.2 创建数据库迁移：`image_edit_tasks` 表
  - 字段：id, status, original_image, result_image, prompt, message, created_at, updated_at
  - 索引：status, created_at
- [ ] 5.3 创建 `server/internal/service/image_edit_service.go` 任务管理服务
  - `CreateTask(task *ImageEditTask) error`
  - `GetTask(taskID string) (*ImageEditTask, error)`
  - `GetAllTasks() ([]*ImageEditTask, error)`
  - `UpdateTaskStatus(taskID, status, message string) error`
  - `DeleteTask(taskID string) error`
  - `StartTaskProcessing(taskID string)` - 启动异步处理 goroutine
  - `StopTask(taskID string) error`
  - `RetryTask(taskID string, newPrompt *string) error`
- [ ] 5.4 创建 `server/internal/api/image_edit_handler.go` 实现以下接口：
  - `GET /api/image-edit` - 获取所有任务（可选 `task_id` 参数获取单个）
  - `POST /api/image-edit` - 创建新任务
  - `PUT /api/image-edit?task_id=xxx` - 停止任务
  - `PATCH /api/image-edit?task_id=xxx` - 重试任务
  - `DELETE /api/image-edit?task_id=xxx` - 删除任务
- [ ] 5.5 实现任务持久化机制（JSON 文件存储）
- [ ] 5.6 实现任务自动清理机制（24 小时过期）
- [ ] 5.7 在 `routes.go` 中注册图片编辑路由
- [ ] 5.8 编写 Handler 和 Service 单元测试
- [ ] 5.9 **注意**：图片编辑的具体实现（AI 处理）暂不实现，返回 mock 数据或预留扩展点

## 7. 系统状态 API
- [ ] 6.1 创建 `server/internal/api/system_handler.go` 实现 `GetSystemStatus`
- [ ] 6.2 使用 `runtime` 获取进程内存信息
- [ ] 6.3 使用 `gopsutil` 获取系统内存和磁盘信息
- [ ] 6.4 实现启动时间记录和运行时长计算
- [ ] 6.5 实现数据格式化（字节转可读字符串）
- [ ] 6.6 在 `routes.go` 中注册系统状态路由 `GET /api/system/status`
- [ ] 6.7 添加认证中间件保护系统状态 API
- [ ] 6.8 编写单元测试

## 8. 前端服务层更新
- [ ] 7.1 修改 `app/services/assets.ts`：
  - 移除 `listAssets` 的"未实现"注释和 console.warn
  - 实现真实 API 调用 `GET /api/posts/:postId/assets`
  - 更新 `uploadAsset` 和 `deleteAsset` 调用新的嵌套路由
- [ ] 7.2 修改 `app/services/image.ts`：
  - 移除 `imageEditService` 所有方法的"未实现"注释
  - 实现真实 API 调用
  - 启用 `getThumbnailUrl` 和 `downloadThumbnail` 功能
- [ ] 7.3 修改 `app/services/system.ts`：
  - 移除 `getSystemStatus` 的"未实现"注释
  - 实现真实 API 调用 `GET /api/system/status`

## 9. 集成测试
- [ ] 8.1 测试博客资产上传、列表、获取、删除流程
- [ ] 8.2 测试缩略图生成和获取
- [ ] 8.3 测试图片编辑任务创建、状态查询、停止、重试、删除
- [ ] 9.4 测试数据迁移功能（模拟旧文件结构，验证自动迁移）
- [ ] 9.5 测试系统状态 API 返回数据正确性
- [ ] 9.6 测试前端服务层与 Go 后端集成
- [ ] 9.7 测试错误场景（文件不存在、权限问题、大文件上传）

## 10. 文档和部署
- [ ] 9.1 更新 API 文档（如有）
- [ ] 9.2 更新 README.md 说明新增功能
- [ ] 9.3 更新环境变量配置说明
- [ ] 10.4 编写数据迁移说明文档（包含回滚策略）
- [ ] 9.5 更新 Docker 配置（如需要）
- [ ] 9.6 发布版本并部署

## 11. 清理和优化
- [ ] 10.1 清理前端代码中的临时注释和 console.warn
- [ ] 10.2 优化文件存储路径结构（如需要）
- [ ] 10.3 添加日志记录和错误监控
- [ ] 10.4 性能测试和优化（图片上传、缩略图生成）
- [ ] 10.5 代码审查和重构

