# post_asset_relations 关联说明

## 概述

`post_asset_relations` 表用于管理博客文章与文件资源的关联关系。在将 `images` 表合并到 `file_resources` 表的迁移过程中，需要特别注意这个表的完整性。

## 表结构

```go
type PostAssetRelation struct {
    ID           int64     // 主键
    PostID       string    // 博客ID
    FileID       string    // 文件资源ID（外键 → file_resources.id）
    RelationType string    // 关联类型：attachment/inline-image/cover
    DisplayOrder int       // 显示顺序
    CreatedAt    time.Time // 创建时间
}
```

## 关联类型

| 类型 | 说明 | 示例 |
|-----|------|------|
| `attachment` | 附件 | 下载文件、PDF等 |
| `inline-image` | 内嵌图片 | 博客正文中的图片 |
| `cover` | 封面图片 | 博客封面 |

## 迁移时的处理

### 1. 文件ID一致性

迁移 `images` 表时，会检查每个图片是否被 `post_asset_relations` 引用：

```go
// 检查是否有 post_asset_relations 引用了这个图片
var relationsCount int64
db.DB.Model(&models.PostAssetRelation{}).Where("file_id = ?", fileID).Count(&relationsCount)
if relationsCount > 0 {
    log.Printf("Image %s has %d post asset relations, preserving file ID: %s", 
        img.Filename, relationsCount, fileID)
}
```

**重点**: 如果图片被引用，迁移时会保持原有的文件ID，确保关联不断裂。

### 2. 关联验证

迁移完成后，会自动验证所有 `post_asset_relations` 的引用完整性：

```go
func validatePostAssetRelations() error {
    // 读取所有关联关系
    var relations []models.PostAssetRelation
    db.DB.Find(&relations)
    
    // 验证每个引用的文件资源是否存在
    for _, relation := range relations {
        var fileResource models.FileResource
        if db.DB.Where("id = ?", relation.FileID).First(&fileResource).Error != nil {
            // 缺失的文件资源
            log.Printf("Warning: Post %s references missing file: %s", 
                relation.PostID, relation.FileID)
        }
    }
}
```

### 3. 迁移日志示例

```
Running data migration...
...
Migrating images table data to file_resources...
Image photo-1234.jpg has 2 post asset relations, preserving file ID: photo-1234
Image banner.png has 1 post asset relations, preserving file ID: banner
Migrated 10 images to file_resources table (2 skipped)

Validating post asset relations...
Validating 15 post asset relations...
Post asset relations validation: 15 valid, 0 missing
✓ All post asset relations are valid

Dropped old images table
Data migration completed successfully!
```

## 使用场景

### 场景1: 博客内嵌图片

博客正文使用 Markdown 引用图片：

```markdown
![描述](https://example.com/api/posts/post-123/assets/photo-1234)
```

对应的关联记录：
```
PostID: post-123
FileID: photo-1234
RelationType: inline-image
```

### 场景2: 博客封面

博客元数据指定封面图片：

```json
{
  "coverId": "banner-001"
}
```

对应的关联记录：
```
PostID: post-123
FileID: banner-001
RelationType: cover
```

### 场景3: 附件下载

博客提供下载文件：

```markdown
[下载PDF](https://example.com/api/posts/post-123/assets/doc-001)
```

对应的关联记录：
```
PostID: post-123
FileID: doc-001
RelationType: attachment
```

## API 使用

### 列出博客的所有资产

```http
GET /api/posts/:id/assets
```

响应：
```json
[
  {
    "id": "photo-1234",
    "filename": "photo.jpg",
    "size": 102400,
    "mimeType": "image/jpeg",
    "url": "/api/posts/post-123/assets/photo-1234",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### 上传资产到博客

```http
POST /api/posts/:id/assets
Content-Type: multipart/form-data

file: [文件数据]
```

自动创建：
1. `file_resources` 记录
2. `post_asset_relations` 记录

### 获取单个资产

```http
GET /api/posts/:id/assets/:fileId
```

验证流程：
1. 检查 post-fileId 关联是否存在
2. 获取文件资源信息
3. 返回文件数据

## 数据完整性

### 外键约束

虽然 SQLite 的外键支持有限，但代码层面保证：

1. **删除文件时**: 检查是否有关联，有关联则拒绝删除
2. **删除博客时**: 级联删除所有关联关系
3. **创建关联时**: 验证文件资源和博客都存在

### 孤儿记录检查

定期运行迁移验证可以检测：
- 引用不存在的文件资源
- 引用不存在的博客

```bash
cd server
go run ./cmd/migrate/main.go -validate-only
```

## 迁移注意事项

### ✅ 自动处理
- 文件ID保持一致
- 关联关系自动验证
- 详细的日志记录

### ⚠️ 需要注意
- 确保博客文章已经迁移完成
- 检查日志中的警告信息
- 验证失败时手动修复

### ❌ 不会自动处理
- 数据库外的文件引用（如Markdown中的URL）
- 自定义的文件路径
- 第三方存储的文件

## 故障排除

### 问题1: 验证失败，发现缺失的文件资源

```
Warning: Post post-123 references missing file resource: photo-999
Post asset relations validation: 14 valid, 1 missing
```

**解决方案**:
1. 检查原始 `images` 表是否有 `photo-999` 记录
2. 如果有，手动创建对应的 `file_resources` 记录
3. 如果没有，删除这条 `post_asset_relations` 记录

### 问题2: 文件ID冲突

如果新旧文件ID格式冲突：

**解决方案**:
1. 迁移前备份数据库
2. 统一文件ID命名规则
3. 重新运行迁移

### 问题3: 关联关系丢失

如果迁移后博客无法显示图片：

**排查步骤**:
1. 检查 `post_asset_relations` 表是否有记录
2. 检查 `file_resources` 表是否有对应的文件
3. 检查文件物理路径是否正确
4. 运行验证命令检查完整性

## 最佳实践

1. **迁移前备份**: 备份数据库和文件存储
2. **测试环境验证**: 先在测试环境运行迁移
3. **查看日志**: 仔细检查迁移日志中的警告
4. **验证完整性**: 迁移后运行验证命令
5. **监控应用**: 迁移后监控应用是否正常运行

## 总结

`post_asset_relations` 表是连接博客文章和文件资源的桥梁。在迁移过程中：

- ✅ **自动检测和保持文件ID一致性**
- ✅ **自动验证关联完整性**
- ✅ **详细的日志记录**
- ✅ **支持重复运行**

只要遵循迁移指南，关联关系会被完整保留。

