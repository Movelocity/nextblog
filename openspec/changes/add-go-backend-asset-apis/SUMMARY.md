# Go 后端缺失接口汇总及实施计划

## 📋 缺失接口清单

通过分析 `app/services/*.ts` 中标注的"Go 后端目前未实现"注释，发现以下功能缺失：

### 1. 博客资产管理（app/services/assets.ts）
```typescript
// 注意：Go 后端目前未实现按博客分组的资产管理 API
listAssets: async (blogId: string): Promise<Asset[]>
```

**现状**：前端返回空数组，功能不可用  
**Next.js API**：`app/api/asset/route.ts` 已实现完整功能  
**需要实现**：
- `GET /api/posts/:postId/assets` - 列出资产
- `POST /api/posts/:postId/assets` - 上传资产
- `GET /api/posts/:postId/assets/:filename` - 获取资产
- `DELETE /api/posts/:postId/assets/:filename` - 删除资产

---

### 2. 缩略图管理（app/services/assets.ts & image.ts）
```typescript
// 注意：Go 后端暂不支持缩略图，返回原图 URL
getThumbnailUrl: (fileName: string): string
downloadThumbnail: async (fileName: string): Promise<Blob>
```

**现状**：所有缩略图请求都返回原图  
**Next.js API**：`app/api/asset/image/route.ts` 支持 `generateThumbnail=true` 参数  
**需要实现**：
- 图片上传时支持缩略图生成（180x180, JPEG 80%）
- `GET /api/images/:filename/thumbnail` 或 `GET /api/thumbnails/:filename`
- 删除图片时同步删除缩略图

---

### 3. 图片编辑 API（app/services/image.ts）
```typescript
// 注意：Go 后端目前未实现图片编辑 API
const imageEditService = {
  getAllTasks: async (): Promise<ImageEditTask[]>
  getTaskStatus: async (taskId: string): Promise<ImageEditTask>
  startEditTask: async (request: StartImageEditRequest): Promise<StartImageEditResponse>
  stopTask: async (taskId: string): Promise<TaskActionResponse>
  deleteTask: async (taskId: string): Promise<TaskActionResponse>
  retryTask: async (taskId: string, newPrompt?: string): Promise<TaskActionResponse>
  pollTaskStatus: async (taskId: string): Promise<ImageEditTask>
}
```

**现状**：所有方法抛出 "not implemented" 错误  
**Next.js API**：`app/api/image-edit/route.ts` 已实现完整任务管理  
**需要实现**：
- `GET /api/image-edit` - 获取任务列表
- `GET /api/image-edit?task_id=xxx` - 获取任务状态
- `POST /api/image-edit` - 创建任务
- `PUT /api/image-edit?task_id=xxx` - 停止任务
- `PATCH /api/image-edit?task_id=xxx` - 重试任务
- `DELETE /api/image-edit?task_id=xxx` - 删除任务
- 异步任务处理机制（goroutine + 状态管理）

---

### 4. 系统状态 API（app/services/system.ts）
```typescript
// 注意：Go 后端目前没有实现系统状态 API
export const getSystemStatus = async (): Promise<SystemStatus> => {
  throw new Error('System status API is not implemented in Go backend. Use health check instead.');
}
```

**现状**：直接抛出错误  
**Next.js API**：`app/api/system/route.ts` 已实现  
**需要实现**：
- `GET /api/system/status` - 返回系统状态
  - 启动时间和运行时长
  - 内存使用（系统 + 进程）
  - 磁盘使用
  - 格式化字符串

---

## 🏗️ 文件ID化存储接口设计

### 核心设计理念

**文件物理存储与元数据分离**：
- 物理文件名：纯ID（如 `1638123456789-abc`），不含扩展名
- 元数据（原始文件名、扩展名、MIME类型）存储在数据库 `file_resources` 表
- 博客与资产的关联关系存储在 `post_asset_relations` 表

### 数据模型

```go
// 文件资源表（统一管理所有文件）
type FileResource struct {
    ID           string    `gorm:"primaryKey"`        // 文件ID（与物理文件名一致）
    OriginalName string    `gorm:"not null"`          // 原始文件名（含扩展名）
    Extension    string    `gorm:"not null"`          // 文件扩展名（含点，如 ".jpg"）
    MimeType     string    `gorm:"not null"`          // MIME类型
    Size         int64     `gorm:"not null"`          // 文件大小（字节）
    Category     string    `gorm:"index"`             // 文件分类
    StoragePath  string    `gorm:"not null"`          // 存储路径
    CreatedAt    time.Time `gorm:"index"`
    UpdatedAt    time.Time
}

// 博客-资产关联表
type PostAssetRelation struct {
    ID          int64     `gorm:"primaryKey;autoIncrement"`
    PostID      string    `gorm:"index;not null"`    // 博客ID
    FileID      string    `gorm:"index;not null"`    // 文件资源ID
    RelationType string   `gorm:"default:'attachment'"` // 关联类型
    DisplayOrder int      `gorm:"default:0"`          // 显示顺序
    CreatedAt    time.Time
}
```

