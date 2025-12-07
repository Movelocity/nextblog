# 系统架构图

## 当前状态 vs 目标状态

### 当前状态（部分实现）

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                      │
├─────────────────────────────────────────────────────────────────┤
│  app/services/assets.ts    │ ❌ listAssets() → 返回 []           │
│  app/services/image.ts     │ ❌ imageEditService → 全部抛错误     │
│  app/services/system.ts    │ ❌ getSystemStatus() → 抛错误       │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTP API
┌──────────────────────▼─────────────────────────────────────────┐
│                      Go Backend (Partial)                      │
├────────────────────────────────────────────────────────────────┤
│  ✅ POST /api/images/upload     - 基础图片上传                    │
│  ✅ GET  /api/images/:filename  - 获取图片                       │
│  ✅ DELETE /api/images/:filename - 删除图片                      │
│  ✅ GET  /api/posts             - 博客 CRUD                     │
│  ✅ GET  /api/notes             - 笔记 CRUD                     │
│                                                                │
│  ❌ 按博客分组的资产管理                                           │
│  ❌ 缩略图生成和管理                                              │
│  ❌ 图片编辑任务管理                                              │
│  ❌ 系统状态监控                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

### 目标状态（完整实现）

```
┌────────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                         │
├────────────────────────────────────────────────────────────────────┤
│  app/services/assets.ts    │ ✅ 完整资产管理（CRUD）                  │
│  app/services/image.ts     │ ✅ 缩略图 + 图片编辑任务管理              │
│  app/services/system.ts    │ ✅ 系统状态监控                          │
└──────────────────────┬───────────────────────────────────────────┬─┘
                       │ HTTP API                                  │
┌──────────────────────▼───────────────────────────────────────────▼─┐
│                      Go Backend (Complete)                         │
├────────────────────────────────────────────────────────────────────┤
│  【博客资产管理】                                                     │
│  ✅ GET    /api/posts/:id/assets          - 列出资产                 │
│  ✅ POST   /api/posts/:id/assets          - 上传资产                 │
│  ✅ GET    /api/posts/:id/assets/:file    - 获取资产                 │
│  ✅ DELETE /api/posts/:id/assets/:file    - 删除资产                 │
│                                                                    │
│  【图片和缩略图】                                                     │
│  ✅ POST   /api/images/upload?generateThumbnail=true                │
│  ✅ GET    /api/images/:filename                                    │
│  ✅ GET    /api/images/:filename/thumbnail                          │
│  ✅ DELETE /api/images/:filename (自动删除缩略图)                     │
│                                                                    │
│  【图片编辑任务】                                                     │
│  ✅ GET    /api/image-edit                - 获取任务列表              │
│  ✅ GET    /api/image-edit?task_id=xxx    - 获取任务状态              │
│  ✅ POST   /api/image-edit                - 创建任务                 │
│  ✅ PUT    /api/image-edit?task_id=xxx    - 停止任务                 │
│  ✅ PATCH  /api/image-edit?task_id=xxx    - 重试任务                 │
│  ✅ DELETE /api/image-edit?task_id=xxx    - 删除任务                 │
│                                                                     │
│  【系统监控】                                                         │
│  ✅ GET    /api/system/status             - 系统状态                  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                        Internal Architecture                        │
├─────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                      API Handlers                              │ │
│  │  - asset_handler.go                                            │ │
│  │  - image_handler.go (+ thumbnail support)                      │ │
│  │  - image_edit_handler.go                                       │ │
│  │  - system_handler.go                                           │ │
│  └────────────┬────────────────────────────────────────┬──────────┘ │
│               │                                        │            │
│  ┌────────────▼────────────────┐    ┌──────────────────▼──────────┐ │
│  │      Repositories           │    │      Services               │ │
│  │  - asset_repository.go      │    │  - thumbnail_service.go     │ │
│  │  - image_repository.go      │    │  - image_edit_service.go    │ │
│  │  - task_repository.go       │    │  - system_info_service.go   │ │
│  └────────────┬────────────────┘    └──────────────────┬──────────┘ │
│               │                                        │            │
│  ┌────────────▼────────────────────────────────────────▼──────────┐ │
│  │                  Unified File Storage Interface                │ │
│  │                                                                │ │
│  │  interface FileStorage {                                       │ │
│  │    Save(category, filename, data)                              │ │
│  │    Get(category, filename)                                     │ │
│  │    Delete(category, filename)                                  │ │
│  │    List(category, filters)                                     │ │
│  │    Exists(category, filename)                                  │ │
│  │  }                                                             │ │
│  └────────────┬────────────────────────────────────────┬──────────┘ │
│               │                                        │            │
│  ┌────────────▼─────────────────┐   ┌──────────────────▼──────────┐ │
│  │  LocalFileStorage            │   │  [Future] CloudStorage      │ │
│  │  - storage/local.go          │   │  - storage/oss.go (OSS)     │ │
│  │  - 文件系统操作                │   │  - storage/s3.go (S3)       │ │
│  └────────────┬─────────────────┘   └─────────────────────────────┘ │
│               │                                                     │
└───────────────┼─────────────────────────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────────────────────────┐
│                        File System / Storage                         │
├──────────────────────────────────────────────────────────────────────┤
│  storage/                                                            │
│  ├── images/                      - 全局图片（纯ID，无扩展名）          │
│  │   ├── 1638123456789-abc       （原始文件名在数据库）               │
│  │   └── 1638123456790-def                                          │
│  ├── thumbnails/                  - 缩略图 (180x180，纯ID)            │
│  │   ├── 1638123456791-ghi                                          │
│  │   └── 1638123456792-jkl                                          │
│  ├── blog-assets/                 - 博客资产（纯ID，关联在数据库）      │
│  │   ├── 1638123456793-mno       （关联到 post_id 通过数据库）        │
│  │   ├── 1638123456794-pqr                                          │
│  │   └── 1638123456795-stu                                          │
│  └── image-edit/                  - 图片编辑结果（纯ID）               │
│      └── 1638123456796-vwx                                          │
│                                                                      │
│  【注】所有文件名为纯ID，不含扩展名                                    │
│       原始文件名、扩展名等元数据存储在 file_resources 表                │
│       博客-资产关联关系存储在 post_asset_relations 表                   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 数据流示例

### 场景 1: 上传博客资产（ID化存储）

```
Frontend
   │
   │ POST /api/posts/1737467244252/assets
   │ FormData: { file: "diagram.png" (原始文件名) }
   │
   ▼
