# Image Assets and Editing API Documentation

本文档描述了 NextBlog 项目中图片资产管理和图片编辑相关的 API 接口。

## 目录

- [图片编辑 API (`/api/image-edit`)](#图片编辑-api-apiimage-edit)
- [图片资产上传 API (`/api/asset/image`)](#图片资产上传-api-apiassetimage)
- [图片资产获取 API (`/api/asset/image/[id]`)](#图片资产获取-api-apiassetimageid)
- [缩略图获取 API (`/api/asset/thumbnail/[id]`)](#缩略图获取-api-apiassetthumbnailid)
- [错误响应格式](#错误响应格式)
- [认证说明](#认证说明)

---

## 图片编辑 API (`/api/image-edit`)

图片编辑 API 提供基于 AI 的图片编辑功能，采用异步任务处理模式。

### GET - 获取任务状态

获取图片编辑任务的状态和详情。

**请求**
```
GET /api/image-edit?task_id={task_id}
```

**参数**
- `task_id` (string, required): 任务唯一标识符

**响应**
```json
{
  "id": "string",
  "status": "processing" | "completed" | "failed",
  "original_image": "string",
  "result_image": "string",
  "prompt": "string",
  "message": "string",
  "created_at": 1234567890,
  "updated_at": 1234567890
}
```

**响应字段说明**
- `id`: 任务 ID
- `status`: 任务状态（处理中/已完成/失败）
- `original_image`: 原始图片 ID（使用 `/api/asset/image/{id}` 获取实际图片）
- `result_image`: 结果图片 ID（仅在完成时可用）
- `prompt`: 用户提供的编辑指令
- `message`: 错误或状态消息
- `created_at`: 任务创建时间戳
- `updated_at`: 最后更新时间戳

**错误响应**
- `400`: Task ID 缺失
- `404`: 任务不存在

### POST - 开始编辑任务

启动一个新的图片编辑任务。**需要认证**。

**请求**
```
POST /api/image-edit
Content-Type: application/json
```

**请求体**
```json
{
  "orig_img": "string",
  "prompt": "string"
}
```

**参数说明**
- `orig_img` (string, required): 原始图片 ID（不是 URL 或 base64）
- `prompt` (string, required): 编辑指令描述

**响应**
```json
{
  "task_id": "string"
}
```

**错误响应**
- `400`: 缺少必需参数
- `401`: 未认证
- `500`: 服务器内部错误

### PUT - 停止任务

停止正在运行的任务但保留在存储中，状态设为 "failed"。**需要认证**。

**请求**
```
PUT /api/image-edit?task_id={task_id}
```

**参数**
- `task_id` (string, required): 任务 ID

**响应**
```json
{
  "message": "Task stopped"
}
```

### DELETE - 删除任务

停止任务并从存储中完全删除。**需要认证**。

**请求**
```
DELETE /api/image-edit?task_id={task_id}
```

**参数**
- `task_id` (string, required): 任务 ID

**响应**
```json
{
  "message": "Task stopped"
}
```

---

## 图片资产上传 API (`/api/asset/image`)

### POST - 上传图片

上传新的图片资产。**需要认证**。

**请求**
```
POST /api/asset/image?generateThumbnail={true/false}
Content-Type: multipart/form-data
```

**参数**
- `generateThumbnail` (boolean, optional): 是否生成缩略图，默认为 false

**表单数据**
- `file` (File, required): 要上传的图片文件

**支持的文件格式**
- JPG/JPEG
- PNG
- WebP

**响应**
```json
{
  "success": true,
  "id": "string",
  "originalName": "string"
}
```

**响应字段说明**
- `success`: 上传是否成功
- `id`: 生成的图片 ID（用于后续访问）
- `originalName`: 原始文件名

**错误响应**
- `400`: 文件缺失或格式不支持
- `401`: 未认证
- `500`: 服务器内部错误

**注意事项**
- 如果请求生成缩略图，系统会自动创建 180x180 像素的缩略图
- 缩略图生成失败不会影响原图上传
- 缩略图使用相同的 ID，可通过 `/api/asset/thumbnail/{id}` 访问

---

## 图片资产获取 API (`/api/asset/image/[id]`)

### GET - 获取图片

根据 ID 获取图片资产。

**请求**
```
GET /api/asset/image/{id}
```

**参数**
- `id` (string, required): 图片 ID

**响应**
- 成功时返回图片二进制数据
- Content-Type 根据文件扩展名自动设置
- 包含适当的缓存头（1年缓存）

**响应头**
- `Content-Type`: 根据文件扩展名确定的 MIME 类型
- `Content-Disposition`: attachment; filename="{id}"
- `Cache-Control`: public, max-age=31536000
- `Content-Length`: 文件大小

**错误响应**
- `400`: ID 缺失或无效（包含 ".." 或 "/"）
- `404`: 图片不存在
- `500`: 服务器内部错误

### DELETE - 删除图片

删除指定的图片资产及其缩略图。**需要认证**。

**请求**
```
DELETE /api/asset/image/{id}
```

**参数**
- `id` (string, required): 图片 ID

**响应**
```json
{
  "success": true,
  "message": "Image asset and thumbnail deleted successfully"
}
```

**错误响应**
- `400`: ID 缺失或无效
- `401`: 未认证
- `500`: 服务器内部错误

**注意事项**
- 删除图片时会同时删除对应的缩略图
- 删除操作不可逆

---

## 缩略图获取 API (`/api/asset/thumbnail/[id]`)

### GET - 获取缩略图

根据 ID 获取图片的缩略图。

**请求**
```
GET /api/asset/thumbnail/{id}
```

**参数**
- `id` (string, required): 缩略图 ID（与原图 ID 相同）

**响应**
- 成功时返回缩略图二进制数据（180x180 像素）
- Content-Type 根据文件扩展名自动设置
- 包含适当的缓存头（1年缓存）

**响应头**
- `Content-Type`: 根据文件扩展名确定的 MIME 类型
- `Content-Disposition`: attachment; filename="thumb_{id}"
- `Cache-Control`: public, max-age=31536000
- `Content-Length`: 文件大小

**错误响应**
- `400`: ID 缺失或无效（包含 ".." 或 "/"）
- `404`: 缩略图不存在
- `500`: 服务器内部错误

**注意事项**
- 缩略图尺寸固定为 180x180 像素
- 缩略图格式为 JPEG，质量 80%
- 只有在上传图片时指定 `generateThumbnail=true` 才会有缩略图

---

## 错误响应格式

所有 API 的错误响应都遵循统一格式：

```json
{
  "error": "错误描述信息"
}
```

**常见 HTTP 状态码**
- `200`: 成功
- `400`: 请求参数错误
- `401`: 未认证或认证失败
- `404`: 资源不存在
- `500`: 服务器内部错误

---

## 认证说明

部分 API 端点需要认证：

**需要认证的端点**
- `POST /api/image-edit`
- `PUT /api/image-edit`
- `DELETE /api/image-edit`
- `POST /api/asset/image`
- `DELETE /api/asset/image/{id}`

**无需认证的端点**
- `GET /api/image-edit`
- `GET /api/asset/image/{id}`
- `GET /api/asset/thumbnail/{id}`

认证通过 JWT token 实现，需要在请求头中包含有效的认证信息。

---

## 使用示例

### 完整的图片编辑工作流

1. **上传图片**
```javascript
const formData = new FormData();
formData.append('file', imageFile);

const uploadResponse = await fetch('/api/asset/image?generateThumbnail=true', {
  method: 'POST',
  body: formData,
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});

const { id: imageId } = await uploadResponse.json();
```

2. **开始编辑任务**
```javascript
const editResponse = await fetch('/api/image-edit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: JSON.stringify({
    orig_img: imageId,
    prompt: '将背景改为蓝色'
  })
});

const { task_id } = await editResponse.json();
```

3. **轮询任务状态**
```javascript
const checkStatus = async () => {
  const statusResponse = await fetch(`/api/image-edit?task_id=${task_id}`);
  const taskInfo = await statusResponse.json();
  
  if (taskInfo.status === 'completed') {
    // 使用 taskInfo.result_image 获取编辑后的图片
    const editedImageUrl = `/api/asset/image/${taskInfo.result_image}`;
    console.log('编辑完成:', editedImageUrl);
  } else if (taskInfo.status === 'failed') {
    console.error('编辑失败:', taskInfo.message);
  } else {
    // 继续轮询
    setTimeout(checkStatus, 2000);
  }
};

checkStatus();
```

4. **获取图片和缩略图**
```javascript
// 获取原图
const originalImage = `/api/asset/image/${imageId}`;

// 获取缩略图
const thumbnail = `/api/asset/thumbnail/${imageId}`;

// 获取编辑后的图片
const editedImage = `/api/asset/image/${taskInfo.result_image}`;
```

### 支持的 MIME 类型

系统支持以下文件类型的自动 MIME 类型识别：

**图片格式**
- PNG: `image/png`
- JPG/JPEG: `image/jpeg`
- WebP: `image/webp`
- GIF: `image/gif`
- SVG: `image/svg+xml`
- ICO: `image/x-icon`
- BMP: `image/bmp`
- TIFF: `image/tiff`

其他格式将使用默认的 `application/octet-stream`。
