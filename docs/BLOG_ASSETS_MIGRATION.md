# 博客资产迁移说明

## 概述

从 `blogs/` 目录迁移博客资产文件时，会自动创建 `file_resources` 记录和 `post_asset_relations` 关联关系。

## 数据源结构

```
blogs/
├── {postID}/                    # 博客ID（时间戳）
│   ├── index.md                 # 博客内容
│   ├── config.yaml              # 博客配置
│   └── assets/                  # 博客资产文件
│       ├── image1.jpg
│       ├── document.pdf
│       └── ...
```

## 文件ID命名规则

遵循 `@openspec/changes/add-go-backend-asset-apis/design.md` 规范：

**格式**: `{timestamp}-{suffix}-{randomid}`

- `{timestamp}`: Unix毫秒时间戳
- `{suffix}`: 文件扩展名（不含点），如 `jpg`, `png`, `pdf`
- `{randomid}`: 6位随机数（纳秒取模）

**示例**:
- `1638123456789-jpg-123456` - JPEG图片
- `1638123456790-pdf-654321` - PDF文档
- `1638123456791-file-789012` - 无扩展名文件

## 迁移流程

### 1. 迁移博客文章

```go
func migratePosts() error {
    for id, entry := range meta.Blogs {
        // 保存博客文章
        db.DB.Save(&post)
        
        // 迁移该博客的资产文件
        migratePostAssets(id)
    }
}
```

### 2. 迁移资产文件

```go
func migratePostAssets(postID string) error {
    // 1. 扫描 blogs/{postID}/assets/ 目录
    // 2. 对每个文件：
    //    - 生成新的文件ID（遵循命名规则）
    //    - 复制到 storage/blog-assets/{fileID}
    //    - 创建 file_resources 记录
    //    - 创建 post_asset_relations 关联
}
```

### 3. 文件映射关系

#### 原始文件
```
blogs/1737467244252/assets/image.jpg
```

#### 迁移后
```
storage/blog-assets/1638123456789-jpg-123456  (物理文件，无扩展名)
```

#### 数据库记录

**file_resources 表**:
```
ID:           1638123456789-jpg-123456
OriginalName: image.jpg
Extension:    .jpg
MimeType:     image/jpeg
Size:         102400
Category:     blog-asset
StoragePath:  storage/blog-assets/1638123456789-jpg-123456
```

**post_asset_relations 表**:
```
PostID:       1737467244252
FileID:       1638123456789-jpg-123456
RelationType: attachment
DisplayOrder: 0
```

## 关联类型

| 类型 | 说明 | 用途 |
|------|------|------|
| `attachment` | 附件 | 默认类型，所有资产文件 |
| `inline-image` | 内嵌图片 | Markdown中引用的图片 |
| `cover` | 封面 | 博客封面图 |

**当前迁移**: 所有文件统一使用 `attachment` 类型

## 重复处理

### 场景1: 文件资源已存在

如果相同原始文件名和类别的 `file_resources` 记录已存在：
- 跳过文件复制和资源创建
- 只创建 `post_asset_relations` 关联（如果不存在）
- 统计为已迁移

### 场景2: 关联关系已存在

如果 `post_asset_relations` 中已有该 post-file 的关联：
- 跳过关联创建
- 不报错，继续处理

### 场景3: 创建失败回滚

如果创建关联失败：
- 删除已创建的 `file_resources` 记录
- 删除已复制的物理文件
- 记录警告日志

## 日志输出示例

### 正常迁移
```
Migrated 10 posts
  Migrated 3 assets for post 1737467244252
  Migrated 5 assets for post 1737540661423
  Migrated 0 assets for post 1737599026156
```

### 重复文件
```
Warning: File resource already exists for blog_note.jpeg, creating relation only
  Migrated 2 assets for post 1737540661423
```

### 失败警告
```
Warning: Failed to copy asset image.jpg: permission denied
Warning: Failed to save file resource for doc.pdf: database error
  Migrated 1 assets for post 1737467244252
```