AssetHandler.UploadAsset()
   │
   ├─► Validate postId exists
   ├─► Generate fileID: "1638123456789-abc"
   ├─► Extract extension: ".png"
   ├─► Extract MIME type: "image/png"
   │
   ▼
FileStorage.Save("blog-assets", data)
   │
   ├─► Save to: storage/blog-assets/1638123456789-abc (无扩展名)
   ├─► Return fileID: "1638123456789-abc"
   │
   ▼
FileResourceRepository.CreateFileResource()
   │
   ├─► INSERT INTO file_resources (
   │       id="1638123456789-abc",
   │       original_name="diagram.png",
   │       extension=".png",
   │       mime_type="image/png",
   │       size=..., category="blog-assets", ...
   │   )
   │
   ▼
PostAssetRepository.CreateRelation()
   │
   ├─► INSERT INTO post_asset_relations (
   │       post_id="1737467244252",
   │       file_id="1638123456789-abc",
   │       relation_type="attachment"
   │   )
   │
   ▼
Response: { 
  success: true, 
  fileId: "1638123456789-abc", 
  originalName: "diagram.png" 
}
```

---

### 场景 2: 图片编辑任务处理

```
Frontend
   │
   │ POST /api/image-edit
   │ Body: { orig_img: "test.jpg", prompt: "make it brighter" }
   │
   ▼
ImageEditHandler.CreateTask()
   │
   ├─► Generate taskId: "task-1638123456789"
   ├─► Create ImageEditTask { status: "processing", ... }
   │
   ▼
ImageEditService.CreateTask()
   │
   ├─► INSERT INTO image_edit_tasks (...)
   ├─► Start goroutine: processTask(taskId)
   │
   ▼
Response: { task_id: "task-1638123456789" }

--- Async Processing ---

goroutine processTask()
   │
   ├─► Load original image from storage
   ├─► [AI Processing Placeholder - Mock or External API]
   ├─► Save result image
   │
   ▼
ImageEditService.UpdateTaskStatus()
   │
   ├─► UPDATE image_edit_tasks SET status='completed', result_image='...'
   │
   ▼
