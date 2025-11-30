# Image表迁移到FileResource表

## 概述

本次迁移将原来单独的 `images` 表合并到 `file_resources` 表中，实现统一的文件管理。

## 更改内容

### 1. 数据模型更改

#### `/server/internal/models/models.go`
- `Image` 模型已标记为废弃，仅用于数据迁移兼容
- 添加了废弃注释，提示使用 `FileResource` 替代

#### `/server/internal/models/file_resource.go`
- 在 `FileResource` 模型中添加了 `ThumbnailID` 字段
- 用于关联缩略图文件资源

### 2. 数据库初始化更改

#### `/server/internal/db/db.go`
- 移除了 `models.Image` 的 AutoMigrate
- 仅保留 `models.FileResource` 的 AutoMigrate

### 3. API Handler 更改

#### `/server/internal/api/image_handler.go`
- **UploadImage**: 改用 `FileResource` 保存图片元数据
- **GetThumbnail**: 改用 `FileResource` 查询缩略图
- **DeleteImage**: 改用 `FileResource` 删除图片记录
- **ListImages**: 改用 `FileResource` 查询图片列表，并转换为兼容的响应格式

### 4. 迁移命令更改

#### `/server/cmd/migrate/main.go`

**新增函数:**
- `migrateImagesToFileResources()`: 将旧的 `images` 表数据迁移到 `file_resources` 表
  - 检查 `images` 表是否存在
  - 读取所有旧图片记录
  - 转换并保存到 `file_resources` 表
  - **检查 post_asset_relations 引用关系，保持文件ID一致性**
  - **验证迁移后的关联完整性**
  - 迁移完成后删除旧的 `images` 表

- `validatePostAssetRelations()`: 验证 post_asset_relations 表的完整性
  - 检查所有引用的文件资源是否存在
  - 报告缺失的文件资源引用
  - 统计验证结果

- `getExtensionFromMimeType()`: 根据MIME类型获取文件扩展名

**更新函数:**
- `initDatabase()`: 将 `models.Image` 改为 `models.FileResource`
- `copyImages()`: 改用 `FileResource` 保存图片记录
- `main()`: 在数据迁移流程中添加 `migrateImagesToFileResources()` 调用

## 迁移流程

执行 migrate 命令时，会自动完成以下步骤：

1. 初始化数据库，创建新的 `file_resources` 表结构
2. 迁移站点配置
3. 迁移博客文章
4. 迁移笔记
5. 迁移分类和标签统计
6. **迁移旧的 `images` 表数据到 `file_resources` 表**（新增）
   - 检查并保持与 post_asset_relations 的引用一致性
   - 验证迁移后的关联完整性
7. 复制图片文件并记录到 `file_resources` 表

## post_asset_relations 关联处理

### 关联关系说明

`post_asset_relations` 表用于管理博客文章与文件资源的关联关系：
- `post_id`: 博客文章ID
- `file_id`: 文件资源ID（外键 → file_resources.id）
- `relation_type`: 关联类型（attachment/inline-image/cover）

### 迁移时的特殊处理

1. **文件ID一致性**: 迁移 images 时会检查是否有 post_asset_relations 引用
2. **关联验证**: 迁移完成后自动验证所有引用的文件资源是否存在
3. **日志记录**: 详细记录每个有关联的图片及其引用数量
4. **错误提示**: 如果发现缺失的文件资源引用，会在日志中警告

### 验证输出示例

```
Validating 15 post asset relations...
Image photo.jpg has 2 post asset relations, preserving file ID: photo
Post asset relations validation: 15 valid, 0 missing
```

## 数据映射

### Image -> FileResource 字段映射

| Image 字段 | FileResource 字段 | 说明 |
|-----------|------------------|------|
| ID | ID | 转换为字符串格式 |
| Filename | OriginalName | 原始文件名 |
| - | Extension | 从文件名提取扩展名 |
| MimeType | MimeType | MIME类型 |
| Size | Size | 文件大小 |
| - | Category | 固定为 "image" |
| Path | StoragePath | 存储路径 |
| ThumbnailID | ThumbnailID | 缩略图ID |
| CreatedAt | CreatedAt | 创建时间 |
| CreatedAt | UpdatedAt | 更新时间 |

## 使用方法

### 运行迁移

```bash
cd server
make migrate
```

或者使用自定义参数：

```bash
./bin/migrate -source=../blogs -db=./data/nextblog.db -storage=./storage
```

### 参数说明

- `-source`: 源数据目录（默认: ../blogs）
- `-db`: 数据库文件路径（默认: ./data/nextblog.db）
- `-storage`: 存储目录路径（默认: ./storage）

## 兼容性

### API 兼容性

为保持前端兼容，`ListImages` API 返回格式已调整，包含：
- `id`: 文件ID
- `filename`: 完整文件名（ID + 扩展名）
- `originalName`: 原始文件名
- `size`: 文件大小
- `mimeType`: MIME类型
- `createdAt`: 创建时间
- `url`: 访问URL
- `thumbnailId`: 缩略图ID（如果存在）
- `thumbnailUrl`: 缩略图URL（如果存在）

### 数据库兼容性

- 旧的 `images` 表会在迁移成功后自动删除
- 如果迁移失败，旧表会保留，可以手动重试
- 支持重复运行迁移命令（会跳过已存在的记录）

## 注意事项

1. **备份数据**: 运行迁移前建议备份数据库文件
2. **一次性操作**: `images` 表删除后无法恢复，确保迁移成功后再删除备份
3. **重复运行**: 支持重复运行迁移命令，已存在的记录会被跳过
4. **文件ID变化**: 新上传的图片ID格式会改变（时间戳格式），但不影响功能
5. **关联完整性**: 迁移过程会自动验证 post_asset_relations 的引用完整性
6. **ID保持一致**: 如果图片被 post_asset_relations 引用，会保持原有的文件ID

## 回滚方案

如果需要回滚到旧版本：

1. 恢复数据库备份
2. 切换到使用 `Image` 模型的旧代码版本
3. 重新部署应用

## 测试清单

- [ ] 上传新图片
- [ ] 上传带缩略图的图片
- [ ] 查看图片列表
- [ ] 获取单张图片
- [ ] 获取缩略图
- [ ] 删除图片
- [ ] 运行完整迁移命令
- [ ] 验证旧数据迁移正确

## 相关文件

- `/server/internal/models/models.go`
- `/server/internal/models/file_resource.go`
- `/server/internal/db/db.go`
- `/server/internal/api/image_handler.go`
- `/server/cmd/migrate/main.go`

