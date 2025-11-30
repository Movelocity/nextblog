# 技术设计文档

## Context

当前项目采用 Go 后端 + Next.js 前端的架构。Next.js 原有基于文件系统的博客管理功能已在前端 API 路由（`app/api/*`）中完整实现，但 Go 后端迁移过程中仅实现了部分基础功能（posts、notes、categories、tags、基础图片管理）。

前端服务层（`app/services/*`）已为 Go 后端适配，但多处标注了"Go 后端目前未实现"的功能。本次设计旨在填补这些缺失，并建立统一的文件存储架构。

**约束条件**：
- 无需数据库的轻量级部署支持（基于文件系统）
- 需要保持与 Next.js API 路由的行为一致性
- 支持未来扩展到云存储（OSS、S3）
- 性能要求：图片处理不应阻塞 API 响应

**利益相关者**：
- 前端开发者：需要稳定可用的 API
- 系统管理员：需要监控系统状态
- 内容创作者：需要完整的资产管理和图片编辑功能

## Goals / Non-Goals

### Goals
1. 实现按博客分组的资产管理 API，支持 CRUD 操作
2. 实现缩略图自动生成和管理，提升用户体验
3. 实现图片编辑任务管理 API，支持异步处理
4. 实现系统状态监控 API
5. 设计统一的文件存储接口，降低耦合，便于扩展
6. 保持与 Next.js 原有 API 的行为一致性

### Non-Goals
1. 不实现实时图片编辑（AI 图片编辑功能保留接口但不实现具体逻辑）
2. 不实现复杂的图片处理管线（仅支持缩略图生成和基础裁剪）
3. 不实现对象存储集成（仅设计接口，预留扩展点）
4. 不实现前端组件改动（仅后端 API 实现）

## Decisions

### Decision 1: 文件ID化存储策略

**方案**：文件存储时使用独立ID作为文件名，扩展名和元数据存储在数据库

**文件命名规则**：
- 存储文件名：`{timestamp}-{suffix}-{randomid}` (无扩展名)
- 原始文件名、扩展名、MIME类型存储在数据库表中
- 示例：`1638123456789-jpg-abc` (文件系统) + `{original_name: "avatar.jpg", extension: ".jpg"}` (数据库)
- suffix 为文件扩展名（不含点），便于文件恢复时识别文件类型

**数据库表结构**：
```go
// 文件资源表（统一管理所有文件）
type FileResource struct {
    ID           string    `gorm:"primaryKey"`        // 文件ID（与物理文件名一致）
    OriginalName string    `gorm:"not null"`          // 原始文件名
    Extension    string    `gorm:"not null"`          // 文件扩展名（含点，如 ".jpg"）
    MimeType     string    `gorm:"not null"`          // MIME类型
    Size         int64     `gorm:"not null"`          // 文件大小（字节）
    Category     string    `gorm:"index"`             // 文件分类：image/thumbnail/asset/edit-result
    StoragePath  string    `gorm:"not null"`          // 存储路径
    CreatedAt    time.Time `gorm:"index"`
    UpdatedAt    time.Time
}

// 博客-资产关联表
type PostAssetRelation struct {
    ID          int64     `gorm:"primaryKey;autoIncrement"`
    PostID      string    `gorm:"index;not null"`    // 博客ID
    FileID      string    `gorm:"index;not null"`    // 文件资源ID（外键 -> file_resources.id）
    RelationType string   `gorm:"default:'attachment'"` // 关联类型：attachment/inline-image/cover
    DisplayOrder int      `gorm:"default:0"`          // 显示顺序
    CreatedAt    time.Time
}
```

**优势**：
1. **安全性**：避免文件名冲突和路径遍历攻击
2. **灵活性**：可以随时修改原始文件名显示，不影响物理存储
3. **可迁移性**：切换存储后端时只需更新数据库路径记录
4. **去重能力**：未来可基于文件哈希实现去重（多个记录指向同一物理文件）
5. **关联管理**：通过关联表清晰管理博客与资源的关系

**替代方案考虑**：
1. **文件名保留扩展名**（如 `{id}.jpg`）：简单但扩展性差，改扩展名需重命名文件
2. **直接在 assets 表存储文件信息**：耦合度高，无法复用文件资源
3. **分离文件资源和关联关系**（选择）：解耦、灵活、可扩展

**数据迁移策略**：
- 后端启动时执行迁移检查
- 扫描存储目录中带扩展名的旧文件
- 自动重命名为纯ID文件（去除扩展名）
- 在数据库中创建对应的 `file_resources` 记录
- 建立 `post_asset_relations` 关联关系
- 支持幂等操作（多次运行不会重复迁移）