Task completed

--- Frontend Polling ---

Frontend polls every 2s
   │
   │ GET /api/image-edit?task_id=task-1638123456789
   │
   ▼
ImageEditHandler.GetTaskStatus()
   │
   ▼
Response: { status: "completed", result_image: "result-xxx.jpg" }
```

---

## 技术栈映射

| 层级 | 技术/库 | 用途 |
|------|---------|------|
| **文件存储** | Go `os`, `filepath` | 文件系统操作 |
| **图像处理** | `github.com/disintegration/imaging` | 缩略图生成、裁剪、调整大小 |
| **系统信息** | `github.com/shirou/gopsutil/v3` | 内存、磁盘、CPU 信息 |
| **数据库** | GORM + SQLite/PostgreSQL | 资产、任务、缩略图元数据 |
| **HTTP 框架** | Gin | 路由、中间件、请求处理 |
| **异步处理** | goroutine + channel | 图片编辑任务队列 |

---

## 对比：Next.js API 实现

| 功能 | Next.js API 路径 | Go Backend 目标路径 | 状态 |
|------|------------------|---------------------|------|
| 博客资产列表 | `/api/asset?blogId=xxx` | `/api/posts/:id/assets` | ❌ → ✅ |
| 上传博客资产 | `/api/asset?blogId=xxx` | `/api/posts/:id/assets` | ❌ → ✅ |
| 获取资产 | `/api/asset?blogId=xxx&fileName=xxx` | `/api/posts/:id/assets/:file` | ❌ → ✅ |
| 删除资产 | `/api/asset?blogId=xxx&fileName=xxx` | `/api/posts/:id/assets/:file` | ❌ → ✅ |
| 上传图片+缩略图 | `/api/asset/image?generateThumbnail=true` | `/api/images/upload?generateThumbnail=true` | ❌ → ✅ |
| 获取缩略图 | `/api/asset/thumbnail/:id` | `/api/images/:id/thumbnail` | ❌ → ✅ |
| 创建编辑任务 | `/api/image-edit` (POST) | `/api/image-edit` (POST) | ❌ → ✅ |
| 查询任务状态 | `/api/image-edit?task_id=xxx` | `/api/image-edit?task_id=xxx` | ❌ → ✅ |
| 停止任务 | `/api/image-edit?task_id=xxx` (PUT) | `/api/image-edit?task_id=xxx` (PUT) | ❌ → ✅ |
| 重试任务 | `/api/image-edit?task_id=xxx` (PATCH) | `/api/image-edit?task_id=xxx` (PATCH) | ❌ → ✅ |
| 删除任务 | `/api/image-edit?task_id=xxx` (DELETE) | `/api/image-edit?task_id=xxx` (DELETE) | ❌ → ✅ |
| 系统状态 | `/api/system` (GET) | `/api/system/status` (GET) | ❌ → ✅ |

---

## 部署架构

```
┌────────────────────────────────────────────────────────────────┐
│                         Docker Container                       │
├────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐      ┌─────────────────────────────┐  │
│  │  Next.js Frontend   │      │  Go Backend                 │  │
│  │  Port: 3000         │◄────►│  Port: 8080                 │  │
│  └─────────────────────┘      └─────────────┬───────────────┘  │
│                                             │                  │
│  ┌───────────────────────────────────────────▼─────────────┐   │
│  │                      Shared Volume                      │   │
│  │  /app/storage/                                          │   │
│  │  ├── images/                                            │   │
│  │  ├── thumbnails/                                        │   │
│  │  ├── blog-assets/                                       │   │
│  │  └── image-edit/                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                    SQLite Database                     │    │
│  │  /app/data/nextblog.db                                 │    │
│  │  - posts, notes, categories, tags                      │    │
│  │  - images (新增 thumbnail_id 字段)                       │   │
│  │  - file_resources (文件元数据：ID、原始名、扩展名)          │    │
│  │  - post_asset_relations (博客-资产关联)                  │    │
│  │  - image_edit_tasks (编辑任务)                           │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
           │                                │
           │ HTTP :3000                     │ HTTP :8080
           ▼                                ▼
     [ Browser / Client ]
```

---

生成时间：2025-11-30  
文档版本：v1.0  
提案ID：add-go-backend-asset-apis

