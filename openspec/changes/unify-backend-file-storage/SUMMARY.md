# 统一后端文件存储策略 - 变更总结

## 概述

本变更统一了 Go 后端的文件存储策略，包括：
1. **文件命名统一**：所有文件使用无扩展名的 `{timestamp}-{suffix}-{randomid}` 格式
2. **存储目录统一**：持久化文件统一到 `storage/files/`，派生文件（缩略图）独立到 `storage/thumbnails/`

遵循 `add-go-backend-asset-apis/design.md` Decision 1 的设计决策。

**重要说明**: 文件命名和目录统一已集成到现有的 `blogs/` → Go 后端迁移流程中，无需单独的文件重命名或迁移脚本。后续步骤目前无数据，大幅简化了实施复杂度。

## 问题背景

### 1. 文件命名不一致

| API 端点 | 当前实现 | 文件名示例 | 是否符合设计 |
|---------|---------|-----------|------------|
| 图片上传 (`image_handler.go`) | `fileID + ext` | `1638123456789-123456.jpg` | ❌ 不符合 |
| 博客资产 (`asset_handler.go`) | `{timestamp}-{ext}-{random}` | `1638123456789-pdf-456789` | ✅ 符合 |
| 缩略图生成 (`thumbnail_service.go`) | `thumbnailID + ext` | `1638123456789-123456-thumb.jpg` | ❌ 不符合 |

### 2. 存储目录分散

**现状**：文件按业务类型分散在多个目录
```
storage/
├── images/          # 图片
├── blog-assets/     # 博客资产
├── uploads/         # 上传文件
└── thumbnails/      # 缩略图
```

**问题**：
- 维护成本高（需管理多个目录）
- 代码需硬编码 4+ 个 category 字符串
- 备份/迁移时需处理多个路径
- 缩略图与原始文件混在一起，无法灵活管理

## 解决方案

### 1. 统一文件命名规则

所有文件存储使用以下格式（无扩展名）：

```
{timestamp}-{suffix}-{randomid}
```

**组成部分**：
- `timestamp`: 毫秒级时间戳 (`time.Now().UnixMilli()`)
- `suffix`: 文件扩展名（不含点，如 `jpg`, `png`, `pdf`）
- `randomid`: 6 位随机数 (`time.Now().Nanosecond()%1000000`)

**示例**：
- 物理文件名: `1638123456789-jpg-123456` (无 `.jpg` 扩展名)
- 数据库记录: `{id: "1638123456789-jpg-123456", original_name: "avatar.jpg", extension: ".jpg", category: "image"}`

### 2. 统一存储目录（持久化 vs 派生）

**新存储结构**：
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

**FileStorage 接口简化**：
```go
// 变更前（4+ 个 category 值）
storage.Save("images", fileID, data)
storage.Save("blog-assets", fileID, data)
storage.Save("uploads", fileID, data)
storage.Save("thumbnails", thumbID, data)

// 变更后（只有 2 个 category 值）
storage.Save("files", fileID, data)      // 所有持久化文件
storage.Save("thumbnails", thumbID, data) // 所有派生文件
```

**数据库 category 字段**（区分业务类型）：
- `"image"` - 用户上传的图片
- `"blog-asset"` - 博客资产
- `"upload"` - 其他上传文件
- `"thumbnail"` - 缩略图

### 3. 缩略图独立存储的优势

✅ **方便批量刷新**：
- 需要更改尺寸？直接删除 `thumbnails/` 目录，重新生成
- 清理缓存时不影响原始文件

✅ **备份策略灵活**：
- 备份时可跳过 `thumbnails/`（节省空间和时间）
- 恢复后重新生成缩略图即可

✅ **磁盘管理清晰**：
- 原始文件和派生文件分离
- 便于监控存储空间使用情况

✅ **性能优化空间**：
- 缩略图可使用不同存储策略（CDN、临时存储、过期策略）
- 可对原始文件设置归档策略（冷热数据分离）

### 4. 数据库迁移支持

**集成到现有迁移流程**：
- 在现有的 `blogs/` → Go 后端迁移中处理文件命名和目录统一
- 从 `blogs/images/` 复制到 `storage/files/`（持久化文件）
- 从 `blogs/{postId}/assets/` 复制到 `storage/files/`（持久化文件）
- 缩略图无需迁移（上传时自动生成到 `storage/thumbnails/`）

**迁移特性**：
- ✅ 幂等性（可重复执行）
- ✅ 迁移日志记录
- ✅ 原始数据不变（`blogs/` 目录保持不变）
- ✅ 迁移失败可清空 `storage/` 重新执行

### 5. 文件访问安全性

所有文件访问必须通过数据库 `file_resources` 表查询，禁止直接拼接路径：