### Decision 2: 统一文件存储接口设计

**方案**：引入 `FileStorage` 接口，抽象文件操作

```go
type FileStorage interface {
    // 保存文件，返回文件ID
    Save(category string, data []byte) (fileID string, err error)
    
    // 根据ID获取文件
    Get(fileID string) ([]byte, error)
    
    // 根据ID删除文件
    Delete(fileID string) error
    
    // 列出分类下的所有文件ID
    List(category string, filters map[string]interface{}) ([]string, error)
    
    // 检查文件是否存在
    Exists(fileID string) (bool, error)
    
    // 移动文件到新分类
    Move(fileID, fromCategory, toCategory string) error
}
```

**分类（category）**：
- `images` - 全局图片
- `thumbnails` - 缩略图
- `blog-assets` - 博客资产
- `image-edit-results` - 图片编辑结果

**理由**：使用文件ID而非文件名作为主键，与数据库设计保持一致。

**替代方案考虑**：
1. **直接使用文件系统操作**：简单但不易扩展，测试困难
2. **使用第三方存储抽象库**：引入额外依赖，过度设计
3. **采用自定义接口**（选择）：灵活、可测试、易扩展

### Decision 3: 缩略图生成策略

**方案**：使用 Go 原生图像库 `imaging` (github.com/disintegration/imaging)

- 上传时同步生成缩略图（可选参数控制）
- 缩略图尺寸：180x180（与 Next.js API 保持一致）
- 格式：JPEG，质量 80
- 文件命名：`{original_filename}` （与原图相同文件名，存储在不同目录）

**替代方案考虑**：
1. **异步生成缩略图**：增加复杂度，但可提升响应速度
2. **使用 CGO 库（如 bimg）**：性能更好但增加部署复杂度
3. **同步生成（选择）**：简单可靠，性能可接受（<100ms）

**理由**：对于博客场景，图片上传频率较低，同步生成不会影响用户体验，且实现简单。

### Decision 4: 图片编辑任务管理

**方案**：异步任务队列 + 任务状态管理

- 使用内存队列 + 文件持久化（JSON 文件）
- 任务状态：processing, completed, failed
- 轮询间隔：客户端 2 秒
- 任务超时：5 分钟
- 并发限制：1 个任务（避免资源竞争）

**数据结构**：
```go
type ImageEditTask struct {
    ID            string    `json:"id"`
    Status        string    `json:"status"`
    OriginalImage string    `json:"original_image"`
    ResultImage   string    `json:"result_image,omitempty"`
    Prompt        string    `json:"prompt"`
    Message       string    `json:"message,omitempty"`
    CreatedAt     int64     `json:"created_at"`
    UpdatedAt     int64     `json:"updated_at"`
}
```

**替代方案考虑**：
1. **使用消息队列（Redis/RabbitMQ）**：重量级，不符合无数据库目标
2. **使用 goroutine + channel**：简单但状态不持久
3. **文件队列 + goroutine（选择）**：平衡持久化和简单性

**理由**：文件存储任务状态符合项目无数据库架构，goroutine 处理并发足够满足需求。

**注意**：图片编辑的具体实现（AI 图片生成/修改）不在本次范围，仅提供任务管理框架。可在 `start_task` 中调用外部 API 或返回 mock 数据。

### Decision 5: 博客资产 API 路由设计

**方案**：RESTful 风格，资产作为博客的子资源

- `GET /api/posts/:postId/assets` - 列出博客资产
- `POST /api/posts/:postId/assets` - 上传博客资产
- `GET /api/posts/:postId/assets/:filename` - 获取单个资产
- `DELETE /api/posts/:postId/assets/:filename` - 删除资产

**替代方案考虑**：
1. **独立资产路由 `/api/assets?blogId=xxx`**：与 Next.js API 一致，但不够 RESTful
2. **嵌套路由（选择）**：更符合 RESTful 规范，语义清晰

**理由**：嵌套路由明确表达了资产与博客的从属关系，符合 REST 最佳实践。但为保持兼容性，也可保留旧路由作为别名。

### Decision 6: 系统状态 API 实现

**方案**：使用 Go 标准库获取系统信息

- 使用 `runtime` 包获取内存和进程信息
- 使用 `time` 包计算启动时间和运行时长
- 使用 `syscall` 或第三方库（如 `gopsutil`）获取磁盘信息

