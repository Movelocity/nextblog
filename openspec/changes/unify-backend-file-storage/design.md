# 技术设计文档

## Context

当前 Go 后端的文件存储实现存在两方面不一致问题：

### 1. 命名策略不一致

**现状分析**：
1. `image_handler.go:64-65` 使用 `fileID + ext` 生成物理文件名（带扩展名）
2. `asset_handler.go:113` 使用 `{timestamp}-{ext}-{random}` 生成文件 ID（无扩展名）
3. `FileResource` 模型设计为分离存储文件名和扩展名，但 `image_handler.go` 实现与设计不符

### 2. 存储目录分散

**现状分析**：
1. 文件按业务类型分散在多个目录：`storage/images/`, `storage/blog-assets/`, `storage/thumbnails/`, `storage/uploads/`
2. 每个 API handler 需要硬编码不同的 category 字符串（4+ 个）
3. 迁移和备份时需要处理多个目录路径
4. 切换到对象存储时需要配置多个 bucket/prefix
5. 缩略图与原始文件混在一起，无法灵活管理

**设计目标**：
1. 所有文件统一使用 `{timestamp}-{suffix}-{randomid}` 命名格式（无扩展名）
2. **持久化文件**（用户上传的原始文件）统一存储在 `storage/files/`
3. **派生文件**（可重新生成的缩略图）独立存储在 `storage/thumbnails/`
4. 简化 `FileStorage` 接口，category 只有两个值：`files`/`thumbnails`
5. 通过数据库 `file_resources` 表的 `category` 字段区分业务类型
6. 原始文件名、扩展名、MIME 类型、分类信息全部存储在数据库中

**约束条件**：
- 必须保持 API 响应格式不变（前端不受影响）
- 迁移过程必须幂等（可重复执行）
- **重要**: 文件命名和目录统一仅在 `blogs/` → Go 后端迁移时处理，后续步骤目前无数据

## Goals / Non-Goals

### Goals
1. 统一所有文件上传 API 的命名规则为 `{timestamp}-{suffix}-{randomid}`（无扩展名）
2. 持久化文件统一存储在 `storage/files/` 目录下
3. 派生文件（缩略图）独立存储在 `storage/thumbnails/` 目录下
4. 简化 `FileStorage` 接口，category 只有两个值：`files`/`thumbnails`
5. 确保数据库 `FileResource` 记录与物理文件名一致
6. 在现有 `blogs/` → Go 后端迁移流程中集成文件命名和目录统一逻辑
7. 保持前端 API 兼容性（响应格式不变）
8. 确保所有文件访问通过数据库记录进行

### Non-Goals
1. 不实现文件去重（可作为未来优化）
2. 不修改前端代码（后端变更对前端透明）
3. 不实现对象存储集成（仅统一本地文件系统存储）
4. 不需要单独的文件重命名迁移脚本（集成到现有迁移流程）

## Decisions

### Decision 1: 文件命名规则统一

**方案**：采用 `{timestamp}-{suffix}-{randomid}` 格式（无扩展名）

**格式说明**：
- `timestamp`: 毫秒级时间戳（`time.Now().UnixMilli()`）
- `suffix`: 文件扩展名（不含点，如 `jpg`, `png`）
- `randomid`: 6 位随机数（`time.Now().Nanosecond()%1000000`）

**示例**：
- 存储文件名：`1638123456789-jpg-123456`
- 数据库记录：`{id: "1638123456789-jpg-123456", original_name: "avatar.jpg", extension: ".jpg", category: "image"}`

**代码变更位置**：
```go
// 修改前 (image_handler.go:64-65)
fileID := fmt.Sprintf("%d-%d", time.Now().UnixMilli(), time.Now().Nanosecond()%1000000)
filename := fileID + ext  // ❌ 带扩展名

// 修改后
ext := filepath.Ext(file.Filename)
extWithoutDot := strings.TrimPrefix(ext, ".")
fileID := fmt.Sprintf("%d-%s-%d", time.Now().UnixMilli(), extWithoutDot, time.Now().Nanosecond()%1000000)
// 文件系统中存储为 fileID（无扩展名），数据库记录 extension 和 category
```

**理由**：
1. 与 `asset_handler.go` 已有实现保持一致
2. 符合 `add-go-backend-asset-apis/design.md` Decision 1 的设计决策
3. 提升安全性（避免路径遍历攻击）
4. 便于未来扩展（支持对象存储、文件去重）

### Decision 2: 统一存储目录（持久化文件 vs 派生文件）