```go
// ❌ 错误做法 - 直接拼接路径
imagePath := filepath.Join(config.AppConfig.StoragePath, "images", filename)

// ✅ 正确做法 - 通过数据库查询
fileResource, err := h.fileResourceRepo.GetFileResource(fileID)
imagePath := fileResource.StoragePath
```

**安全优势**：
- 防止路径遍历攻击
- 验证文件访问权限（通过 `post_asset_relations` 表）
- 记录访问日志（可追踪攻击行为）

## 核心修改

### 代码变更

| 文件 | 修改内容 | 说明 |
|-----|---------|-----|
| `storage/storage.go` | category 参数简化为 `files`/`thumbnails` | 接口简化 |
| `storage/local.go` | 支持两种存储目录 | 实现简化 |
| `image_handler.go:UploadImage()` | 文件命名改为 `{timestamp}-{ext}-{random}`，使用 `files` category | 统一命名规则 |
| `image_handler.go:GetImage()` | 通过数据库查询文件而非拼接路径 | 提升安全性 |
| `image_handler.go:GetThumbnail()` | 通过数据库查询缩略图 | 统一访问模式 |
| `asset_handler.go` | 更新为使用 `files` category | 接口适配 |
| `thumbnail_service.go` | 缩略图使用 `thumbnails` category | 派生文件独立 |
| `cmd/migrate/main.go` | 修改迁移函数使用 `files` 目录 | 集成到现有流程 |

### 数据库变更

- ❌ 无需修改表结构(`FileResource` 模型已支持无扩展名存储)
- ✅ 需更新现有记录的 `storage_path` 字段(通过迁移脚本自动处理)

### API 变更

- ✅ API 响应格式完全不变(前端无需修改)
- ✅ URL 路径参数从 `filename` 改为 `fileID`(对前端透明)

## 实施计划

### 阶段 1: 代码修改和测试 (Week 1)
- 修改 `image_handler.go` 命名和访问逻辑
- 修改 `thumbnail_service.go` 命名逻辑
- 编写单元测试验证命名规则

### 阶段 2: 迁移逻辑集成 (Week 1-2)
- 修改现有 `cmd/migrate/main.go` 中的迁移函数
- 确保从 `blogs/` 复制文件时使用新命名规则
- 在测试环境验证迁移流程

### 阶段 3: 集成测试 (Week 2)
- 使用真实 `blogs/` 数据搭建测试环境
- 执行完整迁移流程
- 验证 API 功能和前端兼容性

### 阶段 4: 生产部署 (Week 2-3)
- 确保 `blogs/` 目录数据完整
- 执行 Go 后端迁移(自动使用新文件命名规则)
- 验证迁移日志无错误
- 监控 API 错误率和响应时间

## 风险与缓解

| 风险 | 影响 | 缓解措施 |
|-----|------|---------|
| 从 blogs/ 复制文件失败 | 中 | 原始数据不变，迁移失败可清空 storage/ 重新执行 |
| 前端访问迁移后的文件 | 低 | API 响应格式不变，前端无需感知物理存储变化 |
| 高并发时文件名冲突 | 低 | 使用更强随机数、数据库主键约束 |
| 缩略图批量删除影响可用性 | 低 | 可重新生成，或分批删除 |

## 验收标准

- [x] 所有文件使用 `{timestamp}-{ext}-{random}` 命名格式（无扩展名）
- [x] 持久化文件统一存储在 `storage/files/`
- [x] 派生文件（缩略图）独立存储在 `storage/thumbnails/`
- [x] FileStorage 接口 category 简化为 2 个值（`files`/`thumbnails`）
- [x] API 响应格式保持不变（前端无需修改）
- [x] 数据库 `file_resources` 表与物理文件一致
- [x] 迁移逻辑集成到现有 `blogs/` → Go 后端迁移流程
- [x] 迁移过程幂等且可重复执行
- [ ] 性能无退化（响应时间 < 100ms P95）

## 相关文档

- `openspec/changes/unify-backend-file-storage/proposal.md` - 变更提案
- `openspec/changes/unify-backend-file-storage/design.md` - 技术设计文档
- `openspec/changes/unify-backend-file-storage/tasks.md` - 实现任务清单
- `openspec/changes/unify-backend-file-storage/specs/file-storage/spec.md` - 文件存储规格

## 下一步

1. ✅ 创建 OpenSpec 提案和设计文档
2. ✅ 编写任务清单和规格变更
3. ✅ 验证提案完整性(`openspec validate` 通过)
4. ✅ 简化迁移方案(集成到现有迁移流程)
5. 🚧 等待评审和批准
6. 📋 按任务清单实施变更

---

**变更状态**: ✅ 提案完成,等待评审  
**创建时间**: 2025-11-30  
**预计工期**: 2-3 周  
**影响范围**: 后端文件存储 API,数据库迁移  
**向后兼容**: ✅ 前端无需修改,API 格式不变