**返回格式**：
```json
{
  "boot_time": 1234567890,
  "boot_time_formatted": "2025-11-30 12:00:00",
  "uptime_seconds": 3600,
  "memory": {
    "system": {
      "total": 17179869184,
      "used": 8589934592,
      "free": 8589934592,
      "usage_percent": "50.00%",
      "total_formatted": "16.00 GB",
      "used_formatted": "8.00 GB",
      "free_formatted": "8.00 GB"
    },
    "process": {
      "rss": 104857600,
      "heap_total": 67108864,
      "heap_used": 33554432,
      "rss_formatted": "100.00 MB",
      "heap_total_formatted": "64.00 MB",
      "heap_used_formatted": "32.00 MB"
    }
  },
  "disk": {
    "/": 50.5
  }
}
```

**理由**：`gopsutil` 是成熟的跨平台系统信息库，API 简单，功能完整。

## Risks / Trade-offs

### Risk 1: 图片编辑任务长时间占用内存

**风险**：如果任务失败但未清理，任务数据会一直占用内存

**缓解措施**：
- 实现任务自动过期机制（24 小时后自动删除已完成/失败的任务）
- 提供管理接口批量清理任务
- 限制并发任务数量

### Risk 2: 文件存储扩展到云存储时的兼容性

**风险**：本地文件系统和对象存储的 API 差异可能导致接口不适用

**缓解措施**：
- 接口设计时参考 AWS S3 和阿里云 OSS 的通用模式
- 抽象路径概念（category + filename）而非绝对路径
- 在单元测试中使用 mock 验证接口适配性

### Risk 3: 缩略图生成失败导致上传流程中断

**风险**：图片格式不支持或损坏时缩略图生成可能失败

**缓解措施**：
- 缩略图生成失败不中断上传流程，仅记录日志
- 返回响应中标注缩略图是否生成成功
- 提供独立 API 手动触发缩略图生成

### Trade-off 1: 同步 vs 异步缩略图生成

**选择**：同步生成
**代价**：上传响应时间增加 50-100ms
**收益**：实现简单，无需管理异步任务状态

### Trade-off 2: 数据库 vs 文件存储任务状态

**选择**：文件存储
**代价**：查询性能略低，不支持复杂过滤
**收益**：无需数据库依赖，部署简单

## Migration Plan

### 阶段 1: 核心存储接口实现（Week 1）
1. 实现 `FileStorage` 接口和 `LocalFileStorage`
2. 编写单元测试
3. 迁移现有图片上传逻辑到新接口

### 阶段 2: 博客资产和缩略图 API（Week 2）
1. 实现博客资产 CRUD API
2. 集成缩略图生成到图片上传流程
3. 修改前端服务层移除"未实现"标注
4. 测试前后端集成

### 阶段 3: 图片编辑和系统状态 API（Week 3）
1. 实现图片编辑任务管理框架
2. 实现系统状态 API
3. 前端集成测试
4. 性能和压力测试

### 阶段 4: 数据库迁移和清理（Week 4）
1. 创建数据库迁移脚本
2. 清理旧的临时代码和注释
3. 更新文档
4. 发布和部署

### Rollback 策略
- 每个阶段都保持向后兼容
- 前端服务层保留降级逻辑（检测 404 时回退到旧行为）
- 数据库迁移支持回滚脚本

## Open Questions

1. **图片编辑的具体实现方式？**
   - 是否集成第三方 AI 图片编辑 API（如 Replicate、Stability AI）？
   - 还是仅提供任务管理框架，具体编辑逻辑由扩展实现？
   - **建议**：第一版仅提供框架，返回 mock 数据，后续根据需求集成真实 API

2. **是否需要支持资产版本管理？**
   - 博客资产被覆盖时是否保留历史版本？
   - **建议**：第一版不支持，未来可通过文件名后缀（如 `image-v2.jpg`）实现

3. **系统状态 API 是否需要认证？**
   - 系统信息可能包含敏感数据（路径、内存使用）
   - **建议**：需要认证，仅管理员可访问

4. **缩略图尺寸是否需要可配置？**
   - 不同场景可能需要不同尺寸（列表缩略图、详情缩略图）
   - **建议**：第一版固定 180x180，后续通过查询参数支持自定义尺寸

5. **文件存储路径结构是否需要重新设计？**
   - 当前路径：`storage/images/`, `storage/thumbnails/`
   - 是否按日期分目录以提升性能？（如 `storage/images/2025/11/30/`）
   - **建议**：保持现有结构，性能可通过 CDN 和缓存优化

