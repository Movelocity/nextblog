# 文件存储命名统一说明

## 概述

本文档说明了 Go 后端文件存储命名策略的统一工作。

## 背景

在之前的实现中，存在两种不同的文件命名策略：

1. **图片上传 API**（`image_handler.go`）使用带扩展名的文件名：`{timestamp}-{random}.jpg`
2. **博客资产 API**（`asset_handler.go`）使用无扩展名的文件名：`{timestamp}-{ext}-{random}`

这种不一致导致代码维护困难，且不利于未来扩展到对象存储。

## 统一后的命名规则

### 格式

所有文件统一使用 `{timestamp}-{ext}-{random}` 格式（无扩展名）

- `timestamp`: 毫秒级时间戳（`time.Now().UnixMilli()`）
- `ext`: 文件扩展名（不含点，如 `jpg`, `png`）
- `random`: 6 位随机数（`time.Now().Nanosecond()%1000000`）

### 示例

- 存储文件名：`1638123456789-jpg-123456`
- 数据库记录：
  ```json
  {
    "id": "1638123456789-jpg-123456",
    "original_name": "avatar.jpg",
    "extension": ".jpg",
    "mime_type": "image/jpeg"
  }
  ```

## 实施范围

### 修改的文件

1. **`server/internal/api/image_handler.go`**
   - `UploadImage()`: 文件命名逻辑修改为统一格式
   - `GetImage()`: 通过数据库查询文件资源，而非路径拼接
   - `GetThumbnail()`: 通过数据库查询缩略图
   - `DeleteImage()`: 通过数据库记录删除文件

2. **`server/cmd/migrate/main.go`**
   - `copyImages()`: 从 `blogs/images/` 迁移时使用新命名规则
   - `migratePostAssets()`: 已符合规范，无需修改

3. **`server/internal/api/asset_handler.go`**
   - 已符合规范，无需修改

4. **`server/internal/service/thumbnail_service.go`**
   - 已符合规范，无需修改

### 数据库模型

`FileResource` 模型设计已支持无扩展名存储，无需修改：

```go
type FileResource struct {
    ID           string    // 文件ID（与物理文件名一致，无扩展名）
    OriginalName string    // 原始文件名
    Extension    string    // 文件扩展名（含点，如 ".jpg"）
    MimeType     string    // MIME类型
    Category     string    // 文件分类：image/thumbnail/blog-asset
    StoragePath  string    // 存储路径
    // ...
}
```

## API 兼容性

### 前端影响

**无影响**。API 响应格式保持不变：

```json
{
  "id": "1638123456789-jpg-123456",
  "filename": "1638123456789-jpg-123456.jpg",
  "url": "/api/images/1638123456789-jpg-123456",
  "size": 102400
}
```

- URL 参数从 `filename` 变为 `fileID`，但前端通过响应中的 `url` 字段访问，无需感知
- 响应格式完全一致

## 迁移说明

### 从 blogs/ 迁移

文件命名统一已集成到现有的 `blogs/` → Go 后端迁移流程中：

1. **图片迁移**（`copyImages()`）
   - 从 `blogs/images/` 读取图片文件
   - 生成新文件 ID: `{timestamp}-{ext}-{random}`
   - 复制到 `storage/images/{fileID}`（无扩展名）
   - 创建 `file_resources` 记录

2. **博客资产迁移**（`migratePostAssets()`）
   - 从 `blogs/{postId}/assets/` 读取文件
   - 生成新文件 ID
   - 复制到 `storage/blog-assets/{fileID}`
   - 创建 `file_resources` 和 `post_asset_relations` 记录

### 幂等性保证

- 检查数据库中是否已存在对应的文件记录（通过原始文件名）
- 跳过已迁移的文件
- 支持重复执行迁移脚本

### 执行迁移

```bash
cd server
./bin/migrate -source=../blogs -db=./data/nextblog.db -storage=./storage
```

### 验证迁移

1. 检查 `storage/images/` 目录中的文件名格式（无扩展名）
2. 验证数据库 `file_resources` 表记录完整性
3. 测试 API 功能（图片上传、显示、删除）

## 技术细节

### 文件访问方式

**修改前**（直接路径拼接）：
```go
imagePath := filepath.Join(config.AppConfig.StoragePath, "images", filename)
c.File(imagePath)
```

**修改后**（通过数据库查询）：
```go
fileResource, err := h.fileResourceRepo.GetFileResource(fileID)
if err != nil {
    c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
    return
}
c.File(fileResource.StoragePath)
```

### 优势

1. **统一数据访问层**：避免硬编码路径
2. **支持未来扩展**：轻松切换到对象存储（只需修改 `StoragePath` 格式）
3. **提升安全性**：路径由数据库管理，避免路径遍历攻击
4. **便于维护**：所有文件操作通过统一接口

## 故障排查

### 文件未找到

**症状**：API 返回 404 错误

**排查步骤**：
1. 检查数据库 `file_resources` 表中是否有对应记录
   ```sql
   SELECT * FROM file_resources WHERE id = '{fileID}';
   ```
2. 检查物理文件是否存在
   ```bash
   ls -la storage/images/{fileID}
   ```
3. 验证文件名格式是否正确（无扩展名）

### 迁移失败

**症状**：迁移脚本报错

**排查步骤**：
1. 检查源目录是否存在：`blogs/images/`
2. 检查目标目录权限：`storage/images/`
3. 查看迁移日志，定位失败的文件
4. 清空数据库和 `storage/` 目录，重新执行迁移

### API 响应格式异常

**症状**：前端显示文件路径错误

**排查步骤**：
1. 检查 API 响应中的 `url` 字段格式
2. 验证 `fileID` 是否符合新命名规则
3. 检查前端服务层是否使用了硬编码路径

## 相关文档

- `openspec/changes/unify-backend-file-storage/design.md` - 技术设计文档
- `openspec/changes/unify-backend-file-storage/proposal.md` - 变更提案
- `server/MIGRATION_SUMMARY.md` - 数据迁移总结
- `openspec/changes/add-go-backend-asset-apis/design.md` - 原始设计决策

## 总结

通过统一文件命名策略，我们实现了：

- ✅ 代码一致性提升
- ✅ 维护成本降低
- ✅ 安全性增强
- ✅ 可扩展性改善
- ✅ 前端无感知变更
- ✅ 迁移流程幂等可重复执行