**方案**：持久化文件统一存储在 `storage/files/`，派生文件独立存储在 `storage/thumbnails/`

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
// 图片
storage.Save("images", fileID, data)           // -> storage/images/{fileID}
// 博客资产
storage.Save("blog-assets", fileID, data)      // -> storage/blog-assets/{fileID}
// 缩略图
storage.Save("thumbnails", fileID, data)       // -> storage/thumbnails/{fileID}
// 上传文件
storage.Save("uploads", fileID, data)          // -> storage/uploads/{fileID}

// 数据库记录
FileResource{
    ID: fileID,
    Category: "image",                         // 仅用于查询
    StoragePath: "storage/images/{fileID}"     // 路径包含业务category
}
```

**变更后**：
```go
// 所有持久化文件
storage.Save("files", fileID, data)            // -> storage/files/{fileID}
// 所有缩略图
storage.Save("thumbnails", thumbID, data)      // -> storage/thumbnails/{thumbID}

// 数据库记录成为唯一真实来源
FileResource{
    ID: fileID,
    Category: "image",                         // 区分业务类型
    StoragePath: "storage/files/{fileID}"      // 统一路径（持久化文件）
}

FileResource{
    ID: thumbID,
    Category: "thumbnail",
    StoragePath: "storage/thumbnails/{thumbID}" // 独立路径（派生文件）
}
```

**FileStorage 接口简化**：
```go
// 变更前（4+ 个 category 值）
storage.Save("images", fileID, data)
storage.Save("blog-assets", fileID, data)
storage.Save("thumbnails", thumbID, data)
storage.Save("uploads", fileID, data)

