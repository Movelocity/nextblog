# Image Edit API 文档

本文档描述了图片编辑相关的API接口，包括文件管理和任务管理两个主要模块。

## 概述

图片编辑API提供以下功能：
- 文件上传、下载、删除
- AI图片编辑任务的创建、查询、停止和删除
- 基于Gemini API的图片编辑功能

## 基础信息

- **基础路径**: `/api/image-edit`
- **认证方式**: 部分接口需要认证（使用`requireAuth`中间件）
- **文件存储**: 本地文件系统存储
- **支持格式**: JPG, PNG, WebP

## API 接口

### 1. 文件管理 (`/api/asset/image`) - 统一图片资产管理

#### 1.1 获取图片文件

**GET** `/api/asset/image?blogId={blogId}&fileName={fileName}&thumbnail={true/false}`

获取指定的图片文件，支持缩略图生成。

**参数:**
- `blogId` (query, required): 博客ID，使用 `image-edit` 作为图片编辑独立存储空间
- `fileName` (query, required): 文件名
- `thumbnail` (query, optional): 是否返回缩略图版本 (true/false)

**响应:**
- **200**: 返回文件内容
  - Headers:
    - `Content-Type`: 根据文件扩展名设置的MIME类型
    - `Content-Disposition`: `attachment; filename="{fileName}"`
    - `Cache-Control`: `public, max-age=31536000`
    - `Content-Length`: 文件大小
- **400**: 无效的参数
- **404**: 文件不存在
- **500**: 服务器错误

**示例:**
```bash
# 获取原图
GET /api/asset/image?blogId=image-edit&fileName=20240101120000000-123456.png

# 获取缩略图
GET /api/asset/image?blogId=image-edit&fileName=20240101120000000-123456.png&thumbnail=true
```

#### 1.2 上传图片文件

**POST** `/api/asset/image?blogId={blogId}&generateThumbnail={true/false}` 🔒

上传新的图片文件到系统，支持自动生成缩略图。

**认证:** 需要认证

**参数:**
- `blogId` (query, required): 博客ID，使用 `image-edit` 作为图片编辑独立存储空间
- `generateThumbnail` (query, optional): 是否生成缩略图 (true/false)

**请求体:** `multipart/form-data`
- `file` (File, required): 要上传的图片文件 (支持 JPG, PNG, WebP)

**响应:**
- **200**: 上传成功
  ```json
  {
    "success": true,
    "assetPath": "image-edit/20240101120000000-123456.png",
    "id": "20240101120000000-123456.png",
    "originalName": "original-filename.png",
    "thumbnail": {
      "id": "20240101120000001-654321.thumb.png",
      "path": "image-edit/20240101120000001-654321.thumb.png"
    }
  }
  ```
- **400**: 不支持的文件类型
- **500**: 服务器错误

**示例:**
```bash
POST /api/asset/image?blogId=image-edit&generateThumbnail=true
Content-Type: multipart/form-data

file: [binary data]
```

#### 1.3 删除图片文件

**DELETE** `/api/asset/image?blogId={blogId}&fileName={fileName}` 🔒

删除指定的图片文件。

**认证:** 需要认证

**参数:**
- `blogId` (query, required): 博客ID
- `fileName` (query, required): 文件名

**响应:**
- **200**: 删除成功
  ```json
  {
    "success": true,
    "message": "Image asset deleted successfully"
  }
  ```
- **400**: 参数缺失或无效
- **404**: 文件不存在
- **500**: 服务器错误

### 2. 任务管理 (`/api/image-edit`)

#### 2.1 查询任务状态

**GET** `/api/image-edit?task_id={task_id}`

查询指定任务的状态和详情。

**参数:**
- `task_id` (query, required): 任务ID

**响应:**
- **200**: 任务详情
  ```json
  {
    "id": "20240101120000000-123456",
    "status": "processing|completed|failed",
    "original_image": {
      "id": "original_image_id.png",
      "thumb_id": "original_thumb_id.png"
    },
    "result_image": {
      "id": "result_image_id.png",
      "thumb_id": "result_thumb_id.png"
    },
    "prompt": "编辑提示词",
    "created_at": 1704067200000,
    "updated_at": 1704067200000
  }
  ```
- **400**: 任务ID参数缺失
- **404**: 任务不存在

#### 2.2 创建编辑任务

**POST** `/api/image-edit` 🔒

创建新的图片编辑任务。

**认证:** 需要认证