### 接口定义

```go
type FileStorage interface {
    // 保存文件，返回文件ID
    Save(category string, data []byte) (fileID string, err error)
    
    // 根据ID获取文件
    Get(fileID string) ([]byte, error)
    
    // 根据ID删除文件
    Delete(fileID string) error
    
    // 列出分类下的所有文件ID
    List(category string) ([]string, error)
    
    // 检查文件是否存在
    Exists(fileID string) (bool, error)
}
```

### 文件分类（Category）

| Category | 存储路径 | 用途 | 元数据表 |
|----------|----------|------|----------|
| `images` | `storage/images/` | 全局图片 | file_resources |
| `thumbnails` | `storage/thumbnails/` | 缩略图 | file_resources |
| `blog-assets` | `storage/blog-assets/` | 博客资产 | file_resources + post_asset_relations |
| `image-edit-results` | `storage/image-edit/` | 编辑结果 | file_resources |

### 数据迁移策略

**问题**：现有系统中文件名包含扩展名（如 `avatar.jpg`），需要迁移到ID化存储。

**解决方案**：后端启动时自动迁移
1. 扫描存储目录中带扩展名的文件
2. 提取文件扩展名和元数据
3. 生成新的文件ID
4. 重命名物理文件（去除扩展名）
5. 在数据库中创建 `file_resources` 记录
6. 对于博客资产，创建 `post_asset_relations` 关联记录
7. 支持幂等操作（多次运行不会重复迁移）

**示例**：
```
旧格式：storage/images/avatar.jpg
↓ 迁移
新格式：storage/images/1638123456789-abc (物理文件)
       + file_resources表记录 (id="1638123456789-abc", original_name="avatar.jpg", extension=".jpg")
```

### 优势

1. **安全性**：防止文件名冲突和路径遍历攻击
2. **灵活性**：可修改原始文件名显示，不影响物理存储
3. **可迁移性**：切换存储后端只需更新数据库路径
4. **去重能力**：未来可基于哈希实现去重
5. **关联管理**：清晰的多对多关系（一个文件可被多个博客引用）

---

## 📦 OpenSpec 提案

已创建完整的 OpenSpec 提案：`openspec/changes/add-go-backend-asset-apis/`

### 文件结构

```
openspec/changes/add-go-backend-asset-apis/
├── proposal.md         # 提案说明（Why, What, Impact）
├── design.md           # 技术设计文档（决策、权衡、风险）
├── tasks.md            # 实施任务清单（10 个阶段，60+ 子任务）
└── specs/
    └── file-storage/
        └── spec.md     # 规范增量（8 个需求，40+ 场景）
```

### 验证状态

✅ **Passed**: `openspec validate add-go-backend-asset-apis --strict`

---

## 📊 实施优先级

### P0 - 核心功能（Stage 1）
1. **统一文件存储接口** - 基础设施
2. **博客资产管理 API** - 前端依赖高
3. **缩略图生成** - 用户体验提升

### P1 - 增强功能（Stage 2）
4. **系统状态 API** - 运维需求
5. **图片编辑任务框架** - 复杂但影响范围小

### P2 - 优化清理（Stage 3）
6. **前端服务层更新** - 移除"未实现"标注
7. **集成测试** - 保证质量
8. **文档和部署** - 完善交付

---

## 🎯 关键决策

1. **同步 vs 异步缩略图生成**  
   ✅ 选择：同步生成  
   📝 理由：博客场景上传频率低，同步简单可靠

2. **任务状态存储**  
   ✅ 选择：文件存储（JSON）  
   📝 理由：符合无数据库架构，足够满足需求

3. **图片编辑具体实现**  
   ✅ 选择：第一版仅提供框架，返回 mock 数据  
   📝 理由：AI 图片编辑需要外部服务，先建立架构再集成

4. **路由设计**  
   ✅ 选择：RESTful 嵌套路由 `/api/posts/:postId/assets`  
   📝 理由：语义清晰，符合 REST 最佳实践

---

## ⚠️ 风险和缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 缩略图生成失败中断上传 | 高 | 失败不中断流程，仅记录日志 |
| 图片编辑任务占用内存 | 中 | 24 小时自动清理 + 并发限制 |
| 文件存储扩展到云存储不兼容 | 低 | 接口设计参考 S3/OSS 通用模式 |

---

## 📝 下一步行动

1. **获取提案批准** - 评审设计文档和技术决策
2. **启动实施** - 按 tasks.md 清单逐步完成
3. **持续集成** - 每个阶段完成后进行集成测试
4. **文档更新** - 更新 API 文档和 README

---

## 📚 参考文档

- **OpenSpec 提案目录**: `openspec/changes/add-go-backend-asset-apis/`
- **Next.js 原 API 实现**: `app/api/asset/`, `app/api/image-edit/`
- **前端服务层**: `app/services/assets.ts`, `app/services/image.ts`, `app/services/system.ts`
- **Go 后端当前实现**: `server/internal/api/image_handler.go`

---

生成时间：2025-11-30  
提案状态：待批准  
预计工期：4 周

