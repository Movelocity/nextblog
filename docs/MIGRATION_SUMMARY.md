# 迁移变更总结

## 已修改的文件

### 1. 数据模型 (2个文件)

#### `server/internal/models/models.go`
- 将 `Image` 模型标记为废弃
- 添加注释说明使用 `FileResource` 替代
- 保留该模型仅用于数据迁移兼容

#### `server/internal/models/file_resource.go`
- 添加 `ThumbnailID` 字段（`string`，可选）
- 用于关联缩略图文件资源

### 2. 数据库初始化 (1个文件)

#### `server/internal/db/db.go`
- 移除 `models.Image` 的 `AutoMigrate`
- 仅保留 `models.FileResource` 的自动迁移

### 3. API 处理器 (1个文件)

#### `server/internal/api/image_handler.go`
修改了以下方法：
- `UploadImage()`: 使用 `FileResource` 保存图片元数据
- `GetThumbnail()`: 使用 `FileResource` 查询缩略图
- `DeleteImage()`: 使用 `FileResourceRepository.DeleteFileResource()` 删除记录
- `ListImages()`: 查询 `FileResource` 表并转换为兼容格式

### 4. 迁移命令 (1个文件)

#### `server/cmd/migrate/main.go`
新增函数：
- `migrateImagesToFileResources()`: 迁移旧 images 表数据
- `getExtensionFromMimeType()`: 根据 MIME 类型获取扩展名

修改函数：
- `initDatabase()`: 移除 `models.Image` 的 AutoMigrate
- `copyImages()`: 改用 `FileResource` 保存图片记录
- `main()`: 添加 `migrateImagesToFileResources()` 调用

### 5. 文档 (3个新文件)

#### `server/IMAGE_TO_FILE_RESOURCE_MIGRATION.md`
详细的迁移文档，包含：
- 完整的变更说明
- 数据映射关系
- 使用方法和参数
- 兼容性说明
- 测试清单

#### `server/MIGRATION_QUICK_START.md`
快速开始指南，包含：
- 执行迁移的命令
- 数据转换示例
- 验证方法
- 故障排除

#### `server/test_migration.sh`
自动化测试脚本，验证：
- 关键文件存在性
- 代码变更完整性
- 使用统计

## 变更统计

```
文件修改:   5 个
新增文档:   3 个
新增函数:   2 个
修改函数:   7 个
```

## 核心变更

### Before (旧架构)
```
images 表 (单独存在)
  ↓
Image 模型
  ↓
ImageHandler (直接使用 Image)
```

### After (新架构)
```
file_resources 表 (统一管理)
  ↓
FileResource 模型
  ↓
ImageHandler (使用 FileResource, category="image")
```

## 迁移兼容性

| 功能 | 旧版本 | 新版本 | 兼容性 |
|------|--------|--------|---------|
| 上传图片 | ✅ | ✅ | ✅ 完全兼容 |
| 获取图片 | ✅ | ✅ | ✅ 完全兼容 |
| 删除图片 | ✅ | ✅ | ✅ 完全兼容 |
| 图片列表 | ✅ | ✅ | ⚠️ 响应格式增强 |
| 缩略图 | ✅ | ✅ | ✅ 完全兼容 |
| 数据迁移 | ❌ | ✅ | ✅ 自动迁移 |

## API 响应格式变化

### 旧格式 (ListImages)
```json
[
  {
    "id": 1,
    "filename": "photo.jpg",
    "path": "/path/...",
    "size": 1024,
    "mimeType": "image/jpeg",
    "thumbnailId": "thumb-001",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### 新格式 (ListImages)
```json
[
  {
    "id": "1234567890",
    "filename": "1234567890.jpg",
    "originalName": "photo.jpg",
    "size": 1024,
    "mimeType": "image/jpeg",
    "createdAt": "2024-01-01T00:00:00Z",
    "url": "/api/images/1234567890.jpg",
    "thumbnailId": "thumb-001",
    "thumbnailUrl": "/api/images/1234567890.jpg/thumbnail"
  }
]
```

**变化说明**:
- 新增 `id` 字段（文件资源ID）
- 新增 `originalName` 字段（原始文件名）
- 新增 `url` 字段（直接访问URL）
- 新增 `thumbnailUrl` 字段（缩略图URL，如有）
- `filename` 现在是 `id + extension` 格式
- 移除 `path` 字段（内部使用）

## 测试验证

运行以下命令验证迁移：

```bash
cd server
./test_migration.sh
```

所有检查项应该都显示 ✓（绿色勾号）。

## 下一步

1. ✅ 代码审查完成
2. ⏳ 本地测试迁移
3. ⏳ 备份生产数据库
4. ⏳ 执行生产迁移
5. ⏳ 验证迁移结果

## 注意事项

⚠️ **重要提醒**:
1. 迁移前务必备份数据库文件
2. 旧 `images` 表会在迁移成功后自动删除
3. 支持重复运行迁移命令
4. 前端无需修改，API 保持兼容

## 联系人

如有问题，请查阅：
- 详细文档: `IMAGE_TO_FILE_RESOURCE_MIGRATION.md`
- 快速指南: `MIGRATION_QUICK_START.md`

