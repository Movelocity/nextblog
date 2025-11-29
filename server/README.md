# Next Blog - Go Backend Server

Go 后端服务，提供博客系统的 RESTful API。

## 技术栈

- **Go 1.22+**
- **Gin** - Web 框架
- **GORM** - ORM 框架
- **SQLite** - 数据库

## 项目结构

```
server/
├── cmd/
│   ├── server/         # 主服务器入口
│   └── migrate/        # 数据迁移工具
├── internal/
│   ├── api/            # API 路由和处理器
│   ├── config/         # 配置管理
│   ├── db/             # 数据库连接和初始化
│   ├── middleware/     # 中间件
│   ├── models/         # 数据模型
│   ├── repository/     # 数据访问层
│   └── service/        # 业务逻辑层
├── pkg/
│   └── utils/          # 工具函数
├── storage/            # 文件存储目录
│   ├── images/         # 图片文件
│   ├── uploads/        # 上传文件
│   └── thumbnails/     # 缩略图
├── data/               # SQLite 数据库文件
├── scripts/            # 迁移脚本
├── go.mod
├── go.sum
└── README.md
```

## 快速开始

### 1. 安装依赖

```bash
cd server
go mod download
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，修改配置
```

### 3. 数据迁移

将现有 Next.js 项目的数据迁移到 SQLite：

```bash
# 创建数据库并迁移数据
go run cmd/migrate/main.go --source ../blogs --db ./data/nextblog.db
```

### 4. 运行服务器

```bash
go run cmd/server/main.go
```

服务器默认运行在 `http://localhost:8080`

## API 文档

### Posts (博客文章)

- `GET /api/posts` - 获取文章列表
- `GET /api/posts/:id` - 获取文章详情
- `POST /api/posts` - 创建文章
- `PUT /api/posts/:id` - 更新文章
- `DELETE /api/posts/:id` - 删除文章

### Notes (笔记)

- `GET /api/notes` - 获取笔记列表
- `GET /api/notes/:date` - 获取指定日期的笔记
- `POST /api/notes` - 创建笔记
- `PUT /api/notes/:id` - 更新笔记
- `DELETE /api/notes/:id` - 删除笔记

### Categories (分类)

- `GET /api/categories` - 获取分类列表
- `GET /api/categories/:slug` - 获取分类详情

### Tags (标签)

- `GET /api/tags` - 获取标签列表

### Images (图片)

- `GET /api/images/:filename` - 获取图片
- `POST /api/images/upload` - 上传图片

### System (系统配置)

- `GET /api/config` - 获取站点配置
- `PUT /api/config` - 更新站点配置

## 开发

### 运行测试

```bash
go test ./...
```

### 构建

```bash
go build -o bin/server cmd/server/main.go
```

### 部署

使用 Docker：

```bash
docker build -t nextblog-server:latest .
docker run -d -p 8080:8080 -v $(pwd)/data:/app/data -v $(pwd)/storage:/app/storage nextblog-server:latest
```

## 许可证

MIT

