# Notes API 使用文档

笔记系统是一个轻量级的随手记功能，支持标签分类、公开/私密设置、分页查询等功能。

## 数据结构

### NoteData

```typescript
type NoteData = {
  id: string,           // 笔记ID，格式：YYYYMMDDHHMMSSXXXXXX
  createdAt: string,    // 创建时间（ISO 8601）
  updatedAt: string,    // 更新时间（ISO 8601）
  data: string,         // 笔记内容
  isPublic: boolean,    // 是否公开
  tags: string[]        // 标签列表
}
```

### 存储结构

- **笔记文件**: 按日期存储在 `blogs/notes/YYYY-MM-DD.json`
- **索引文件**: `blogs/notes/index.json`
  ```json
  {
    "files": {
      "2025-10-19.json": [
        {
          "id": "20251019143020123456",
          "isPublic": false,
          "tags": ["工作", "待办"]
        }
      ]
    },
    "tagged": {
      "工作": 5,
      "待办": 3,
      "学习": 8
    }
  }
  ```

## API 端点

### 1. 获取笔记列表

**GET** `/api/notes`

**查询参数**:
- `page`: 页码（默认: 1）
- `pageSize`: 每页数量（默认: 20）
- `tag`: 标签过滤（可选）
- `isPublic`: 公开/私密过滤（可选，true/false）

**响应**:
```json
{
  "notes": [
    {
      "id": "20251019143020123456",
      "createdAt": "2025-10-19T06:30:20.000Z",
      "updatedAt": "2025-10-19T06:30:20.000Z",
      "data": "今天要完成的任务...",
      "isPublic": false,
      "tags": ["工作", "待办"]
    }
  ],
  "total": 42,
  "page": 1,
  "pageSize": 20
}
```

**示例**:
```typescript
// 获取第一页（默认）
const response = await fetch('/api/notes')

// 获取第二页，每页10条
const response = await fetch('/api/notes?page=2&pageSize=10')

// 按标签过滤
const response = await fetch('/api/notes?tag=工作')

// 只获取公开笔记
const response = await fetch('/api/notes?isPublic=true')

// 使用服务函数
import { fetchNotes } from '@/app/services/notes'
const result = await fetchNotes({ page: 1, pageSize: 20, tag: '工作' })
```

### 2. 获取单个笔记

**GET** `/api/notes?id={noteId}`

**查询参数**:
- `id`: 笔记ID（必需）

**响应**:
```json
{
  "id": "20251019143020123456",
  "createdAt": "2025-10-19T06:30:20.000Z",
  "updatedAt": "2025-10-19T06:30:20.000Z",
  "data": "笔记内容...",
  "isPublic": false,
  "tags": ["工作"]
}
```

**示例**:
```typescript
// 直接调用
const response = await fetch('/api/notes?id=20251019143020123456')

// 使用服务函数
import { fetchNote } from '@/app/services/notes'
const note = await fetchNote('20251019143020123456')
```

### 3. 创建笔记

**POST** `/api/notes`

**请求体**:
```json
{
  "data": "笔记内容",
  "isPublic": false,
  "tags": ["标签1", "标签2"]
}
```

**字段说明**:
- `data`: 笔记内容（必需）
- `isPublic`: 是否公开（可选，默认: false）
- `tags`: 标签数组（可选，默认: []）

**响应**: 返回创建的笔记对象（201 Created）

**示例**:
```typescript
// 直接调用
const response = await fetch('/api/notes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: '今天学习了 React Hooks',
    isPublic: false,
    tags: ['学习', 'React']
  })
})

// 使用服务函数
import { createNote } from '@/app/services/notes'
const note = await createNote({
  data: '今天学习了 React Hooks',
  isPublic: false,
  tags: ['学习', 'React']
})
```

### 4. 更新笔记

**PUT** `/api/notes`

**请求体**:
```json
{
  "id": "20251019143020123456",
  "data": "更新后的内容",
  "isPublic": true,
  "tags": ["更新的标签"]
}
```

**字段说明**:
- `id`: 笔记ID（必需）
- `data`: 笔记内容（可选）
- `isPublic`: 是否公开（可选）
- `tags`: 标签数组（可选）

**响应**: 返回更新后的笔记对象

**示例**:
```typescript
// 更新内容
const response = await fetch('/api/notes', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: '20251019143020123456',
    data: '更新后的笔记内容'
  })
})

// 将笔记设为公开
const response = await fetch('/api/notes', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: '20251019143020123456',
    isPublic: true
  })
})

// 使用服务函数
import { updateNote } from '@/app/services/notes'
const note = await updateNote({
  id: '20251019143020123456',
  isPublic: true,
  tags: ['工作', '重要']
})
```

### 5. 删除笔记

**DELETE** `/api/notes?id={noteId}`

**查询参数**:
- `id`: 笔记ID（必需）

**响应**:
```json
{
  "success": true
}
```

**示例**:
```typescript
// 直接调用
const response = await fetch('/api/notes?id=20251019143020123456', {
  method: 'DELETE'
})

// 使用服务函数
import { deleteNote } from '@/app/services/notes'
const result = await deleteNote('20251019143020123456')
```

## 使用场景示例

### 场景 1: 创建快速笔记

```typescript
import { createNote } from '@/app/services/notes'

const handleQuickNote = async (content: string) => {
  try {
    const note = await createNote({
      data: content,
      isPublic: false
    })
    console.log('笔记创建成功:', note.id)
  } catch (error) {
    console.error('创建失败:', error)
  }
}
```

### 场景 2: 按标签浏览笔记

```typescript
import { fetchNotes } from '@/app/services/notes'

const NotesListByTag = ({ tag }: { tag: string }) => {
  const [notes, setNotes] = useState([])
  
  useEffect(() => {
    const loadNotes = async () => {
      const result = await fetchNotes({ tag, page: 1, pageSize: 10 })
      setNotes(result.notes)
    }
    loadNotes()
  }, [tag])
  
  // 渲染笔记列表...
}
```

### 场景 3: 将私密笔记改为公开

```typescript
import { updateNote } from '@/app/services/notes'

const handlePublishNote = async (noteId: string) => {
  try {
    const updated = await updateNote({
      id: noteId,
      isPublic: true
    })
    console.log('笔记已公开')
  } catch (error) {
    console.error('更新失败:', error)
  }
}
```

### 场景 4: 分页加载笔记

```typescript
import { fetchNotes } from '@/app/services/notes'

const NotesList = () => {
  const [notes, setNotes] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20
  
  const loadNotes = async (pageNum: number) => {
    const result = await fetchNotes({ page: pageNum, pageSize })
    setNotes(result.notes)
    setTotal(result.total)
  }
  
  useEffect(() => {
    loadNotes(page)
  }, [page])
  
  // 渲染笔记列表和分页控件...
}
```

## 错误处理

所有 API 在出错时会返回相应的 HTTP 状态码和错误信息：

```json
{
  "error": "错误描述"
}
```

常见状态码：
- `400`: 请求参数错误
- `404`: 笔记不存在
- `500`: 服务器内部错误

## 特性

✅ **自动索引**: 创建/更新/删除笔记时自动更新索引文件  
✅ **标签统计**: 索引文件自动统计每个标签的笔记数量  
✅ **按日期存储**: 笔记按日期分组存储，便于管理和备份  
✅ **分页查询**: 支持高效的分页加载  
✅ **多维过滤**: 支持按标签和公开状态过滤  
✅ **默认私密**: 新笔记默认为私密状态，保护隐私  
✅ **时间追踪**: 自动记录创建和更新时间

