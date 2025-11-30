# 变更: 统一后端文件存储策略

## Why

当前 Go 后端的文件存储存在两方面不一致问题：

### 1. 文件命名不一致

1. **图片上传 API**（`image_handler.go`）使用带扩展名的文件名：`{timestamp}-{random}.jpg`
2. **博客资产 API**（`asset_handler.go`）使用无扩展名的文件名：`{timestamp}-{ext}-{random}`（已符合设计文档）
3. 数据库模型（`FileResource`）设计为支持无扩展名存储，但实际文件系统操作不一致

### 2. 存储目录分散

当前文件按类型分散存储在不同目录：
- `storage/images/` - 图片文件
- `storage/blog-assets/` - 博客资产
- `storage/uploads/` - 上传文件
- `storage/thumbnails/` - 缩略图

这种分散存储导致：
- **维护成本高**：需要管理多个目录，备份/迁移时需要处理多个路径
- **代码复杂**：每个 handler 都需要指定不同的 category 参数
- **扩展困难**：切换到对象存储时需要处理多个目录前缀
- **资源浪费**：相同内容的文件可能在不同目录重复存储

根据 `openspec/changes/add-go-backend-asset-apis/design.md` Decision 1 的设计决策，需要：
1. 统一为 **无扩展名存储** 策略
2. **统一存储目录**，通过数据库 `category` 字段区分文件类型

## What Changes

### 阶段 1：文件命名统一（当前变更）

- 修改图片上传 API 的文件命名逻辑，从 `{timestamp}-{random}.ext` 改为 `{timestamp}-{ext}-{random}` （无扩展名）
- 修改缩略图生成逻辑，统一命名规则
- 更新文件查询和获取逻辑，确保通过 `FileResource` 数据库记录访问文件
- 更新数据库迁移脚本，自动重命名旧文件（去除扩展名）
- 确保所有文件操作通过 `FileStorage` 接口进行，而非直接操作文件系统路径

### 阶段 2：存储目录统一（当前变更）

- **持久化文件统一**：用户上传的原始文件存储在 `storage/files/` 目录下
- **派生文件独立**：可重新生成的缩略图存储在 `storage/thumbnails/` 目录下
- **通过数据库区分**：依赖 `FileResource.category` 字段区分业务类型（`image`/`blog-asset`/`upload`/`thumbnail`）
- **简化 Storage 接口**：category 参数简化为两个值（`files`/`thumbnails`）
- **保持 API 兼容**：API 响应格式不变，前端无感知

**存储结构**：
```
storage/
├── files/          # 持久化文件（用户上传的原始文件）
│   ├── {fileID1}   # 图片
│   ├── {fileID2}   # 博客资产
│   └── {fileID3}   # 其他上传文件
└── thumbnails/     # 派生文件（可重新生成的缩略图）
    ├── {thumbID1}
    └── {thumbID2}
```

**变更前**：
```go
storage.Save("images", fileID, data)        // 保存到 storage/images/
storage.Save("blog-assets", fileID, data)   // 保存到 storage/blog-assets/
storage.Save("thumbnails", thumbID, data)   // 保存到 storage/thumbnails/
```

**变更后**：
```go
storage.Save("files", fileID, data)         // 所有持久化文件 -> storage/files/
storage.Save("thumbnails", thumbID, data)   // 所有缩略图 -> storage/thumbnails/
// 业务类型通过数据库 FileResource.category 字段区分
```

**缩略图独立存储的优势**：
- ✅ **方便批量刷新**：需要更改尺寸时，直接删除 `thumbnails/` 目录重新生成
- ✅ **备份策略灵活**：备份时可跳过缩略图，节省空间和时间
- ✅ **磁盘管理清晰**：原始文件和派生文件分离
- ✅ **性能优化空间**：可对缩略图使用不同存储策略（CDN、过期策略等）

## Impact

### 受影响的规格
- `file-storage` - 文件存储和管理功能（需要新建规格）

### 受影响的代码
- `server/internal/storage/storage.go` - FileStorage 接口简化（移除 category 参数）
- `server/internal/storage/local.go` - 本地存储实现统一路径
- `server/internal/api/image_handler.go` - 图片上传和获取 API
- `server/internal/api/asset_handler.go` - 博客资产 API
- `server/internal/service/thumbnail_service.go` - 缩略图生成服务
- `server/cmd/migrate/main.go` - 数据库迁移脚本
- `server/internal/models/file_resource.go` - 确认数据库模型注释与实现一致

### 向后兼容性
- **注意**: 文件重命名和目录统一将集成到现有的 `blogs/` → Go 后端迁移流程中
- 无需单独的文件重命名迁移步骤（后续步骤目前无数据）
- 新上传的文件直接使用新命名规则和统一目录
- 现有 API 路径保持不变（`/api/images/`, `/api/posts/:id/assets/`）

### 数据库变更
- 无需修改表结构（`FileResource` 已支持无扩展名存储和 category 字段）
- 需要更新现有记录的 `storage_path` 字段：
  - 去除文件名中的扩展名
  - 统一路径为 `storage/files/{fileID}`

### API 变更
- API 响应格式不变（仍然通过 `original_name` 和 `extension` 字段提供完整文件名信息）
- 内部存储路径变更对前端透明（前端通过 API 访问文件，不直接操作文件路径）

### 优势

**维护成本降低**：
- 持久化文件集中在 `storage/files/`，派生文件独立在 `storage/thumbnails/`
- 备份时可灵活选择（跳过缩略图节省空间）
- 迁移到对象存储时只需配置两个 bucket/prefix

**代码简化**：
- Storage 接口 category 参数简化为两个值：`files`/`thumbnails`
- 减少硬编码的 category 字符串（从 4+ 个减少到 2 个）
- 统一的文件路径生成逻辑

**扩展性提升**：
- 新增文件类型只需添加数据库记录，无需创建新目录
- 便于实现文件去重（相同内容只存储一次）
- 支持未来的内容寻址存储（CAS）

**运维友好**：
- 缩略图可批量删除重新生成（调整尺寸、更换算法等）
- 原始文件和派生文件分离，磁盘管理清晰
- 可对缩略图设置不同的存储策略（过期、CDN等）

**一致性保证**：
- 所有文件使用相同的命名和存储规则
- 数据库成为唯一的元数据来源