**请求体:**
```json
{
  "orig_img": "original_image_id.png",
  "orig_thumb": "original_thumbnail_id.png", 
  "prompt": "编辑提示词，例如：给这个人戴上帽子"
}
```

**参数说明:**
- `orig_img` (string, required): 原始图片文件ID
- `orig_thumb` (string, required): 原始图片缩略图ID
- `prompt` (string, required): 图片编辑提示词

**响应:**
- **200**: 任务创建成功
  ```json
  {
    "task_id": "20240101120000000-123456"
  }
  ```
- **400**: 缺少必需参数
- **500**: 服务器错误

#### 2.3 停止任务

**PUT** `/api/image-edit?task_id={task_id}` 🔒

停止正在进行的任务。

**认证:** 需要认证

**参数:**
- `task_id` (query, required): 任务ID

**响应:**
- **200**: 任务停止成功
  ```json
  {
    "message": "Task stopped"
  }
  ```
- **400**: 任务ID参数缺失

#### 2.4 删除任务

**DELETE** `/api/image-edit?task_id={task_id}` 🔒

删除指定的任务（会先停止任务再删除）。

**认证:** 需要认证

**参数:**
- `task_id` (query, required): 任务ID

**响应:**
- **200**: 任务删除成功
  ```json
  {
    "message": "Task stopped"
  }
  ```
- **400**: 任务ID参数缺失

## 数据类型

### TaskStatus
任务状态枚举：
- `processing`: 处理中
- `completed`: 已完成
- `failed`: 失败

### ImageData
图片数据结构：
```typescript
{
  id: string;        // 图片文件ID
  thumb_id: string;  // 缩略图文件ID
}
```

### TaskResponse
任务响应数据结构：
```typescript
{
  id: string;
  status: "processing" | "completed" | "failed";
  original_image: ImageData;
  result_image?: ImageData;
  prompt: string;
  message?: string;      // 错误信息（如果有）
  created_at: number;    // 创建时间戳
  updated_at: number;    // 更新时间戳
}
```

## 工作流程

### 典型的图片编辑流程：

1. **上传原始图片**
   ```bash
   POST /api/asset/image?blogId=image-edit&generateThumbnail=true
   # 返回: { 
   #   "id": "original_image_id.png",
   #   "thumbnail": { "id": "original_thumb_id.png" }
   # }
   ```

2. **创建编辑任务**
   ```bash
   POST /api/image-edit
   Body: {
     "orig_img": "original_image_id.png",
     "orig_thumb": "original_thumb_id.png",
     "prompt": "给这个人戴上红色帽子"
   }
   # 返回: { "task_id": "task_123456" }
   ```

3. **轮询任务状态**
   ```bash
   GET /api/image-edit?task_id=task_123456
   # 返回任务状态，直到 status 为 "completed" 或 "failed"
   ```

4. **下载结果图片**
   ```bash
   # 下载原图
   GET /api/asset/image?blogId=image-edit&fileName=result_image_id.png
   
   # 下载缩略图
   GET /api/asset/image?blogId=image-edit&fileName=result_image_id.png&thumbnail=true
   ```

## 错误处理

所有API都遵循标准的HTTP状态码：
- `200`: 成功
- `400`: 请求参数错误
- `401`: 未认证（需要登录）
- `404`: 资源不存在
- `500`: 服务器内部错误

错误响应格式：
```json
{
  "error": "错误描述信息"
}
```

## 注意事项

1. **认证要求**: 标记🔒的接口需要用户认证
2. **文件安全**: 文件ID包含路径遍历保护，不允许包含`..`和`/`字符
3. **任务超时**: 任务默认600秒超时，超时后自动停止
4. **文件存储**: 文件通过统一的 BlogStorage 系统存储，`image-edit` 作为特殊 blogId 拥有独立存储空间
5. **缩略图**: 系统会自动为结果图片生成180x180的缩略图
6. **ID生成规则**: 文件ID格式为`yyyymmddhhmmssmmm-rand6.ext`

## 环境变量配置

使用Gemini API需要配置以下环境变量：
```env
GEMINI_API_URL=https://generativelanguage.googleapis.com
GEMINI_API_ENDPOINT=/v1beta/models/gemini-2.0-flash-exp:generateContent
GEMINI_API_KEY=your_api_key_here
```

> **注意**: 当前实现中使用了模拟响应，实际部署时需要取消注释真实的Gemini API调用代码。
