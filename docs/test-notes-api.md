# Notes API 测试指南

使用以下命令测试笔记 API 功能：

## 1. 创建笔记

```bash
# 创建一个私密笔记
curl -X POST http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "data": "这是我的第一条笔记",
    "isPublic": false,
    "tags": ["测试", "开发"]
  }'
```

**预期响应**:
```json
{
  "id": "20251019143020123456",
  "createdAt": "2025-10-19T06:30:20.000Z",
  "updatedAt": "2025-10-19T06:30:20.000Z",
  "data": "这是我的第一条笔记",
  "isPublic": false,
  "tags": ["测试", "开发"]
}
```

## 2. 获取笔记列表

```bash
# 获取所有笔记
curl http://localhost:3000/api/notes

# 获取第2页，每页10条
curl "http://localhost:3000/api/notes?page=2&pageSize=10"

# 按标签过滤
curl "http://localhost:3000/api/notes?tag=测试"

# 只获取公开笔记
curl "http://localhost:3000/api/notes?isPublic=true"

# 组合查询
curl "http://localhost:3000/api/notes?tag=测试&isPublic=false&page=1&pageSize=10"
```

## 3. 获取单个笔记

```bash
# 替换 {NOTE_ID} 为实际的笔记 ID
curl "http://localhost:3000/api/notes?id={NOTE_ID}"
```

## 4. 更新笔记

```bash
# 更新笔记内容
curl -X PUT http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "id": "20251019143020123456",
    "data": "更新后的笔记内容"
  }'

# 将笔记改为公开
curl -X PUT http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "id": "20251019143020123456",
    "isPublic": true
  }'

# 更新标签
curl -X PUT http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "id": "20251019143020123456",
    "tags": ["更新", "标签", "测试"]
  }'
```

## 5. 删除笔记

```bash
# 替换 {NOTE_ID} 为实际的笔记 ID
curl -X DELETE "http://localhost:3000/api/notes?id={NOTE_ID}"
```

## 完整测试流程

```bash
#!/bin/bash

# 1. 创建笔记
echo "=== 创建笔记 ==="
RESPONSE=$(curl -s -X POST http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "data": "测试笔记内容",
    "isPublic": false,
    "tags": ["测试"]
  }')

echo $RESPONSE | jq '.'

# 提取 ID
NOTE_ID=$(echo $RESPONSE | jq -r '.id')
echo "创建的笔记 ID: $NOTE_ID"

# 2. 获取笔记列表
echo -e "\n=== 获取笔记列表 ==="
curl -s http://localhost:3000/api/notes | jq '.'

# 3. 获取单个笔记
echo -e "\n=== 获取单个笔记 ==="
curl -s "http://localhost:3000/api/notes?id=$NOTE_ID" | jq '.'

# 4. 更新笔记
echo -e "\n=== 更新笔记 ==="
curl -s -X PUT http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"$NOTE_ID\",
    \"data\": \"更新后的内容\",
    \"isPublic\": true
  }" | jq '.'

# 5. 按标签过滤
echo -e "\n=== 按标签过滤 ==="
curl -s "http://localhost:3000/api/notes?tag=测试" | jq '.'

# 6. 删除笔记
echo -e "\n=== 删除笔记 ==="
curl -s -X DELETE "http://localhost:3000/api/notes?id=$NOTE_ID" | jq '.'

# 7. 验证删除
echo -e "\n=== 验证删除（应该返回404） ==="
curl -s "http://localhost:3000/api/notes?id=$NOTE_ID"
```

## 保存并运行测试脚本

将上述脚本保存为 `test-notes.sh`，然后运行：

```bash
chmod +x test-notes.sh
./test-notes.sh
```

## 使用 JavaScript 测试（浏览器控制台）

```javascript
// 在浏览器控制台中运行

// 1. 创建笔记
const createNote = await fetch('/api/notes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: '浏览器测试笔记',
    isPublic: false,
    tags: ['浏览器', '测试']
  })
}).then(r => r.json())

console.log('创建的笔记:', createNote)

// 2. 获取笔记列表
const notes = await fetch('/api/notes').then(r => r.json())
console.log('笔记列表:', notes)

// 3. 更新笔记
const updated = await fetch('/api/notes', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: createNote.id,
    isPublic: true
  })
}).then(r => r.json())

console.log('更新后的笔记:', updated)

// 4. 删除笔记
const deleted = await fetch(`/api/notes?id=${createNote.id}`, {
  method: 'DELETE'
}).then(r => r.json())

console.log('删除结果:', deleted)
```

## 检查存储文件

创建笔记后，可以查看生成的文件：

```bash
# 查看索引文件
cat blogs/notes/index.json | jq '.'

# 查看日期文件（替换日期）
cat blogs/notes/2025-10-19.json | jq '.'

# 列出所有笔记文件
ls -lh blogs/notes/
```

## 预期的文件结构

```
blogs/notes/
├── index.json          # 索引文件
├── 2025-10-19.json     # 今天的笔记
└── 2025-10-18.json     # 昨天的笔记
```

index.json 内容示例：
```json
{
  "files": {
    "2025-10-19.json": [
      {
        "id": "20251019143020123456",
        "isPublic": false,
        "tags": ["测试", "开发"]
      }
    ]
  },
  "tagged": {
    "测试": 3,
    "开发": 2
  }
}
```