// 变更后（只有 2 个 category 值）
storage.Save("files", fileID, data)      // 持久化文件
storage.Save("thumbnails", thumbID, data) // 派生文件
```

**理由**：

1. **区分持久化与派生文件**：
   - 持久化文件：用户上传的原始文件，必须长期保存
   - 派生文件：从原始文件生成的缩略图，可以重新生成

2. **灵活的备份策略**：
   - 备份时可跳过 `thumbnails/`，节省空间和时间
   - 恢复后重新生成缩略图即可

3. **方便批量操作**：
   - 需要更改缩略图尺寸？删除 `thumbnails/` 目录，重新生成
   - 清理缓存不影响原始文件

4. **简化代码，降低维护成本**：
   - category 从 4+ 个减少到 2 个
   - 持久化文件只需关注 `files`，不需要区分 images/blog-assets/uploads
   - 减少硬编码字符串和拼写错误

5. **提升扩展性**：
   - 新增业务文件类型（如 video, document）无需修改 Storage 接口
   - 只需在数据库添加新的 category 值
   - 切换到对象存储时只需配置两个 bucket

6. **数据库作为唯一真实来源**：
   - 所有文件元数据（包括业务分类）存储在数据库
   - 物理存储只负责保存二进制数据，分为"持久"和"派生"两类
   - 符合关注点分离原则

7. **性能优化空间**：
   - 可对缩略图设置过期策略、CDN 加速
   - 可对原始文件设置归档策略（冷热数据分离）

**风险缓解**：
- **文件名冲突**：已通过时间戳+扩展名+随机数保证唯一性
- **查询性能**：数据库 `category` 字段已建立索引
- **迁移风险**：集成到现有迁移流程，原始数据不变

### Decision 3: 数据库迁移策略

### Decision 3: 数据库迁移策略

**方案**：将文件命名和目录统一集成到现有的 `blogs/` → Go 后端迁移流程

**重要说明**：
- **不需要单独的文件重命名或目录迁移** - 所有文件在从 `blogs/` 迁移时就使用新命名规则和统一目录
- 后续步骤目前无数据，无需考虑已存在文件的重命名或移动
- 新上传的文件直接使用 `{timestamp}-{ext}-{random}` 格式存储在 `storage/files/`

**迁移步骤**（集成到现有 `cmd/migrate/main.go`）：
1. 从 `blogs/images/` 读取图片文件时:
   - 生成新文件 ID: `{timestamp}-{ext}-{random}`
   - 复制到 `storage/files/{fileID}`（无扩展名，持久化文件统一目录）
   - 创建 `file_resources` 记录（category = "image", storage_path = "storage/files/{fileID}"）
2. 从 `blogs/{postId}/assets/` 读取博客资产时:
   - 生成新文件 ID
   - 复制到 `storage/files/{fileID}`（持久化文件统一目录）
   - 创建 `file_resources` 记录（category = "blog-asset"）
   - 创建 `post_asset_relations` 记录
3. 缩略图（无需迁移）:
   - 缩略图由上传时自动生成
   - 存储在 `storage/thumbnails/` 下（category = "thumbnail"）
   - 可随时删除并重新生成

**幂等性保证**：
- 检查数据库中是否已存在对应的文件记录（通过原始文件名）
- 跳过已迁移的文件
- 支持重复执行迁移脚本

**代码实现示例**（集成到现有迁移逻辑）：
```go
// 迁移图片到统一存储
func migrateBlogImages(db *gorm.DB, blogsPath, storagePath string) error {
    imagesDir := filepath.Join(blogsPath, "images")
    filesDir := filepath.Join(storagePath, "files")  // 持久化文件统一目录
    
    files, err := os.ReadDir(imagesDir)
    if err != nil {
        return err
    }
    
    for _, file := range files {
        if file.IsDir() {
            continue
        }
        
        oldPath := filepath.Join(imagesDir, file.Name())
        ext := filepath.Ext(file.Name())
        extWithoutDot := strings.TrimPrefix(ext, ".")
        
        // 生成新文件 ID（无扩展名）
        fileID := fmt.Sprintf("%d-%s-%d", 
            time.Now().UnixMilli(), 
            extWithoutDot, 
            time.Now().Nanosecond()%1000000)
        
        // 复制文件到持久化文件目录（无扩展名）
        newPath := filepath.Join(filesDir, fileID)
        if err := copyFile(oldPath, newPath); err != nil {
            return err
        }
        
        // 创建数据库记录（包含 category）
        fileResource := models.FileResource{
            ID:           fileID,
            OriginalName: file.Name(),
            Extension:    ext,
            MimeType:     getMimeType(ext),
            Category:     "image",        // 业务类型：图片
            StoragePath:  newPath,
            CreatedAt:    time.Now(),
            UpdatedAt:    time.Now(),
        }
        
        if err := db.Create(&fileResource).Error; err != nil {
            return err
        }
        
        log.Printf("Migrated image: %s -> %s (category: image, storage: files)", file.Name(), fileID)
    }
    
    return nil
}
```

**无需回滚策略**：
- 从 `blogs/` 迁移是一次性操作，原始数据保持不变
- 如果迁移失败，只需清空 Go 后端数据库和 `storage/files/`, `storage/thumbnails/` 目录重新执行
- 不影响原有的 `blogs/` 目录

### Decision 3: 文件访问路径更新

**方案**：所有文件访问必须通过数据库 `FileResource` 记录

**修改位置**：
1. `image_handler.go:GetImage()` - 当前直接拼接路径，需改为查询数据库
2. `image_handler.go:GetThumbnail()` - 当前直接拼接路径，需改为查询数据库
3. `asset_handler.go:GetAsset()` - 已通过数据库查询（✓ 无需修改）

**修改前**：
```go
// image_handler.go:162-163
func (h *ImageHandler) GetImage(c *gin.Context) {
    filename := c.Param("filename")
    imagePath := filepath.Join(config.AppConfig.StoragePath, "images", filename)
    // ...
}
```

**修改后**：
```go
func (h *ImageHandler) GetImage(c *gin.Context) {
    fileID := c.Param("filename") // 参数名保持不变以兼容前端
    
    // 从数据库查询文件资源
    fileResource, err := h.fileResourceRepo.GetFileResource(fileID)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
        return
    }
    
    // 使用数据库中的 storage_path
    c.File(fileResource.StoragePath)
}
```

**理由**：
1. 统一数据访问层，避免硬编码路径
2. 支持未来扩展到对象存储（只需修改 `StoragePath` 格式）
3. 提升安全性（路径由数据库管理，避免路径遍历）

### Decision 4: API 兼容性保证

**方案**：保持 API 响应格式不变，内部存储变更对前端透明

**API 响应示例**：
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

**前端影响**：
- URL 中的文件标识符从 `filename` 变为 `fileID`（但前端无需感知，仍通过响应中的 `url` 字段访问）
- 响应格式完全一致（仍包含 `original_name`, `extension` 等字段）

**理由**：确保后端变更不影响前端服务层（`app/services/image.ts`, `app/services/assets.ts`）

## Risks / Trade-offs

### Risk 1: 数据迁移失败导致文件丢失

**风险**：从 `blogs/` 复制文件到 `storage/` 时失败

**缓解措施**：
- **原始数据不变**：`blogs/` 目录作为数据源保持不变，复制失败不影响原始数据
- 迁移失败时清空 `storage/` 目录和数据库重新执行即可
- 使用事务保证文件复制和数据库写入的原子性
- 迁移日志记录所有操作

### Risk 2: 前端访问迁移后的文件

**风险**：前端从 Next.js API 切换到 Go 后端 API 时可能出现兼容性问题

**缓解措施**：
- API 响应格式完全一致（包含 `url` 字段）
- 前端通过响应中的 `url` 字段访问文件，不直接拼接路径
- 文件命名变更对前端透明（前端无需感知物理存储格式）

### Risk 3: 高并发上传时文件名冲突

**风险**：使用 `time.Now().Nanosecond()` 作为随机数可能在高并发下重复

**缓解措施**：
- 增加随机数范围（当前 6 位，可扩展到 9 位）
- 使用 `crypto/rand` 生成更强的随机数
- 数据库主键约束防止重复（插入失败时重新生成 ID）

### Trade-off 1: 迁移复杂度 vs 长期维护性

**选择**：执行一次性迁移以统一命名策略
**代价**：需要编写和测试迁移脚本，可能影响线上服务
**收益**：长期降低维护成本，提升代码一致性和可扩展性

### Trade-off 2: 同步迁移 vs 异步迁移

**选择**：同步迁移（启动时执行）
**代价**：启动时间可能延长（取决于文件数量）
**收益**：确保应用启动后所有文件命名一致，避免运行时不一致状态

## Migration Plan

**重要说明**: 由于文件命名统一已集成到 `blogs/` → Go 后端迁移流程,且后续步骤目前无数据,实施计划大幅简化。

### 阶段 1: 代码修改和测试（Week 1）
1. 修改 `image_handler.go` 文件命名逻辑（从 `fileID + ext` 改为 `{timestamp}-{ext}-{random}`）
2. 修改 `image_handler.go` 文件访问逻辑（通过数据库查询而非路径拼接）
3. 修改 `thumbnail_service.go` 缩略图命名逻辑
4. 验证 `asset_handler.go` 已符合新规范（无需修改）
5. 编写单元测试验证命名规则

### 阶段 2: 迁移逻辑集成（Week 1-2）
1. 在 `cmd/migrate/main.go` 中修改现有的 `migrateBlogFiles()` 函数
2. 确保从 `blogs/images/` 复制文件时使用新命名规则
3. 确保从 `blogs/thumbnails/` 复制缩略图时使用新命名规则
4. 确保从 `blogs/{postId}/assets/` 复制资产时使用新命名规则
5. 在测试环境验证迁移流程（使用真实的 `blogs/` 数据）

### 阶段 3: 集成测试（Week 2）
1. 搭建测试环境（从 `blogs/` 目录迁移数据）
2. 执行完整迁移流程（`./migrate --migrate-all`）
3. 验证所有文件命名符合新规则（无扩展名）
4. 验证数据库 `file_resources` 记录完整性
5. 验证 API 功能正常（图片上传、显示、删除）

### 阶段 4: 生产部署（Week 2-3）
1. 确保 `blogs/` 目录数据完整（作为数据源）
2. 执行 Go 后端迁移（自动使用新文件命名规则）
3. 验证迁移日志无错误
4. 验证所有文件都正确迁移到 `storage/` 目录
5. 监控 API 错误率和响应时间

### 无需 Rollback 策略
- 从 `blogs/` 迁移是一次性操作,原始数据保持不变
- 如果迁移失败,清空 Go 后端数据库和 `storage/` 目录重新执行即可
- 不会影响原有的 `blogs/` 目录

## Open Questions

1. **是否需要在迁移过程中保留原文件备份？**
   - **建议**：是，复制一份到 `storage/backup/` 目录，迁移验证后手动删除

2. **是否需要支持渐进式迁移（在线迁移）？**
   - **建议**：第一版使用停机迁移（简单可靠），如文件量巨大再考虑在线迁移

3. **旧格式文件的兼容期多久？**
   - **建议**：迁移后立即废弃，不提供兼容层（确保系统一致性）

4. **是否需要迁移缩略图文件？**
   - **建议**：是，缩略图也需要统一命名规则（`thumbnails/` 目录下的文件同样处理）

5. **如何处理迁移过程中上传的新文件？**
   - **建议**：迁移期间禁止文件上传（维护模式），或迁移完成后再次扫描新文件