## 验证关联

迁移完成后会自动验证 `post_asset_relations` 的完整性：

```
Validating post asset relations...
Validating 25 post asset relations...
Post asset relations validation: 25 valid, 0 missing
```

如果发现缺失的文件资源：
```
Warning: Post 1737467244252 references missing file resource: xxx-jpg-yyy
Post asset relations validation: 24 valid, 1 missing
```

## 文件路径对应关系

### 输入路径
```
blogs/{postID}/assets/{originalName}
```

### 输出路径
```
storage/blog-assets/{fileID}
```

### 数据库记录
```
FileResource:
  ID: {fileID}
  OriginalName: {originalName}
  Category: blog-asset
  
PostAssetRelation:
  PostID: {postID}
  FileID: {fileID}
```

## 特殊情况处理

### 1. 无扩展名文件

原始文件: `README`
```
FileID:    1638123456789-file-123456
Extension: ""
Suffix:    "file"
```

### 2. 多点扩展名

原始文件: `archive.tar.gz`
```
FileID:    1638123456789-gz-123456
Extension: ".gz"
Suffix:    "gz"
```

### 3. 空 assets 目录

如果博客没有 `assets/` 目录或目录为空：
- 不报错
- 跳过资产迁移
- 正常处理下一个博客

### 4. MIME类型推断

根据文件扩展名自动推断 MIME类型：
```go
func getMimeType(filename string) string {
    ext := filepath.Ext(filename)
    switch ext {
    case ".jpg", ".jpeg":
        return "image/jpeg"
    case ".png":
        return "image/png"
    case ".pdf":
        return "application/pdf"
    // ...
    default:
        return "application/octet-stream"
    }
}
```

## 迁移优势

### ✅ 自动化
- 无需手动处理每个博客的资产
- 自动创建关联关系
- 自动生成符合规范的文件ID

### ✅ 可追溯
- 保留原始文件名
- 明确的博客-文件关联
- 完整的迁移日志

### ✅ 安全性
- 失败自动回滚
- 重复处理安全
- 验证关联完整性

### ✅ 兼容性
- 遵循新的文件命名规范
- 统一的文件资源管理
- 支持 API 访问

## API 访问

迁移后可通过 API 访问博客资产：

```http
GET /api/posts/{postID}/assets
GET /api/posts/{postID}/assets/{fileID}
DELETE /api/posts/{postID}/assets/{fileID}
```

## 使用方法

运行迁移命令即可自动处理：

```bash
cd server
make migrate
```

迁移过程会：
1. 迁移博客文章 → `posts` 表
2. 迁移每个博客的资产 → `file_resources` 表
3. 创建关联关系 → `post_asset_relations` 表
4. 验证关联完整性

## 故障排除

### 问题1: 资产文件未迁移

**症状**: 博客已迁移，但资产为0

**排查**:
```bash
ls blogs/{postID}/assets/  # 检查原始文件是否存在
```

**解决**: 确认 assets 目录存在且有文件

### 问题2: 关联验证失败

**症状**: 验证显示缺失的文件资源

**排查**:
```sql
SELECT * FROM post_asset_relations WHERE post_id = '{postID}';
SELECT * FROM file_resources WHERE id IN (...);
```

**解决**: 重新运行迁移或手动修复数据

### 问题3: 文件ID冲突

**症状**: 创建文件资源失败（主键冲突）

**原因**: 同一毫秒内生成多个相同后缀的文件ID

**解决**: 重新运行迁移（随机数不同会避免冲突）

## 总结

博客资产迁移功能：
- ✅ 自动从 `blogs/` 扫描资产文件
- ✅ 遵循新的文件ID命名规范
- ✅ 自动创建文件资源和关联关系
- ✅ 完整的错误处理和回滚
- ✅ 验证迁移完整性

一次运行，全自动完成博客和资产的迁移！🎉

